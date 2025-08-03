import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ReviewScraper from './mcp/review-scraper.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize MCP components
const reviewScraper = new ReviewScraper();

// Load real product data (static)
function loadProductData() {
  try {
    const dataPath = path.join(__dirname, 'data', 'products.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading product data:', error);
    return {};
  }
}

const productData = loadProductData();

// Function to analyze reviews using MCP (Model Context Protocol)
async function analyzeProductWithMCP(productName, useRealData = false) {
  let reviews = [];
  let metadata = {};

  if (useRealData) {
    console.log(`🔍 Using MCP to fetch real reviews for: ${productName}`);
    reviews = await reviewScraper.getRealReviews(productName);

    if (reviews.length === 0) {
      return {
        product: productName,
        found: false,
        message: "No real reviews found. Try using static data or a different product name."
      };
    }

    // Create better metadata for scraped products based on product name
    const productNameLower = productName.toLowerCase();
    let category = "General";
    let brand = "Various";
    let price = "Varies";

    // Determine category and brand from product name
    if (productNameLower.includes('iphone') || productNameLower.includes('samsung') || productNameLower.includes('pixel')) {
      category = "Smartphones";
      if (productNameLower.includes('iphone')) brand = "Apple";
      else if (productNameLower.includes('samsung')) brand = "Samsung";
      else if (productNameLower.includes('pixel')) brand = "Google";
    } else if (productNameLower.includes('tesla') || productNameLower.includes('model')) {
      category = "Automotive";
      brand = "Tesla";
      price = "$35,000+";
    } else if (productNameLower.includes('macbook') || productNameLower.includes('laptop')) {
      category = "Computers";
      brand = "Apple";
      price = "$1,000+";
    } else if (productNameLower.includes('sony') || productNameLower.includes('headphone')) {
      category = "Audio";
      brand = "Sony";
      price = "$200+";
    } else if (productNameLower.includes('nintendo') || productNameLower.includes('switch')) {
      category = "Gaming";
      brand = "Nintendo";
      price = "$300+";
    } else if (productNameLower.includes('camera') || productNameLower.includes('canon') || productNameLower.includes('nikon')) {
      category = "Photography";
      if (productNameLower.includes('canon')) brand = "Canon";
      else if (productNameLower.includes('nikon')) brand = "Nikon";
      else brand = "Various";
      price = "$500+";
    }

    metadata = {
      category: category,
      brand: brand,
      price: price,
      release_date: "Recent"
    };
  } else {
    // Use static data
    const product = productData[productName];

    if (!product) {
      return {
        product: productName,
        found: false,
        message: "Product not found in our database. Please try a different product or use real data mode."
      };
    }
    reviews = product.reviews;
    metadata = product.metadata;
  }

  // Calculate statistics
  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const sentimentCounts = reviews.reduce((acc, review) => {
    acc[review.sentiment] = (acc[review.sentiment] || 0) + 1;
    return acc;
  }, {});

  const ratingDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {});

  // MCP: Ground the LLM response in specific review data
  const reviewText = reviews.map(review =>
    `Rating: ${review.rating}/5 - ${review.text} (Source: ${review.source})`
  ).join('\n');

  try {
    // Use MCP to ensure LLM only uses provided review data
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a shopping advisor. Provide a recommendation in this EXACT format with all 4 sections:

**BUY** or **DON'T BUY**

**Overall Rating**: X/10

**Why Buy/Don't Buy**: [Explain the main reasons from reviews - what makes it worth buying or what problems make it not worth it]

**Summary**: [Brief overview of key features and issues]

**Best For**: [Who this product is ideal for]

IMPORTANT: Do NOT use numbers (1., 2., 3., etc.) in your response. Use only the section headers as shown above.`
        },
        {
          role: "user",
          content: `Product: Example Product
Category: Electronics
Brand: Example Brand
Price: $100

REVIEW DATA:
Rating: 4/5 - Great product, works well
Rating: 3/5 - Average quality, okay for the price
Rating: 5/5 - Excellent value, highly recommend

Statistics:
- Average Rating: 4.0/5
- Total Reviews: 3
- Rating Distribution: 3★: 1, 4★: 1, 5★: 1
- Sentiment: 2 positive, 1 neutral, 0 negative

Respond in the EXACT format specified above.`
        },
        {
          role: "assistant",
          content: `**BUY**

**Overall Rating**: 7/10

**Why Buy/Don't Buy**: The reviews show generally positive feedback with users praising the product's functionality and value. While there's some variation in ratings, the overall sentiment is favorable with users finding it worth the price.

**Summary**: The reviews show generally positive feedback with users praising the product's functionality and value. While there's some variation in ratings, the overall sentiment is favorable with users finding it worth the price.

**Best For**: Users looking for good value electronics with reliable performance.`
        },
        {
          role: "user",
          content: `Product: ${productName}
Category: ${metadata.category}
Brand: ${metadata.brand}
Price: ${metadata.price}

REVIEW DATA (ONLY use this data for your analysis):
${reviewText}

Statistics:
- Average Rating: ${avgRating.toFixed(1)}/5
- Total Reviews: ${reviews.length}
- Rating Distribution: ${Object.entries(ratingDistribution).map(([rating, count]) => `${rating}★: ${count}`).join(', ')}
- Sentiment: ${sentimentCounts.positive || 0} positive, ${sentimentCounts.neutral || 0} neutral, ${sentimentCounts.negative || 0} negative

Respond in the EXACT format specified above. Make sure to include the "Why Buy/Don't Buy" reasoning section.`
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    });

    const analysis = completion.choices[0].message.content;

    return {
      product: productName,
      found: true,
      averageRating: avgRating.toFixed(1),
      totalReviews: reviews.length,
      sentimentBreakdown: sentimentCounts,
      ratingDistribution: ratingDistribution,
      metadata: metadata,
      recommendation: analysis,
      dataSource: useRealData ? 'Real-time MCP' : 'Static database',
      mcpEnabled: true
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      product: productName,
      found: false,
      message: "Error analyzing product. Please try again."
    };
  }
}

// Legacy function (for backward compatibility)
async function analyzeProduct(productName, useRealData = false) {
  return await analyzeProductWithMCP(productName, useRealData);
}

// API Routes
app.post('/api/analyze', async (req, res) => {
  try {
    const { productName, useRealData = false } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    console.log(`🔍 Analyzing product: ${productName} (Real Data: ${useRealData})`);

    const result = await analyzeProductWithMCP(productName, useRealData);
    res.json(result);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products', (req, res) => {
  const products = Object.keys(productData);
  res.json({ products });
});

app.post('/api/test-scraping', async (req, res) => {
  try {
    const { productName } = req.body;
    console.log(`🧪 Testing scraping for: ${productName}`);

    const reviews = await reviewScraper.getRealReviews(productName);

    res.json({
      product: productName,
      reviewCount: reviews.length,
      sources: [...new Set(reviews.map(r => r.source))],
      sampleReviews: reviews.slice(0, 3)
    });

  } catch (error) {
    console.error('Scraping test error:', error);
    res.status(500).json({ error: 'Scraping test failed' });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await reviewScraper.close();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Shopping Advisor running on http://localhost:${port}`);
  console.log(`📊 Loaded ${Object.keys(productData).length} products with static data`);
  console.log(`�� MCP Review Scraper ready for real-time data`);
  console.log(`�� Try these products: ${Object.keys(productData).slice(0, 5).join(', ')}`);
  console.log(`🌐 Use Real Data mode for any product name!`);
});
