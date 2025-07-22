module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This is the required plugin for react-native-reanimated
      'react-native-reanimated/plugin',
    ],
  };
};
