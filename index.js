const express = require('express');
const sharp = require('sharp');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'running', 
    service: 'Image to WebP Converter',
    endpoints: {
      convert: 'POST /convert - Convert image to WebP',
      health: 'GET /health - Health check'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Convert image to WebP
app.post('/convert', async (req, res) => {
  try {
    const { imageUrl, quality = 80 } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    // Download image
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });

    // Convert to WebP
    const webpBuffer = await sharp(response.data)
      .webp({ quality: parseInt(quality) })
      .toBuffer();

    // Return as base64
    const base64Image = webpBuffer.toString('base64');
    
    res.json({
      success: true,
      format: 'webp',
      size: webpBuffer.length,
      base64: base64Image,
      dataUrl: `data:image/webp;base64,${base64Image}`
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ 
      error: 'Conversion failed', 
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Image converter service running on port ${PORT}`);
});