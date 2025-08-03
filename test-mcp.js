const ReviewScraper = require('./mcp/review-scraper');

async function testMCPScraping() {
    console.log('🧪 Testing MCP Review Scraper...\n');

    const scraper = new ReviewScraper();

    try {
        // Test with a popular product
        const productName = 'iPhone 15 Pro';
        console.log(`🔍 Testing scraping for: ${productName}`);

        const reviews = await scraper.getRealReviews(productName);

        console.log(`✅ Found ${reviews.length} reviews`);
        console.log('📊 Review sources:', [...new Set(reviews.map(r => r.source))]);

        if (reviews.length > 0) {
            console.log('\n📝 Sample reviews:');
            reviews.slice(0, 2).forEach((review, index) => {
                console.log(`\n${index + 1}. ${review.source} - ${review.rating}★`);
                console.log(`   "${review.text.substring(0, 100)}..."`);
                console.log(`   Sentiment: ${review.sentiment}`);
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await scraper.close();
        console.log('\n✅ Test completed');
    }
}

// Run the test
testMCPScraping(); 