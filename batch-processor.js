const axios = require('axios');
const fs = require('fs').promises;

// Configuration
const CONVERTER_API = 'https://image-to-webp-converter-production.up.railway.app/convert';
const JOHNSENS_BASE = 'https://www.johnsens.com';
const OUTPUT_DIR = './converted-images';
const QUALITY = 80;

// Sample items from PDF (add more as needed)
const items = [
  { itemNumber: '2212', name: 'JHN PREMIUM DOT 3 BRAKE FLUID' },
  { itemNumber: '2224', name: 'JHN PREMIUM DOT 3 BRAKE FLUID' },
  { itemNumber: '2232', name: 'JHN PREMIUM DOT 3 BRAKE FLUID' },
  { itemNumber: '5012', name: 'JHN PREMIUM DOT 4 BRAKE FLUID' },
  { itemNumber: '4641', name: 'JHN CARB CLEANER' },
  // Add more items here
];

// Delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Search for product on Johnsen's website
async function searchProduct(itemNumber) {
  try {
    const searchUrl = `${JOHNSENS_BASE}/catalogsearch/result/?q=${itemNumber}`;
    console.log(`Searching for item ${itemNumber}...`);
    
    // In production, you'd scrape the search results
    // For now, using direct product URL pattern
    const productUrl = `${JOHNSENS_BASE}/all/premium-dot-3-brake-fluid`;
    
    return productUrl;
  } catch (error) {
    console.error(`Error searching for ${itemNumber}:`, error.message);
    return null;
  }
}

// Extract image URL from product page
async function extractImageUrl(productUrl) {
  try {
    // This would require actual web scraping
    // For demo, returning a sample URL
    const imageUrl = 'https://cdn11.bigcommerce.com/s-fg8rw4u4uq/images/stencil/1280x1280/products/32/189/2212__05798.1515075711.png?c=2';
    return imageUrl;
  } catch (error) {
    console.error(`Error extracting image:`, error.message);
    return null;
  }
}

// Convert image to WebP
async function convertToWebP(imageUrl, itemNumber) {
  try {
    console.log(`Converting ${itemNumber} to WebP...`);
    
    const response = await axios.post(CONVERTER_API, {
      imageUrl: imageUrl,
      quality: QUALITY
    });

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error('Conversion failed');
    }
  } catch (error) {
    console.error(`Error converting ${itemNumber}:`, error.message);
    return null;
  }
}

// Save WebP image
async function saveWebP(base64Data, itemNumber) {
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Remove data URL prefix
    const base64Image = base64Data.replace(/^data:image\/webp;base64,/, '');
    const buffer = Buffer.from(base64Image, 'base64');
    
    const filename = `${OUTPUT_DIR}/${itemNumber}.webp`;
    await fs.writeFile(filename, buffer);
    
    console.log(`✅ Saved: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`Error saving ${itemNumber}:`, error.message);
    return null;
  }
}

// Process single item
async function processItem(item) {
  console.log(`\n📦 Processing: ${item.itemNumber} - ${item.name}`);
  
  try {
    // Step 1: Search for product
    const productUrl = await searchProduct(item.itemNumber);
    if (!productUrl) {
      console.log(`❌ Product not found: ${item.itemNumber}`);
      return { success: false, itemNumber: item.itemNumber, error: 'Product not found' };
    }
    
    // Step 2: Extract image URL
    const imageUrl = await extractImageUrl(productUrl);
    if (!imageUrl) {
      console.log(`❌ Image not found: ${item.itemNumber}`);
      return { success: false, itemNumber: item.itemNumber, error: 'Image not found' };
    }
    
    // Step 3: Convert to WebP
    const webpData = await convertToWebP(imageUrl, item.itemNumber);
    if (!webpData) {
      console.log(`❌ Conversion failed: ${item.itemNumber}`);
      return { success: false, itemNumber: item.itemNumber, error: 'Conversion failed' };
    }
    
    // Step 4: Save WebP
    const savedPath = await saveWebP(webpData.dataUrl, item.itemNumber);
    if (!savedPath) {
      console.log(`❌ Save failed: ${item.itemNumber}`);
      return { success: false, itemNumber: item.itemNumber, error: 'Save failed' };
    }
    
    console.log(`✅ Success: ${item.itemNumber}`);
    return { 
      success: true, 
      itemNumber: item.itemNumber, 
      path: savedPath,
      size: webpData.size 
    };
    
  } catch (error) {
    console.log(`❌ Error: ${item.itemNumber} - ${error.message}`);
    return { success: false, itemNumber: item.itemNumber, error: error.message };
  }
}

// Main batch processor
async function batchProcess() {
  console.log('🚀 Starting batch conversion...\n');
  console.log(`Total items: ${items.length}`);
  console.log(`Converter API: ${CONVERTER_API}\n`);
  
  const results = {
    total: items.length,
    successful: 0,
    failed: 0,
    items: []
  };
  
  for (const item of items) {
    const result = await processItem(item);
    results.items.push(result);
    
    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
    }
    
    // Delay between requests to avoid rate limiting
    await delay(2000);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 BATCH CONVERSION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Items: ${results.total}`);
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(50));
  
  // Save results to JSON
  await fs.writeFile(
    `${OUTPUT_DIR}/conversion-results.json`, 
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n📄 Results saved to: ${OUTPUT_DIR}/conversion-results.json`);
}

// Run batch processor
if (require.main === module) {
  batchProcess().catch(console.error);
}

module.exports = { processItem, batchProcess };