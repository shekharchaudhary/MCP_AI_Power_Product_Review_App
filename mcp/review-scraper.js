import puppeteer from 'puppeteer';

class ReviewScraper {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Get reviews from Reddit API (more reliable than scraping)
  async getRedditReviews(productName) {
    try {
      console.log(`🔍 Fetching Reddit reviews for: ${productName}`);

      // Reddit API endpoint for search
      const searchQuery = encodeURIComponent(productName);
      const url = `https://www.reddit.com/search.json?q=${searchQuery}&type=link&sort=relevance&t=year&limit=10`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Shopping-Advisor-Bot/1.0'
        }
      });

      if (!response.ok) {
        console.log(`❌ Reddit API request failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const posts = data.data?.children || [];

      const reviews = posts.map(post => {
        const postData = post.data;
        const title = postData.title || '';
        const text = postData.selftext || '';
        const upvotes = postData.ups || 0;
        const downvotes = postData.downs || 0;
        const score = upvotes - downvotes;

        // Determine rating based on score and content
        let rating = 3; // Default neutral
        if (score > 100) rating = 5;
        else if (score > 50) rating = 4;
        else if (score > 10) rating = 3;
        else if (score < -10) rating = 1;
        else if (score < 0) rating = 2;

        // Enhanced sentiment analysis
        const positiveWords = ['great', 'good', 'excellent', 'amazing', 'love', 'perfect', 'best', 'awesome', 'fantastic', 'outstanding', 'superb', 'brilliant'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disappointed', 'poor', 'horrible', 'useless', 'waste', 'regret', 'avoid'];

        const content = (title + ' ' + text).toLowerCase();
        const positiveCount = positiveWords.filter(word => content.includes(word)).length;
        const negativeCount = negativeWords.filter(word => content.includes(word)).length;

        let sentiment = 'neutral';
        if (positiveCount > negativeCount) sentiment = 'positive';
        else if (negativeCount > positiveCount) sentiment = 'negative';

        return {
          text: `${title}\n\n${text}`,
          rating,
          sentiment,
          source: 'Reddit',
          date: new Date(postData.created_utc * 1000).toISOString().split('T')[0]
        };
      }).filter(review => review.text.length > 50); // Filter out very short posts

      console.log(`✅ Found ${reviews.length} Reddit reviews for ${productName}`);
      return reviews;

    } catch (error) {
      console.error('Reddit API error:', error);
      return [];
    }
  }

  // Get reviews from Trustpilot (using Puppeteer)
  async getTrustpilotReviews(productName) {
    try {
      console.log(`🔍 Fetching Trustpilot reviews for: ${productName}`);

      await this.init();
      const page = await this.browser.newPage();

      // Set user agent and other headers
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      // Remove webdriver property
      await page.evaluateOnNewDocument(() => {
        delete navigator.__proto__.webdriver;
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      // Navigate to Trustpilot search
      const searchQuery = encodeURIComponent(productName);
      await page.goto(`https://www.trustpilot.com/search?query=${searchQuery}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for results to load
      await page.waitForTimeout(3000);

      // Extract review data
      const reviews = await page.evaluate(() => {
        const reviewElements = document.querySelectorAll('[data-service-review-card-hermes-article]');
        const reviews = [];

        reviewElements.slice(0, 10).forEach(element => {
          try {
            const ratingElement = element.querySelector('[data-service-review-rating]');
            const textElement = element.querySelector('[data-service-review-title-hermes]');
            const dateElement = element.querySelector('time');

            if (ratingElement && textElement) {
              const rating = parseInt(ratingElement.getAttribute('data-service-review-rating')) || 3;
              const text = textElement.textContent?.trim() || '';
              const date = dateElement?.getAttribute('datetime') || new Date().toISOString();

              // Simple sentiment analysis
              const positiveWords = ['great', 'good', 'excellent', 'amazing', 'love', 'perfect', 'best', 'awesome'];
              const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disappointed', 'poor', 'horrible'];

              const content = text.toLowerCase();
              const positiveCount = positiveWords.filter(word => content.includes(word)).length;
              const negativeCount = negativeWords.filter(word => content.includes(word)).length;

              let sentiment = 'neutral';
              if (positiveCount > negativeCount) sentiment = 'positive';
              else if (negativeCount > positiveCount) sentiment = 'negative';

              reviews.push({
                text,
                rating,
                sentiment,
                source: 'Trustpilot',
                date: date.split('T')[0]
              });
            }
          } catch (error) {
            console.error('Error parsing review element:', error);
          }
        });

        return reviews;
      });

      await page.close();
      console.log(`✅ Found ${reviews.length} Trustpilot reviews for ${productName}`);
      return reviews;

    } catch (error) {
      console.error('Trustpilot scraping error:', error);
      return [];
    }
  }

  // Get reviews from Product Hunt (placeholder for GraphQL API)
  async getProductHuntReviews(productName) {
    try {
      console.log(`🔍 Fetching Product Hunt reviews for: ${productName}`);

      // Product Hunt GraphQL API would require authentication
      // For now, return empty array
      console.log(`⚠️ Product Hunt API requires authentication token`);
      return [];

    } catch (error) {
      console.error('Product Hunt API error:', error);
      return [];
    }
  }

  // Get real reviews from multiple APIs
  async getRealReviewsFromAPIs(productName) {
    console.log(`🔍 Fetching real reviews from APIs for: ${productName}`);

    const results = await Promise.allSettled([
      this.getRedditReviews(productName),
      this.getTrustpilotReviews(productName),
      this.getProductHuntReviews(productName)
    ]);

    const allReviews = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        const source = ['Reddit', 'Trustpilot', 'Product Hunt'][index];
        console.log(`✅ Found ${result.value.length} ${source} reviews for ${productName}`);
        allReviews.push(...result.value);
      }
    });

    console.log(`✅ Found ${allReviews.length} total API reviews for ${productName}`);
    return allReviews;
  }

  // Generate mock reviews for testing
  async generateMockReviews(productName) {
    console.log(`🎭 Generating mock reviews for: ${productName}`);

    // Check for specific "bad" products to test negative recommendations
    const badProducts = [
      'juicero press', 'theranos edison', 'google glass',
      'microsoft zune', 'blackberry storm', 'nintendo virtual boy',
      'segway', 'crystal pepsi', 'microsoft bob', 'webvan'
    ];

    const isBadProduct = badProducts.some(bad =>
      productName.toLowerCase().includes(bad.toLowerCase())
    );

    if (isBadProduct) {
      return [
        {
          text: "This product was a complete disaster. Poor design, terrible functionality, and a waste of money. Avoid at all costs.",
          rating: 1,
          sentiment: 'negative',
          source: 'Mock Data',
          date: '2024-01-15'
        },
        {
          text: "One of the worst products I've ever used. Nothing works as advertised and it's incredibly frustrating.",
          rating: 1,
          sentiment: 'negative',
          source: 'Mock Data',
          date: '2024-01-10'
        },
        {
          text: "Terrible user experience. The product is poorly made and breaks easily. Not worth the money.",
          rating: 2,
          sentiment: 'negative',
          source: 'Mock Data',
          date: '2024-01-05'
        },
        {
          text: "Disappointed with this purchase. The quality is subpar and it doesn't deliver on its promises.",
          rating: 2,
          sentiment: 'negative',
          source: 'Mock Data',
          date: '2024-01-01'
        },
        {
          text: "Would not recommend. The product has many flaws and doesn't work as expected.",
          rating: 2,
          sentiment: 'negative',
          source: 'Mock Data',
          date: '2023-12-28'
        }
      ];
    }

    // Generate positive mock reviews for other products
    return [
      {
        text: "Excellent product! Great quality and functionality. Highly recommend for anyone looking for this type of item.",
        rating: 5,
        sentiment: 'positive',
        source: 'Mock Data',
        date: '2024-01-15'
      },
      {
        text: "Very satisfied with this purchase. It works perfectly and exceeded my expectations. Great value for money.",
        rating: 5,
        sentiment: 'positive',
        source: 'Mock Data',
        date: '2024-01-10'
      },
      {
        text: "Good product overall. Some minor issues but nothing major. Would buy again.",
        rating: 4,
        sentiment: 'positive',
        source: 'Mock Data',
        date: '2024-01-05'
      },
      {
        text: "Decent quality and reasonable price. Meets my needs adequately. No major complaints.",
        rating: 4,
        sentiment: 'neutral',
        source: 'Mock Data',
        date: '2024-01-01'
      },
      {
        text: "Average product. Not amazing but not terrible either. Does what it's supposed to do.",
        rating: 3,
        sentiment: 'neutral',
        source: 'Mock Data',
        date: '2023-12-28'
      }
    ];
  }

  // Main function to get real reviews
  async getRealReviews(productName) {
    try {
      console.log(`🔍 Fetching real reviews for: ${productName}`);

      // First try to get reviews from APIs
      const apiReviews = await this.getRealReviewsFromAPIs(productName);

      if (apiReviews.length > 0) {
        console.log(`✅ Found ${apiReviews.length} real API reviews for ${productName}`);
        return apiReviews;
      }

      // Fallback to mock reviews
      console.log(`⚠️ No API reviews found, using mock data for ${productName}`);
      return await this.generateMockReviews(productName);

    } catch (error) {
      console.error('Error fetching real reviews:', error);
      return await this.generateMockReviews(productName);
    }
  }
}

export default ReviewScraper;
