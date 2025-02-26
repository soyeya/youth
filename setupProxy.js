const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function(app){

     app.use(
        createProxyMiddleware("/newsApi",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/jobApi",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/residenceApi",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/welfareApi",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/educationApi",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/financeApi",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/join",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/login",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/MyList",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/LoginList",{
            target : "http://localhost:3400",
            changeOrigin: true,
        }),
        createProxyMiddleware("/Logout",{
            target : "http://localhost:3400",
            changeOrigin: true,
        })
     )
}