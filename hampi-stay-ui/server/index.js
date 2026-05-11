import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
    ==================================================
    🚀 HAMPISTAYS SECURE SERVER RUNNING
    🛡️  MODE: ${process.env.NODE_ENV || 'development'}
    📍 PORT: ${PORT}
    🏠 URL:  http://localhost:${PORT}
    ==================================================
  `);
});
