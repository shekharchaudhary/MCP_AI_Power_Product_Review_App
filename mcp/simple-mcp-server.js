import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import ReviewScraper from './review-scraper.js';

class SimpleMCPServer {
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
    }

    async start() {
        try {
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.log('🚀 Simple MCP Server started');

            // Keep the server running
            process.on('SIGINT', async () => {
                console.log('\n🛑 Shutting down MCP server...');
                await this.reviewScraper.close();
                process.exit(0);
            });

        } catch (error) {
            console.error('MCP Server error:', error);
            process.exit(1);
        }
    }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new SimpleMCPServer();
    server.start().catch(console.error);
}

export default SimpleMCPServer; 