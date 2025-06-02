# Welcome to MathCalc 👋

This is an [Expo](https://expo.dev) project created by [Benjamín Alonso Bobadilla Moya](https://github.com/iakzs)!
The app was tested on iOS

## Get to develop MathCalc

1. Install dependencies

   ```bash
   npm install
   ```
2. Make a file called expo-var.ts with
   ```typescript
    export const OPENAIAPIKEY = ''
    /*
     You need to add EXPO_PUBLIC_WOLFRAM_ALPHA_API_KEY, EXPO_PUBLIC_OPENAI_API_KEY
     into eas secret:create with your API keys.
    */
   ```

3. Add these environment variables into expo-var.ts (and do `eas secret:create --scope project --name NAME --value VALUE`)

4. Make your code

5. Start the app for developing with Expo Go
   ```bash
    npx expo start --go
   ```
