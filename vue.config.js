const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  parallel: false,
  devServer: {
    port: 8080,
    client: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8101",
        changeOrigin: true,
      },
    },
  },
  chainWebpack: (config) => {
    config.plugins.delete("fork-ts-checker");
  },
});
