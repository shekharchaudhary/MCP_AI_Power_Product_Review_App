const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

class ShoppingAdvisorMCPClient {
    constructor() {
        this.client = null;
        this.transport = null;
    }

    async connect() {
        try {
            this.transport = new StdioClientTransport();
            this.client = new Client({
                name: 'shopping-advisor-client',
                version: '1.0.0',
            });

            await this.client.connect(this.transport);
            console.log('🔗 MCP Client connected');
            return true;
        } catch (error) {
            console.error('MCP Client connection failed:', error);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }

    async getProductReviews(productName, useRealData = true) {
        try {
            const result = await this.client.callTool({
                name: 'get_product_reviews',
                arguments: {
                    product_name: productName,
                    use_real_data: useRealData
                }
            });

            return result;
        } catch (error) {
            console.error('MCP getProductReviews error:', error);
            return null;
        }
    }

    async analyzeReviews(reviews, productName) {
        try {
            const result = await this.client.callTool({
                name: 'analyze_reviews',
                arguments: {
                    reviews: reviews,
                    product_name: productName
                }
            });

            return result;
        } catch (error) {
            console.error('MCP analyzeReviews error:', error);
            return null;
        }
    }

    async getReviewSummary(reviews) {
        try {
            const result = await this.client.callTool({
                name: 'get_review_summary',
                arguments: {
                    reviews: reviews
                }
            });

            return result;
        } catch (error) {
            console.error('MCP getReviewSummary error:', error);
            return null;
        }
    }

    async listTools() {
        try {
            const result = await this.client.listTools();
            return result;
        } catch (error) {
            console.error('MCP listTools error:', error);
            return null;
        }
    }
}

module.exports = ShoppingAdvisorMCPClient; 