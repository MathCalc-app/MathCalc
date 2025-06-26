/*
 This TypeScript file is not being used, as MathCalc moved to OCR
 */
import TextRecognition from 'react-native-text-recognition';

export const extractTextFromImage = async (imageUri: string) => {
    try {
        const result = await TextRecognition.recognize(imageUri);
        return result.join(' ');
    } catch (error) {
        console.error('Error recognizing text:', error);
        return null;
    }
};

export const getImageURI = (imageUri: string) => {
    return imageUri;
};
