import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import ReviewScraper from './review-scraper.js';

class ShoppingAdvisorMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'shopping-advisor-mcp',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.reviewScraper = new ReviewScraper();
        this.setupTools();
    }

    setupTools() {
        // Tool 1: Get product reviews
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;

            switch (name) {
                case 'get_product_reviews':
                    return await this.getProductReviews(args);
                case 'analyze_reviews':
                    return await this.analyzeReviews(args);
                case 'get_review_summary':
                    return await this.getReviewSummary(args);
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        });

        // Tool 2: List available tools
        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'get_product_reviews',
                        description: 'Fetch real-time product reviews from multiple sources',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                product_name: {
                                    type: 'string',
                                    description: 'Name of the product to search for'
                                },
                                use_real_data: {
                                    type: 'boolean',
                                    description: 'Whether to fetch real-time data or use static data',
                                    default: true
                                }
                            },
                            required: ['product_name']
                        }
                    },
                    {
                        name: 'analyze_reviews',
                        description: 'Analyze reviews and provide buying recommendation',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                reviews: {
                                    type: 'array',
                                    description: 'Array of review objects to analyze'
                                },
                                product_name: {
                                    type: 'string',
                                    description: 'Name of the product'
                                }
                            },
                            required: ['reviews', 'product_name']
                        }
                    },
                    {
                        name: 'get_review_summary',
                        description: 'Get a summary of review statistics',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                reviews: {
                                    type: 'array',
                                    description: 'Array of review objects to summarize'
                                }
                            },
                            required: ['reviews']
                        }
                    }
                ]
            };
        });
    }

    async getProductReviews(args) {
        const { product_name, use_real_data = true } = args;

        try {
            let reviews = [];

            if (use_real_data) {
                reviews = await this.reviewScraper.getRealReviews(product_name);
            } else {
                // Use static data
                const fs = await import('fs');
                const path = await import('path');
                const { fileURLToPath } = await import('url');
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const dataPath = path.join(__dirname, '..', 'data', 'products.json');
                const productData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                const product = productData[product_name];

                if (product) {
                    reviews = product.reviews;
                }
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: `Found ${reviews.length} reviews for ${product_name}`
                    }
                ],
                isError: false
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching reviews: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    async analyzeReviews(args) {
        const { reviews, product_name } = args;

        try {
            // Calculate statistics
            const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            const sentimentCounts = reviews.reduce((acc, review) => {
                acc[review.sentiment] = (acc[review.sentiment] || 0) + 1;
                return acc;
            }, {});

            // Prepare review text for analysis
            const reviewText = reviews.map(review =>
                `Rating: ${review.rating}/5 - ${review.text} (Source: ${review.source})`
            ).join('\n');

            return {
                content: [
                    {
                        type: 'text',
                        text: `Analysis for ${product_name}:\n\n` +
                            `Average Rating: ${avgRating.toFixed(1)}/5\n` +
                            `Total Reviews: ${reviews.length}\n` +
                            `Sentiment: ${sentimentCounts.positive || 0} positive, ${sentimentCounts.neutral || 0} neutral, ${sentimentCounts.negative || 0} negative\n\n` +
                            `Review Data:\n${reviewText}`
                    }
                ],
                isError: false
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error analyzing reviews: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    async getReviewSummary(args) {
        const { reviews } = args;

        try {
            const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
            const ratingDistribution = reviews.reduce((acc, review) => {
                acc[review.rating] = (acc[review.rating] || 0) + 1;
                return acc;
            }, {});

            return {
                content: [
                    {
                        type: 'text',
                        text: `Review Summary:\n` +
                            `Average Rating: ${avgRating.toFixed(1)}/5\n` +
                            `Total Reviews: ${reviews.length}\n` +
                            `Rating Distribution: ${Object.entries(ratingDistribution).map(([rating, count]) => `${rating}★: ${count}`).join(', ')}`
                    }
                ],
                isError: false
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error summarizing reviews: ${error.message}`
                    }
                ],
                isError: true
            };
        }
    }

    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('🚀 MCP Server started');
    }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new ShoppingAdvisorMCPServer();
    server.start().catch(console.error);
}

export default ShoppingAdvisorMCPServer; 