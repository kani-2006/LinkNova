const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const UAParser = require('ua-parser-js');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route handlers
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend Running"
  });
});

// Root Route Fallback (prevents default "Cannot GET /")
app.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "LinkNova URL Redirect API is active. Navigate to http://localhost:5173/ to access the premium dashboard."
  });
});

// Helper to sanitize IP
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'Unknown';
};

// Main Redirect Route: GET /:shortCode
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  const Url = require('./models/Url');
  const Analytics = require('./models/Analytics');

  try {
    const url = await Url.findOne({ shortCode });

    // 1. Check if URL exists
    if (!url) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Not Found | LinkNova</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              background-color: #F8FAFC;
              color: #0F172A;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
              padding: 3rem;
              background-color: #FFFFFF;
              border: 1px solid #E2E8F0;
              border-radius: 24px;
              box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
              max-width: 440px;
              width: 90%;
            }
            .icon-box {
              width: 56px;
              height: 56px;
              background-color: #EEF2FF;
              border-radius: 16px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 0 auto 1.5rem auto;
            }
            .icon-box svg {
              width: 28px;
              height: 28px;
              color: #4F46E5;
            }
            h1 {
              font-family: 'Outfit', sans-serif;
              font-size: 1.75rem;
              font-weight: 700;
              margin: 0 0 0.75rem 0;
              color: #0F172A;
            }
            p {
              color: #64748B;
              font-size: 0.95rem;
              line-height: 1.6;
              margin: 0 0 2rem 0;
            }
            .btn {
              display: block;
              background-color: #4F46E5;
              color: #FFFFFF;
              padding: 0.85rem 1.5rem;
              border-radius: 12px;
              text-decoration: none;
              font-weight: 600;
              font-size: 0.9rem;
              transition: all 0.2s ease;
              box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1);
            }
            .btn:hover {
              background-color: #4338CA;
              transform: translateY(-1px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1>Link Not Found</h1>
            <p>We couldn't find the link you are looking for. It may have expired, been deleted, or the address was typed incorrectly.</p>
            <a href="http://localhost:5173/" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // 2. Check if link is expired
    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Expired | LinkNova</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', system-ui, sans-serif;
              background-color: #F8FAFC;
              color: #0F172A;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
              padding: 3rem;
              background-color: #FFFFFF;
              border: 1px solid #E2E8F0;
              border-radius: 24px;
              box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);
              max-width: 440px;
              width: 90%;
            }
            .icon-box {
              width: 56px;
              height: 56px;
              background-color: #FEF2F2;
              border-radius: 16px;
              display: flex;
              justify-content: center;
              align-items: center;
              margin: 0 auto 1.5rem auto;
            }
            .icon-box svg {
              width: 28px;
              height: 28px;
              color: #EF4444;
            }
            h1 {
              font-family: 'Outfit', sans-serif;
              font-size: 1.75rem;
              font-weight: 700;
              margin: 0 0 0.75rem 0;
              color: #0F172A;
            }
            p {
              color: #64748B;
              font-size: 0.95rem;
              line-height: 1.6;
              margin: 0 0 2rem 0;
            }
            .btn {
              display: block;
              background-color: #4F46E5;
              color: #FFFFFF;
              padding: 0.85rem 1.5rem;
              border-radius: 12px;
              text-decoration: none;
              font-weight: 600;
              font-size: 0.9rem;
              transition: all 0.2s ease;
              box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1);
            }
            .btn:hover {
              background-color: #4338CA;
              transform: translateY(-1px);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h1>Link Expired</h1>
            <p>This link had an expiration date and time set by its owner and is no longer active. Contact the owner for an updated link.</p>
            <a href="http://localhost:5173/" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // 3. Log Analytics async
    const userAgentStr = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgentStr);
    const browser = parser.getBrowser().name || 'Unknown';
    const rawDevice = parser.getDevice().type || 'Desktop';
    const device = rawDevice.charAt(0).toUpperCase() + rawDevice.slice(1);

    // Mock testing countries distribution
    const countries = ['United States', 'India', 'United Kingdom', 'Germany', 'Canada', 'Australia', 'France', 'Japan'];
    const country = countries[Math.floor(Math.random() * countries.length)];

    Promise.resolve().then(async () => {
      try {
        url.clicks += 1;
        await url.save();

        await Analytics.create({
          urlId: url._id,
          browser,
          device,
          country
        });
      } catch (err) {
        console.error('Failed to log click details:', err.message);
      }
    });

    // 4. Redirect
    return res.redirect(302, url.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error.message);
    res.status(500).send('Server Error during redirect process');
  }
});

// Catch-all Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
  console.log(`Redirect service active at http://localhost:${PORT}/:shortCode`);
});
