module.exports = (config) => {
    return {
        ...config,
        ios: {
            ...config.ios,
            podfileProperties: {
                ...config.ios?.podfileProperties,
                'pod.ReactAppDependencyProvider.path': '../node_modules/expo-dev-menu/ios/ReactAppDependencyProvider.podspec'
            }
        }
    };
};
