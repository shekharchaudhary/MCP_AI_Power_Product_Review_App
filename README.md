# 🛍️ Shopping Advisor AI

A simple chat interface where you can ask about any product and get AI-powered buying recommendations based on review analysis.

## ✨ Features

- **Simple Chat Interface**: Just type a product name and get instant analysis
- **AI-Powered Analysis**: Uses OpenAI GPT to analyze reviews and provide recommendations
- **Review Analysis**: Analyzes star ratings, sentiment, and review content
- **Buying Recommendations**: Clear BUY/DON'T BUY advice with pros and cons
- **Modern UI**: Clean, professional chat interface with smooth animations

## 🚀 Quick Start

### 1. Setup

```bash
# Clone or navigate to the project
cd shopping-advisor

# Install dependencies
npm install
```

### 2. Configure OpenAI API

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### 3. Run the Application

```bash
# Start the server
npm start

# Or for development with auto-restart
npm run dev
```

### 4. Open in Browser

Navigate to: http://localhost:3001

## 🎯 How to Use

1. **Type a Product Name**: Enter the exact product name (e.g., "iPhone 15", "MacBook Pro M3")
2. **Get Analysis**: The AI will analyze reviews and provide:
   - Average rating
   - Number of reviews analyzed
   - Clear BUY/DON'T BUY recommendation
   - Top pros and cons
   - Overall rating out of 10

## 📱 Sample Products

Try these products to test the system:

- iPhone 15
- Samsung Galaxy S24
- MacBook Pro M3
- Sony WH-1000XM5

## 🛠️ Technical Details

### Backend

- **Node.js + Express**: RESTful API server
- **OpenAI GPT-3.5-turbo**: AI analysis engine
- **Sample Data**: Currently uses mock review data (easily expandable)

### Frontend

- **Vanilla HTML/CSS/JS**: Simple, fast, no framework dependencies
- **Modern UI**: Gradient backgrounds, smooth animations, responsive design
- **Chat Interface**: Real-time messaging with loading states

### AI Analysis

The system analyzes:

- **Star Ratings**: Average rating calculation
- **Sentiment Analysis**: Positive/neutral/negative review distribution
- **Review Content**: Detailed analysis of review text
- **Contextual Recommendations**: AI provides personalized buying advice

## 🔧 Customization

### Adding More Products

Edit the `sampleReviews` object in `server.js`:

```javascript
const sampleReviews = {
  'Your Product Name': [
    { text: 'Review text here', rating: 5, sentiment: 'positive' },
    // Add more reviews...
  ],
};
```

### Modifying AI Prompts

Edit the system prompt in the `analyzeProduct` function to change how the AI analyzes reviews.

## 🚀 Future Enhancements

- **Web Scraping**: Real-time review fetching from Amazon, etc.
- **Database Integration**: Store reviews in MongoDB/PostgreSQL
- **User Accounts**: Save favorite products and analysis history
- **Product Comparison**: Side-by-side product analysis
- **Chrome Extension**: Browser integration for instant analysis

## 📄 License

ISC License

---

Made with 💙 by Shekhar
