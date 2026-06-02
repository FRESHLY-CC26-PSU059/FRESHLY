// Auto-preauthorize Swagger UI with the client API key.
// Served as a static file to avoid 'unsafe-inline' in CSP.
window.addEventListener('load', function () {
  setTimeout(function () {
    window.ui && window.ui.preauthorizeApiKey && window.ui.preauthorizeApiKey('clientKey', window.__FRESHLY_CLIENT_KEY__);
  }, 800);
});
