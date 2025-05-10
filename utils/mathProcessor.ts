import { OpenAI } from 'openai';
import * as FileSystem from 'expo-file-system';
import { OPENAIAPIKEY } from "@/env-var";
import { getSettings } from '@/utils/storageUtil';

const openai = new OpenAI({
    apiKey: OPENAIAPIKEY || '',
});

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
 * Solves a mathematical problem from an image using GPT-4o
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
            return {
                originalProblem: "Problem from image",
                solution: '',
                explanation: '',
                latexExpression: '',
                error: `Failed to read image file: ${e instanceof Error ? e.message : String(e)}`
            };
        }

        if (!base64 || base64.length === 0) {
            console.error('Base64 conversion resulted in empty string');
            return {
                originalProblem: "Problem from image",
                solution: '',
                explanation: '',
                latexExpression: '',
                error: "Failed to convert image to base64 (empty result)"
            };
        }

        const dataUrl = `data:image/jpeg;base64,${base64}`;
        console.log('Data URL created, length:', dataUrl.length);

        const systemPrompt = await getSystemPrompt(true);

        try {
            console.log('Making API request to OpenAI');
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Solve the math problem in this image. Provide the final answer clearly marked as 'Solution:'" },
                            {
                                type: "image_url",
                                image_url: { url: dataUrl }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            });

            console.log('API response received');

            const content = response.choices[0]?.message?.content;
            if (!content) {
                console.error('No content in response:', response);
                return {
                    originalProblem: "Problem from image",
                    solution: '',
                    explanation: '',
                    latexExpression: '',
                    error: "API returned empty response"
                };
            }

            console.log('Response content:', content.substring(0, 100) + '...');

            try {
                const parsedContent = JSON.parse(content);
                return {
                    originalProblem: parsedContent.originalProblem || "Problem from image",
                    solution: parsedContent.solution || 'Solution not provided',
                    explanation: parsedContent.explanation || 'No explanation provided',
                    latexExpression: parsedContent.latexExpression || '',
                    error: null
                };
            } catch (jsonError) {
                console.log('Response is not JSON, using text parsing');

                const solutionMatch = content.match(/solution:?\s*(.*?)(?:\n|$)/i);
                const explanationMatch = content.match(/explanation:?\s*([\s\S]*?)(?:\n\n|$)/i);

                return {
                    originalProblem: "Problem from image",
                    solution: solutionMatch ? solutionMatch[1].trim() : content.substring(0, 200),
                    explanation: explanationMatch ? explanationMatch[1].trim() : 'See solution',
                    latexExpression: '',
                    error: null
                };
            }
        } catch (apiError) {
            console.error('OpenAI API error:', apiError);
            return {
                originalProblem: "Problem from image",
                solution: '',
                explanation: '',
                latexExpression: '',
                error: `API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`
            };
        }
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
 * Cleans the input math text by replacing common errors
 */
const cleanMathText = (text: string) => {
    return text
        .replace(/[oO]/g, '0')
        .replace(/[lI]/g, '1')
        .replace(/[Zz]/g, '2')
        .replace(/\s+/g, '');
}
