import { OpenAI } from 'openai';
import * as FileSystem from 'expo-file-system';
import { getSettings } from '@/utils/storageUtil';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifySolutionComplete, schedulePracticeReminder } from '@/utils/notificationUtil';
import * as math from 'mathjs';

const OFFLINE_CACHE_KEY = 'math_operations_cache';
const IMAGE_PROCESS_CACHE_KEY = 'image_process_cache';

interface CachedOperation {
    input: string;
    result: MathProblemResult;
    timestamp: number;
}

interface CachedImageProcess {
    imageHash: string;
    extractedExpression: string;
    timestamp: number;
}

const getOpenAIApiKey = async (): Promise<string> => {
    try {
        const storedKey = await AsyncStorage.getItem('openai_api_key');
        if (storedKey && storedKey.length > 0) {
            console.log('Using OpenAI API key from user settings');
            return storedKey;
        }

        const envKey = Constants.expoConfig?.extra?.openaiApiKey ||
            Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY || '';

        if (envKey && envKey.length > 0) {
            console.log('Using OpenAI API key from environment variables');
            return envKey;
        }

        console.log('No OpenAI API key found');
        return '';
    } catch (error) {
        console.error('Error getting OpenAI API key:', error);
        return '';
    }
};

const getWolframAlphaApiKey = async (): Promise<string> => {
    try {
        const storedKey = await AsyncStorage.getItem('wolfram_alpha_api_key');
        if (storedKey && storedKey.length > 0) {
            console.log('Using Wolfram Alpha API key from user settings');
            return storedKey;
        }

        const envKey = Constants.expoConfig?.extra?.wolframApiKey ||
            Constants.expoConfig?.extra?.EXPO_PUBLIC_WOLFRAM_API_KEY || '';

        if (envKey && envKey.length > 0) {
            console.log('Using Wolfram Alpha API key from environment variables');
            return envKey;
        }

        console.log('No Wolfram Alpha API key found');
        return '';
    } catch (error) {
        console.error('Error getting Wolfram Alpha API key:', error);
        return '';
    }
};

export const getOpenAIClient = async (): Promise<OpenAI> => {
    const apiKey = await getOpenAIApiKey();

    if (!apiKey) {
        throw new Error('OpenAI API key is required for this feature. Please add your API key in Settings.');
    }

    return new OpenAI({
        apiKey: apiKey,
    });
};

interface MathProblemResult {
    originalProblem: string;
    solution: string;
    explanation: string;
    latexExpression: string;
    error: string | null;
    exercises?: MathProblemResult[];
}

/**
 * Gets the appropriate system prompt based on user preferences
 */
const getSystemPrompt = async (isForImage: boolean = false): Promise<string> => {
    try {
        const settings = await getSettings();
        const isDetailedMode = settings?.aiResponseLength === 'detailed';

        if (isForImage) {
            if (isDetailedMode) {
                return "You are an expert mathematics assistant. Analyze the image containing a math problem, solve it, and explain the solution in detail. Provide a comprehensive step-by-step explanation covering all mathematical concepts and rules used. Explain as if teaching the concept to someone who's learning the topic. Include a clear response with: 1) The original problem, 2) The final answer/solution, 3) A detailed step-by-step explanation, and 4) A LaTeX representation if applicable. Format your response as JSON with fields: 'solution', 'explanation', and 'latexExpression'.";
            } else {
                return "You are an expert mathematics assistant. Analyze the image containing a math problem, solve it, and explain the solution briefly. Be concise and direct - focus on the key steps only without lengthy explanations. Provide: 1) The original problem, 2) The final answer/solution, 3) A brief step-by-step explanation showing only the essential steps, and 4) A LaTeX representation if applicable. Format your response as JSON with fields: 'solution', 'explanation', and 'latexExpression'.";
            }
        } else {
            if (isDetailedMode) {
                return "You are an expert mathematics assistant. Analyze, solve, and explain mathematical problems in detail. Provide a comprehensive step-by-step explanation covering all mathematical concepts and rules used. Explain as if teaching the concept to someone who's learning the topic. Include the solution, a clear explanation of the steps, and a LaTeX representation of the mathematical expression. Format your response as JSON with 'solution', 'explanation', and 'latexExpression' fields.";
            } else {
                return "You are an expert mathematics assistant. Analyze, solve, and explain mathematical problems briefly and directly. Be concise - focus on the key steps only without lengthy explanations. Provide the solution, a brief explanation of the essential steps, and a LaTeX representation of the mathematical expression. Format your response as JSON with 'solution', 'explanation', and 'latexExpression' fields.";
            }
        }
    } catch (error) {
        console.error('Error getting system prompt:', error);
        return isForImage
            ? "You are an expert mathematics assistant. Analyze the image containing a math problem, solve it, and explain the solution in detail. Provide a clear response with: 1) The original problem, 2) The final answer/solution, 3) A step-by-step explanation, and 4) A LaTeX representation if applicable. Format your response as JSON with fields: 'solution', 'explanation', and 'latexExpression'."
            : "You are an expert mathematics assistant. Analyze, solve, and explain mathematical problems in detail. Provide the solution, a clear explanation of the steps, and a LaTeX representation of the mathematical expression. Format your response as JSON with 'solution', 'explanation', and 'latexExpression' fields.";
    }
};

/**
 * Attempt to solve a math problem locally using mathjs
 */
const solveWithMathJs = (expression: string): MathProblemResult | null => {
    try {
        console.log('Attempting to solve with mathjs:', expression);
        const cleanedExpression = expression
            .replace(/÷/g, '/')
            .replace(/×/g, '*')
            .replace(/−/g, '-')
            .replace(/[^\d+\-*/().^%=<>!&|]/g, '');

        const result = math.evaluate(cleanedExpression);
        console.log('Mathjs result:', result);

        const solution = typeof result === 'number'
            ? result.toString()
            : Array.isArray(result)
                ? result.join(', ')
                : result.toString();

        const explanation = generateBasicExplanation(cleanedExpression, solution);

        return {
            originalProblem: expression,
            solution,
            explanation,
            latexExpression: `${expression} = ${solution}`,
            error: null
        };
    } catch (error) {
        console.log('Mathjs evaluation failed:', error);
        return null;
    }
};

/**
 * Generate basic explanation for simple math operations
 */
const generateBasicExplanation = (expression: string, result: string): string => {
    return `To solve ${expression}, I evaluated the expression directly using the order of operations (PEMDAS).\n\nThe result is ${result}.`;
};

/**
 * Get cached math operation result if available
 */
const getCachedOperation = async (input: string): Promise<MathProblemResult | null> => {
    try {
        const cacheString = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
        if (!cacheString) return null;

        const cache: CachedOperation[] = JSON.parse(cacheString);
        const now = Date.now();
        const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

        const cachedOp = cache.find(op =>
            op.input === input && (now - op.timestamp) < MAX_CACHE_AGE
        );

        return cachedOp ? cachedOp.result : null;
    } catch (error) {
        console.error('Error retrieving from cache:', error);
        return null;
    }
};

/**
 * Save operation to cache for offline use
 */
const cacheOperation = async (input: string, result: MathProblemResult): Promise<void> => {
    try {
        const cacheString = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
        const cache: CachedOperation[] = cacheString ? JSON.parse(cacheString) : [];

        const filteredCache = cache.filter(op => op.input !== input);

        filteredCache.push({
            input,
            result,
            timestamp: Date.now()
        });

        const trimmedCache = filteredCache.slice(-100);

        await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(trimmedCache));
    } catch (error) {
        console.error('Error saving to cache:', error);
    }
};

/**
 * Generate a simple hash for an image to use for caching
 */
const generateImageHash = async (imageUri: string): Promise<string> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        const sizeValue = 'size' in fileInfo && typeof fileInfo.size === 'number'
            ? fileInfo.size
            : 0;

        return `${sizeValue}_${imageUri.split('/').pop()}`;
    } catch (error) {
        console.error('Error generating image hash:', error);
        return Date.now().toString();
    }
};

/**
 * Get cached image processing result if available
 */
const getCachedImageProcess = async (imageHash: string): Promise<string | null> => {
    try {
        const cacheString = await AsyncStorage.getItem(IMAGE_PROCESS_CACHE_KEY);
        if (!cacheString) return null;

        const cache: CachedImageProcess[] = JSON.parse(cacheString);
        const now = Date.now();
        const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000;

        const cachedProcess = cache.find(proc =>
            proc.imageHash === imageHash && (now - proc.timestamp) < MAX_CACHE_AGE
        );

        return cachedProcess ? cachedProcess.extractedExpression : null;
    } catch (error) {
        console.error('Error retrieving from image cache:', error);
        return null;
    }
};

/**
 * Save image processing result to cache
 */
const cacheImageProcess = async (imageHash: string, extractedExpression: string): Promise<void> => {
    try {
        const cacheString = await AsyncStorage.getItem(IMAGE_PROCESS_CACHE_KEY);
        const cache: CachedImageProcess[] = cacheString ? JSON.parse(cacheString) : [];

        const filteredCache = cache.filter(proc => proc.imageHash !== imageHash);

        filteredCache.push({
            imageHash,
            extractedExpression,
            timestamp: Date.now()
        });

        const trimmedCache = filteredCache.slice(-50);

        await AsyncStorage.setItem(IMAGE_PROCESS_CACHE_KEY, JSON.stringify(trimmedCache));
    } catch (error) {
        console.error('Error saving to image cache:', error);
    }
};

/**
 * Solves a mathematical problem using OpenAI
 */
export const solveMathProblem = async (
    mathText: string,
    onProgress?: (partialResponse: string) => void
): Promise<MathProblemResult> => {
    try {
        console.log('Starting math problem solution for:', mathText);
        const cleanedText = cleanMathText(mathText);
        console.log('Cleaned text:', cleanedText);

        const cachedResult = await getCachedOperation(cleanedText);
        if (cachedResult) {
            console.log('Using cached result for:', cleanedText);
            if (onProgress) {
                onProgress(JSON.stringify(cachedResult));
            }
            return cachedResult;
        }

        try {
            const localResult = solveWithMathJs(cleanedText);
            if (localResult) {
                console.log('Solved locally with mathjs:', cleanedText);
                await cacheOperation(cleanedText, localResult);
                if (onProgress) {
                    onProgress(JSON.stringify(localResult));
                }
                return localResult;
            }
        } catch (localError) {
            console.log('Local solution failed, using API:', localError);
        }

        if (!(await isConnected())) {
            return {
                originalProblem: cleanedText,
                solution: '',
                explanation: '',
                latexExpression: '',
                error: 'No internet connection. Please connect to the internet and try again.'
            };
        }

        const systemPrompt = await getSystemPrompt(false);
        const openai = await getOpenAIClient();

        console.log('Using non-streaming mode');
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Solve this mathematical problem and explain the solution: ${cleanedText}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            console.error('No content returned from AI');
            throw new Error('No content returned from AI');
        }

        console.log('Received content:', content.substring(0, 50) + '...');
        const parsedContent = JSON.parse(content);
        console.log('JSON parsed successfully');

        const result = {
            originalProblem: cleanedText,
            solution: parsedContent.solution,
            explanation: parsedContent.explanation,
            latexExpression: parsedContent.latexExpression,
            error: null
        };

        await cacheOperation(cleanedText, result);

        if (onProgress) {
            onProgress(content);
        }
        await notifySolutionComplete(cleanedText);
        await schedulePracticeReminder(1);
        return result;
    } catch (error) {
        console.error('Error in solveMathProblem:', error);
        return {
            originalProblem: mathText,
            solution: '',
            explanation: '',
            latexExpression: '',
            error: `Couldn't solve this problem: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

/**
 * Check if device is connected to the internet
 */
const isConnected = async (): Promise<boolean> => {
    try {
        const response = await fetch('https://ocr.iakzs.lol', { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.log('No internet connection:', error);
        return false;
    }
};

/**
 * Call the Hack Club AI API as a fallback for solving math problems
 */
const callHackClubAI = async (mathExpression: string): Promise<MathProblemResult> => {
    console.log('Calling Hack Club AI for:', mathExpression);

    try {
        const response = await fetch('https://ai.hackclub.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are a math tutor. Solve the following math problem step by step, showing all your work. Return your answer in this JSON format: { \"solution\": \"the final numerical answer\", \"explanation\": \"detailed step-by-step solution\", \"latexExpression\": \"the problem in LaTeX = solution\" }"
                    },
                    {
                        role: "user",
                        content: `Solve this math problem: ${mathExpression}`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Hack Club AI API call failed with status: ${response.status}`);
        }

        const data = await response.json();

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('No content in Hack Club AI response');
        }

        try {
            let jsonContent = content;

            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonContent = jsonMatch[1];
            }

            const jsonResult = JSON.parse(jsonContent.replace(/\\n/g, '\n'));

            return {
                originalProblem: mathExpression,
                solution: jsonResult.solution || '',
                explanation: jsonResult.explanation || '',
                latexExpression: jsonResult.latexExpression || `${mathExpression} = ${jsonResult.solution}`,
                error: null
            };
        } catch (jsonError) {
            console.log('Failed to parse JSON from Hack Club AI response, using raw content');

            return {
                originalProblem: mathExpression,
                solution: extractNumberFromText(content) || '',
                explanation: content,
                latexExpression: `${mathExpression} = ${extractNumberFromText(content) || '?'}`,
                error: null
            };
        }
    } catch (error) {
        console.error('Error calling Hack Club AI:', error);
        throw error;
    }
};

/**
 * Helper function to extract a likely numerical solution from text
 */
const extractNumberFromText = (text: string): string | null => {
    const answerMatch = text.match(/(?:answer|result|solution)(?:\s+is|\s*[:=])\s*([+-]?\d+(?:[.,]\d+)?)/i);
    if (answerMatch && answerMatch[1]) {
        return answerMatch[1].replace(',', '.');
    }

    const numbers = text.match(/[+-]?\d+(?:[.,]\d+)?/g);
    if (numbers && numbers.length > 0) {
        return numbers[numbers.length - 1].replace(',', '.');
    }

    return null;
};

/**
 * Format expression for Wolfram Alpha API
 */
const formatForWolframAlpha = (expression: string): string => {
    return expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '^')
        .replace(/\{/g, '(')
        .replace(/\}/g, ')')
        .replace(/≈/g, '=')
        .replace(/−/g, '-');
};

/**
 * Call MathCalc's custom OCR API to extract text from an image
 */
const callCustomOcrApi = async (imageUri: string): Promise<string> => {
    try {
        console.log('Calling MathCalc custom OCR API for image:', imageUri);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log('OCR API request timed out after 3.5s');
        }, 3500);

        let ocrApiUrl = '';
        try {
            ocrApiUrl = await AsyncStorage.getItem('ocr_api_url') || 'https://ocr.iakzs.lol/ocr';
            if (!ocrApiUrl) {
                throw new Error('OCR API URL is not configured...');
            }

            if (!ocrApiUrl.endsWith('/ocr')) {
                ocrApiUrl = ocrApiUrl.endsWith('/') ? `${ocrApiUrl}ocr` : `${ocrApiUrl}/ocr`;
            }

            console.log('Using OCR API URL:', ocrApiUrl);
        } catch (e) {
            console.error('Error getting OCR API URL from settings:', e);
            clearTimeout(timeoutId);
            throw e;
        }

        const formData = new FormData();

        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        const fileUri = imageUri;

        const fileName = fileUri.split('/').pop() || `image_${Date.now()}.jpg`;
        const fileType = fileName.endsWith('.png') ? 'image/png' :
            fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ? 'image/jpeg' :
                'image/jpeg';

        formData.append('image', {
            uri: fileUri,
            name: fileName,
            type: fileType,
        } as any);

        console.log(`Sending image '${fileName}' (${fileType}) to OCR API`);

        try {
            const response = await fetch(ocrApiUrl, {
                method: 'POST',
                body: formData,
                headers: {},
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No error details available');
                console.error(`OCR API error (${response.status}): ${errorText}`);
                throw new Error(`OCR API call failed with status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.text) {
                console.error('OCR API returned no text:', JSON.stringify(data));
                throw new Error('No text extracted from OCR API');
            }

            console.log('OCR API extracted text:', data.text);
            const extractedText = data.text.trim();
            const labeledExpressionRegex = /([A-Za-z]+\s*:)/g;

            if (labeledExpressionRegex.test(extractedText) && !extractedText.includes('\n')) {
                const formattedText = extractedText.replace(labeledExpressionRegex, (match: string, label: string, offset: number) => {
                    return offset === 0 ? label : '\n' + label;
                });
                console.log('Formatted labeled expressions with line breaks:', formattedText);
                return formattedText;
            }

            return extractedText;

        } catch (fetchError: unknown) {
            clearTimeout(timeoutId);

            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                throw new Error('OCR API request timed out after 3.5 seconds');
            }

            throw fetchError;
        }

    } catch (error) {
        console.error('Error calling MathCalc custom OCR API:', error);
        throw error;
    }
};

/**
 * Process image to extract a math problem, then solve it using various APIs
 */
export const solveMathProblemFromImage = async (
    imageUri: string
): Promise<MathProblemResult> => {
    console.log('Starting math problem solution from image:', imageUri);

    try {
        const imageHash = await generateImageHash(imageUri);

        const cachedExpression = await getCachedImageProcess(imageHash);
        let extractedExpression = '';

        if (cachedExpression) {
            console.log('Using cached extracted expression:', cachedExpression);
            extractedExpression = cachedExpression;
        } else {
            if (!(await isConnected())) {
                return {
                    originalProblem: "Problem from image",
                    solution: '',
                    explanation: '',
                    latexExpression: '',
                    error: 'No internet connection. Please connect to the internet and try again.'
                };
            }

            try {
                const optimizedUri = await optimizeImage(imageUri);

                try {
                    extractedExpression = await callCustomOcrApi(optimizedUri);
                } catch (ocrError) {
                    console.error('Error extracting text with MathCalc custom OCR API:', ocrError);

                    const settings = await getSettings();
                    if (settings) { // No idea why I'm doing an if (settings)
                        console.log('Falling back to OpenAI for OCR...');

                        let base64 = '';
                        try {
                            base64 = await FileSystem.readAsStringAsync(optimizedUri, {
                                encoding: FileSystem.EncodingType.Base64,
                            });
                        } catch (e) {
                            console.error('Error reading image file:', e);
                            throw new Error(`Failed to read image file: ${e instanceof Error ? e.message : String(e)}`);
                        }

                        const dataUrl = `data:image/jpeg;base64,${base64}`;
                        const systemPrompt = "You are a helpful assistant that extracts mathematical expressions from images. Just extract and return the mathematical expression or equation exactly as it appears - don't solve it. Format it using standard notation with operators like +, -, *, /, ^, (), etc. Do not include any explanations or additional text.";
                        const openai = await getOpenAIClient();

                        console.log('Making API request to OpenAI to extract math expression');
                        const extractionResponse = await openai.chat.completions.create({
                            model: "gpt-4o",
                            messages: [
                                {
                                    role: "system",
                                    content: systemPrompt
                                },
                                {
                                    role: "user",
                                    content: [
                                        { type: "text", text: "Extract the mathematical expression or equation from this image. Only return the expression itself using standard notation with operators like +, -, *, /, ^, (), etc." },
                                        {
                                            type: "image_url",
                                            image_url: { url: dataUrl }
                                        }
                                    ]
                                }
                            ]
                        });

                        extractedExpression = extractionResponse.choices[0]?.message?.content || "";
                    } else {
                        throw new Error(`Failed to extract text from image using custom OCR API: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}`);
                    }
                }

                if (!extractedExpression) {
                    throw new Error("Failed to extract mathematical expression from image");
                }

                console.log('Extracted math expression:', extractedExpression);
                await cacheImageProcess(imageHash, extractedExpression);
            } catch (error) {
                console.error('Error in image processing:', error);
                throw error;
            }
        }

        const cleanedExpression = cleanMathText(extractedExpression);

        const cachedSolution = await getCachedOperation(cleanedExpression);
        if (cachedSolution) {
            console.log('Using cached solution for:', cleanedExpression);
            return cachedSolution;
        }

        try {
            const localResult = solveWithMathJs(cleanedExpression);
            if (localResult) {
                console.log('Solved locally with mathjs:', cleanedExpression);
                await cacheOperation(cleanedExpression, localResult);
                await notifySolutionComplete(cleanedExpression);
                await schedulePracticeReminder(1);
                return localResult;
            }
        } catch (localError) {
            console.log('Local solution failed, using API:', localError);
        }

        if (!(await isConnected())) {
            return {
                originalProblem: cleanedExpression,
                solution: '',
                explanation: '',
                latexExpression: '',
                error: 'No internet connection. Please connect to the internet and try again.'
            };
        }

        let result;
        try {
            console.log('Calling Wolfram Alpha API with expression:', cleanedExpression);
            const formattedExpression = formatForWolframAlpha(cleanedExpression);
            const wolframResponse = await callWolframAlphaAPI(formattedExpression);
            result = extractWolframSolution(wolframResponse);
        } catch (wolframError) {
            console.error('Error using Wolfram Alpha API, falling back to Hack Club AI:', wolframError);

            try {
                result = await callHackClubAI(cleanedExpression);
            } catch (hackClubError) {
                console.error('Error using Hack Club AI, falling back to OpenAI:', hackClubError);
                result = await solveMathProblem(cleanedExpression);
            }
        }

        if (result && !result.error) {
            await cacheOperation(cleanedExpression, result);
            await notifySolutionComplete(cleanedExpression);
            await schedulePracticeReminder(1);
        }

        return result;
    } catch (error) {
        console.error('Unhandled error in solveMathProblemFromImage:', error);
        return {
            originalProblem: "Problem from image",
            solution: '',
            explanation: '',
            latexExpression: '',
            error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

/**
 * Optimize image before processing to reduce size and improve extraction quality
 */
const optimizeImage = async (imageUri: string): Promise<string> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!(fileInfo.exists) || fileInfo.size && fileInfo.size < 500000) {
            return imageUri;
        }

        const optimizedUri = FileSystem.cacheDirectory + `optimized_${Date.now()}.jpg`;

        await FileSystem.copyAsync({
            from: imageUri,
            to: optimizedUri
        });

        return optimizedUri;
    } catch (error) {
        console.error('Error optimizing image:', error);
        return imageUri;
    }
};

/**
 * Call the Wolfram Alpha API to solve a mathematical problem
 */
const callWolframAlphaAPI = async (mathExpression: string): Promise<any> => {
    console.log('Calling Wolfram Alpha API for:', mathExpression);

    const appId = await getWolframAlphaApiKey();

    if (!appId) {
        throw new Error('Wolfram Alpha API key is required for this feature. Please add your API key in Settings.');
    }

    try {
        const encodedInput = encodeURIComponent(mathExpression);
        const apiUrl = `https://api.wolframalpha.com/v2/query?input=${encodedInput}&appid=${appId}&output=JSON`;

        console.log('Making request to:', apiUrl);

        const response = await fetch(apiUrl);
        const responseText = await response.text();

        if (!response.ok) {
            console.error('Wolfram Alpha returned non-OK status:', response.status);
            console.error('Response text:', responseText.substring(0, 500));
            throw new Error(`Wolfram Alpha API call failed with status: ${response.status}`);
        }

        try {
            const data = JSON.parse(responseText);

            console.log('Wolfram Alpha response structure:',
                JSON.stringify({
                    success: data.queryresult?.success,
                    error: data.queryresult?.error,
                    numpods: data.queryresult?.numpods,
                    pods: data.queryresult?.pods?.map((p: any) => p.id)
                })
            );

            if (!data.queryresult) {
                throw new Error('Invalid Wolfram Alpha response format');
            }

            if (data.queryresult.error) {
                throw new Error('Wolfram Alpha returned an error: ' +
                    JSON.stringify(data.queryresult.error));
            }

            if (!data.queryresult.success) {
                console.log('Wolfram Alpha query unsuccessful:',
                    JSON.stringify(data.queryresult, null, 2).substring(0, 500));
                throw new Error('Wolfram Alpha could not understand the query');
            }

            return data;
        } catch (jsonError) {
            console.error('Failed to parse Wolfram Alpha response as JSON:', jsonError);
            console.error('Response text:', responseText.substring(0, 500));
            throw new Error('Failed to parse Wolfram Alpha response');
        }
    } catch (error) {
        console.error('Error calling Wolfram Alpha API:', error);
        throw error;
    }
};

/**
 * Extract solution from Wolfram Alpha API response
 */
const extractWolframSolution = (wolframData: any): MathProblemResult => {
    try {
        const inputPod = wolframData.queryresult.pods.find((pod: any) => pod.id === 'Input');
        const originalProblem = inputPod?.subpods[0]?.plaintext || "Unknown problem";

        const resultPod = wolframData.queryresult.pods.find((pod: any) => pod.id === 'Result');
        const solution = resultPod?.subpods[0]?.plaintext || "No solution found";

        const latexExpression = originalProblem.replace(/\*/g, '\\times ') + ' = ' + solution;

        const explanation = generateExplanation(originalProblem, solution);

        return {
            originalProblem,
            solution,
            explanation,
            latexExpression,
            error: null
        };
    } catch (error) {
        console.error('Error extracting Wolfram Alpha solution:', error);
        return {
            originalProblem: "Problem from Wolfram Alpha",
            solution: '',
            explanation: '',
            latexExpression: '',
            error: `Failed to parse Wolfram Alpha result: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

/**
 * Generate a clear explanation for common math operations
 */
const generateExplanation = (problem: string, result: string): string => {
    const cleaned = problem.replace(/\s/g, '');

    if (cleaned.includes('+') && !cleaned.includes('(')) {
        const numbers = cleaned.split('+').map(n => parseInt(n.trim()));
        return `To add ${numbers.join(' and ')}, we simply sum the numbers directly:\n\n${numbers.join(' + ')} = ${result}`;
    }

    if (cleaned.includes('-') && !cleaned.includes('(')) {
        const parts = cleaned.split('-');
        const first = parseInt(parts[0].trim());
        const second = parseInt(parts[1].trim());
        return `To subtract ${second} from ${first}, we directly calculate:\n\n${first} - ${second} = ${result}`;
    }

    if (cleaned.includes('*') && !cleaned.includes('(')) {
        const numbers = cleaned.split('*').map(n => parseInt(n.trim()));
        return `To multiply ${numbers.join(' by ')}, we directly calculate:\n\n${numbers.join(' × ')} = ${result}`;
    }

    if (cleaned.includes('/') && !cleaned.includes('(')) {
        const parts = cleaned.split('/');
        const numerator = parseInt(parts[0].trim());
        const denominator = parseInt(parts[1].trim());
        return `To divide ${numerator} by ${denominator}, we directly calculate:\n\n${numerator} ÷ ${denominator} = ${result}`;
    }

    if (cleaned.includes('(') && cleaned.includes(')')) {
        try {
            const parenContent = cleaned.match(/\(([^)]+)\)/)?.[1] || '';
            const outsideOp = cleaned.includes('*') ? 'multiply' :
                cleaned.includes('/') ? 'divide' :
                    cleaned.includes('+') ? 'add' : 'subtract';

            let outsideNum = '';
            if (outsideOp === 'multiply') {
                outsideNum = cleaned.split('*').filter(part => !part.includes('('))[0] ||
                    cleaned.split('*').filter(part => !part.includes('('))[1] || '';
            } else if (outsideOp === 'divide') {
                outsideNum = cleaned.split('/').filter(part => !part.includes('('))[0] ||
                    cleaned.split('/').filter(part => !part.includes('('))[1] || '';
            }

            let insideOperation = '';
            let firstNum = '';
            let secondNum = '';
            let innerResult = '';

            if (parenContent.includes('+')) {
                insideOperation = 'add';
                [firstNum, secondNum] = parenContent.split('+');
                innerResult = (parseInt(firstNum) + parseInt(secondNum)).toString();
            } else if (parenContent.includes('-')) {
                insideOperation = 'subtract';
                [firstNum, secondNum] = parenContent.split('-');
                innerResult = (parseInt(firstNum) - parseInt(secondNum)).toString();
            } else if (parenContent.includes('*')) {
                insideOperation = 'multiply';
                [firstNum, secondNum] = parenContent.split('*');
                innerResult = (parseInt(firstNum) * parseInt(secondNum)).toString();
            } else if (parenContent.includes('/')) {
                insideOperation = 'divide';
                [firstNum, secondNum] = parenContent.split('/');
                innerResult = (parseInt(firstNum) / parseInt(secondNum)).toString();
            }

            let explanation = `To solve ${problem}, follow these steps:\n\n`;
            explanation += `1. First, calculate the expression inside the parentheses: (${parenContent})\n`;

            if (insideOperation === 'add') {
                explanation += `   ${firstNum} + ${secondNum} = ${innerResult}\n\n`;
            } else if (insideOperation === 'subtract') {
                explanation += `   ${firstNum} - ${secondNum} = ${innerResult}\n\n`;
            } else if (insideOperation === 'multiply') {
                explanation += `   ${firstNum} × ${secondNum} = ${innerResult}\n\n`;
            } else if (insideOperation === 'divide') {
                explanation += `   ${firstNum} ÷ ${secondNum} = ${innerResult}\n\n`;
            }

            explanation += `2. Then, ${outsideOp} the result by ${outsideNum}:\n`;
            explanation += `   ${innerResult} × ${outsideNum} = ${result}\n\n`;

            explanation += `Therefore, ${problem} = ${result}`;

            return explanation;
        } catch (e) {
            console.log('Error parsing complex expression:', e);
        }
    }

    return `To calculate ${problem}, we follow the order of operations (PEMDAS - Parentheses, Exponents, Multiplication/Division, Addition/Subtraction).\n\nThe result is ${result}.`;
};

/**
 * Cleans the input math text by replacing common errors
 */
const cleanMathText = (text: string) => {
    return text
        .replace(/[oO]/g, '0')
        .replace(/[lI]/g, '1')
        .replace(/[Zz]/g, '2')
        .replace(/\s+/g, '');
}

/**
 * Export a simple function to evaluate an expression offline using mathjs
 * This can be used in places where we want to do quick calculations without API calls
 */
export const evaluateExpression = (expression: string): string => {
    try {
        const cleanedExpression = expression
            .replace(/÷/g, '/')
            .replace(/×/g, '*')
            .replace(/−/g, '-')
            .replace(/[^\d+\-*/().^%=<>!&|]/g, '');

        const result = math.evaluate(cleanedExpression);
        return result.toString();
    } catch (error) {
        return 'Error evaluating expression';
    }
};

/**
 * Clears the operation cache
 */
export const clearMathCache = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(OFFLINE_CACHE_KEY);
        await AsyncStorage.removeItem(IMAGE_PROCESS_CACHE_KEY);
        console.log('Math cache cleared successfully');
    } catch (error) {
        console.error('Error clearing math cache:', error);
        throw error;
    }
};

/**
 * Returns statistics about the cached operations
 */
export const getMathCacheStats = async (): Promise<{
    operationCount: number,
    imageProcessCount: number,
    oldestOperationDate: string | null,
    newestOperationDate: string | null,
    totalCacheSize: number
}> => {
    try {
        const operationCacheString = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
        const imageProcessCacheString = await AsyncStorage.getItem(IMAGE_PROCESS_CACHE_KEY);

        const operationCache: CachedOperation[] = operationCacheString ? JSON.parse(operationCacheString) : [];
        const imageProcessCache: CachedImageProcess[] = imageProcessCacheString ? JSON.parse(imageProcessCacheString) : [];

        const operationTimestamps = operationCache.map(op => op.timestamp);

        const oldestTimestamp = operationTimestamps.length > 0 ?
            Math.min(...operationTimestamps) : null;

        const newestTimestamp = operationTimestamps.length > 0 ?
            Math.max(...operationTimestamps) : null;

        const totalCacheSize =
            (operationCacheString ? operationCacheString.length : 0) +
            (imageProcessCacheString ? imageProcessCacheString.length : 0);

        return {
            operationCount: operationCache.length,
            imageProcessCount: imageProcessCache.length,
            oldestOperationDate: oldestTimestamp ? new Date(oldestTimestamp).toISOString() : null,
            newestOperationDate: newestTimestamp ? new Date(newestTimestamp).toISOString() : null,
            totalCacheSize
        };
    } catch (error) {
        console.error('Error getting math cache stats:', error);
        return {
            operationCount: 0,
            imageProcessCount: 0,
            oldestOperationDate: null,
            newestOperationDate: null,
            totalCacheSize: 0
        };
    }
};
