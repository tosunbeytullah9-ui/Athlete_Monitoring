module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    // Not: reanimated/worklets babel plugin'i babel-preset-expo (SDK 54)
    // tarafından otomatik eklenir — elle eklemek çift-uygulama yaratır.
  };
};
