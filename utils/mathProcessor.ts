import { OpenAI } from 'openai';
import * as FileSystem from 'expo-file-system';
import { getSettings } from '@/utils/storageUtil';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifySolutionComplete, schedulePracticeReminder } from '@/utils/notificationUtil';

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

        if (onProgress) {
            onProgress(content);
        }
        await notifySolutionComplete(cleanedText);
        await schedulePracticeReminder(1);
        return {
            originalProblem: cleanedText,
            solution: parsedContent.solution,
            explanation: parsedContent.explanation,
            latexExpression: parsedContent.latexExpression,
            error: null
        };
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
 * Process image to extract a math problem, then solve it using various APIs
 */
export const solveMathProblemFromImage = async (
    imageUri: string
): Promise<MathProblemResult> => {
    console.log('Starting math problem solution from image:', imageUri);

    try {
        let base64 = '';
        try {
            base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            console.log('Successfully converted image to base64, length:', base64.length);
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

        const extractedExpression = extractionResponse.choices[0]?.message?.content;
        if (!extractedExpression) {
            throw new Error("Failed to extract mathematical expression from image");
        }

        console.log('Extracted math expression:', extractedExpression);

        const cleanedExpression = cleanMathText(extractedExpression);

        let result;
        try {
            console.log('Calling Wolfram Alpha API with expression:', cleanedExpression);
            const formattedExpression = formatForWolframAlpha(cleanedExpression);
            const wolframResponse = await callWolframAlphaAPI(formattedExpression);
            return extractWolframSolution(wolframResponse);
        } catch (wolframError) {
            console.error('Error using Wolfram Alpha API, falling back to Hack Club AI:', wolframError);

            try {
                return await callHackClubAI(cleanedExpression);
            } catch (hackClubError) {
                console.error('Error using Hack Club AI, falling back to OpenAI:', hackClubError);

                result = await solveMathProblem(cleanedExpression);
            }
        }

        if (result && !result.error) {
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
        return `To divide ${numerator} by ${denominator}, we calculate:\n\n${numerator} ÷ ${denominator} = ${result}`;
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
