const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Firecrawl API configuration
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API = 'https://api.firecrawl.dev/v1';

// Brand website mappings
const BRAND_CONFIGS = {
  johnsens: {
    baseUrl: 'https://www.johnsens.com',
    searchPattern: (itemNumber) => `https://www.johnsens.com/all/${itemNumber}`,
    imageExtractor: (html) => {
      // Extract image URL from BigCommerce CDN
      const match = html.match(/https:\/\/cdn11\.bigcommerce\.com\/s-fg8rw4u4uq\/images\/stencil\/1280x1280\/[^"]+\.png\?c=2/);
      return match ? match[0] : null;
    }
  },
  bluemagic: {
    baseUrl: 'https://www.bluemagicusa.com',
    searchPattern: (itemNumber) => `https://www.bluemagicusa.com/products/${itemNumber}`,
    imageExtractor: (html) => {
      const match = html.match(/https:\/\/[^"]+\.(?:jpg|png|webp)/i);
      return match ? match[0] : null;
    }
  },
  quiksteel: {
    baseUrl: 'https://www.quiksteel.com',
    searchPattern: (itemNumber) => `https://www.quiksteel.com/products/${itemNumber}`,
    imageExtractor: (html) => {
      const match = html.match(/https:\/\/[^"]+\.(?:jpg|png|webp)/i);
      return match ? match[0] : null;
    }
  },
  purecitrus: {
    baseUrl: 'https://www.purecitrus.com',
    searchPattern: (itemNumber) => `https://www.purecitrus.com/products/${itemNumber}`,
    imageExtractor: (html) => {
      const match = html.match(/https:\/\/[^"]+\.(?:jpg|png|webp)/i);
      return match ? match[0] : null;
    }
  },
  turbo108: {
    baseUrl: 'https://www.turbo108.com',
    searchPattern: (itemNumber) => `https://www.turbo108.com/products/${itemNumber}`,
    imageExtractor: (html) => {
      const match = html.match(/https:\/\/[^"]+\.(?:jpg|png|webp)/i);
      return match ? match[0] : null;
    }
  },
  sprayx: {
    baseUrl: 'https://www.spray-x.com',
    searchPattern: (itemNumber) => `https://www.spray-x.com/products/${itemNumber}`,
    imageExtractor: (html) => {
      const match = html.match(/https:\/\/[^"]+\.(?:jpg|png|webp)/i);
      return match ? match[0] : null;
    }
  }
};

// Scrape product page using Firecrawl
async function scrapeProductPage(url) {
  try {
    const response = await fetch(`${FIRECRAWL_API}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'links']
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

// Extract image URL from scraped data
function extractImageUrl(scrapedData, brand) {
  if (!scrapedData || !scrapedData.data) return null;

  const config = BRAND_CONFIGS[brand];
  if (!config) return null;

  // Try to find image in links
  if (scrapedData.data.links) {
    const imageLink = scrapedData.data.links.find(link => 
      link.includes('cdn11.bigcommerce.com') && 
      link.includes('1280x1280') && 
      link.match(/\.png\?c=2$/)
    );
    if (imageLink) return imageLink;
  }

  // Try to extract from markdown
  if (scrapedData.data.markdown) {
    return config.imageExtractor(scrapedData.data.markdown);
  }

  return null;
}

// Main endpoint: Search and extract product image
app.post('/api/search-product', async (req, res) => {
  try {
    const { itemNumber, brand = 'johnsens' } = req.body;

    if (!itemNumber) {
      return res.status(400).json({
        success: false,
        error: 'Item number is required'
      });
    }

    const config = BRAND_CONFIGS[brand];
    if (!config) {
      return res.status(400).json({
        success: false,
        error: `Unsupported brand: ${brand}`
      });
    }

    // Generate product URL
    const productUrl = config.searchPattern(itemNumber);
    console.log(`Searching for ${itemNumber} at ${productUrl}`);

    // Scrape product page
    const scrapedData = await scrapeProductPage(productUrl);
    if (!scrapedData) {
      return res.status(404).json({
        success: false,
        error: 'Failed to scrape product page'
      });
    }

    // Extract image URL
    const imageUrl = extractImageUrl(scrapedData, brand);
    if (!imageUrl) {
      return res.status(404).json({
        success: false,
        error: 'Product image not found'
      });
    }

    res.json({
      success: true,
      itemNumber,
      brand,
      productUrl,
      imageUrl
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'product-image-scraper' });
});

app.listen(PORT, () => {
  console.log(`Product Image Scraper running on port ${PORT}`);
});

module.exports = app;