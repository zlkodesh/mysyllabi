const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Required for Render's proxy setup
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. You can parse up to 5 syllabi per hour.' }
});

app.post('/api/parse', limiter, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  console.log('API key present:', !!apiKey);

  if (!apiKey) return res.status(500).json({ error: 'Server configuration error.' });
  if (!req.body || !req.body.messages) return res.status(400).json({ error: 'Invalid request.' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    res.status(500).json({ error: 'Failed to reach Anthropic API.' });
  }
});

app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'mysyllabi.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MySyllabi running on port ${PORT}`));
