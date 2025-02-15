const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    app.use(
        "/api1", // Proxy path for API 1
        createProxyMiddleware({
            //target: "http://127.0.0.1:8000", // Backend API 1
            target: "https://asterheng-github-io.onrender.com",
			changeOrigin: true,
            pathRewrite: { "^/api1": "" }, // Removes '/api1' when forwarding
        })
    );

    app.use(
        "/api2", // Proxy path for API 2
        createProxyMiddleware({
            target: "https://fyp-37p-api-a16b479cb42b.herokuapp.com", // Backend API 2
            changeOrigin: true,
            pathRewrite: { "^/api2": "" }, // Removes '/api2' when forwarding
        })
    );

    app.use(
        "/api3", // Proxy path for API 2
        createProxyMiddleware({
            target: "https://csit321-fyp-24-s4-37p.onrender.com", // Backend API 3
            changeOrigin: true,
            pathRewrite: { "^/api3": "" }, // Removes '/api3' when forwarding
        })
    );
};