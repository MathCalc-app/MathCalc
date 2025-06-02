export default {
    expo: {
        name: "MathCalc",
        slug: "mathcalc",
        version: "0.0.10",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "myapp",
        userInterfaceStyle: "automatic",
        newArchEnabled: false,
        ios: {
            excludeXcodeProject: ["expo-dev-menu"],
            supportsTablet: true,
            bundleIdentifier: "com.hackclub.mathcalc",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            permissions: [
                "android.permission.CAMERA",
                "android.permission.RECORD_AUDIO"
            ],
            package: "com.hackclub.mathcalc"
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            [
                "expo-camera",
                {
                    cameraPermission: "Allow MathCalc to access your camera to scan math problems."
                }
            ],
            [
                "expo-image-picker",
                {
                    photosPermission: "Allow MathCalc to access your photos to select math problems."
                }
            ],
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff"
                }
            ],
            "./app.plugin.js",
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
            router: {
                origin: false
            },
            eas: {
                projectId: "88b3304c-eca7-46b6-bb30-ecf877342bf2" // please change to your projectId, or you'll get errors everytime
            }
        },
        owner: "kzthekz" // also change on here to your account username
    }
};
