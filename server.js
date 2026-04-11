const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the dist directory (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - all routes should serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Use the port provided by cPanel/Passenger
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Femtech HR PWA is running on port ${PORT}`);
  const appUrl = process.env.APP_URL || `https://hrapp.femtechaccess.com.ng`;
  console.log(`📱 Access at: ${appUrl}`);
});
