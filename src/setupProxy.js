const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Add headers to handle CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3005',
      changeOrigin: true,
      secure: false,
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({ error: 'Proxy error', results: [] });
      },
    })
  );
};
