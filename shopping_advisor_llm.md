# 🛍️ Shopping Advisor from Product Reviews

## 🚀 Overview

A smart, AI-powered product review analyzer that helps users make better shopping decisions. Users can either upload a dataset of product reviews or fetch live reviews from the internet, and the system summarizes pros, cons, and the overall sentiment using LLM (Large Language Model) and Model Context Protocol (MCP).

## 🧠 Features

- 🔍 Summarize top **Pros**, **Cons**, and **Verdict**
- 📂 Upload your own **review datasets** (CSV or JSON)
- 🌐 Fetch **real-time reviews** from product pages (Amazon, etc.)
- 🤖 Ask natural language questions like: *"Is this product good for travel?"*
- 🧠 Uses **LLM** with **MCP** for contextual and grounded answers

## 🛠️ Tech Stack

### Frontend

- **Framework**: React (Vite or Next.js)
- **Styling**: Tailwind CSS
- **File Uploads**: PapaParse (CSV parser)
- **HTTP**: Axios

### Backend

- **Runtime**: Node.js + Express
- **LLM Framework**: LangChain
- **Embedding + Context**: FAISS / Memory Vector Store
- **Scraping**: Playwright / Puppeteer
- **LLM Provider**: OpenAI GPT-4o or Claude (Anthropic)

### Data

- Format: CSV or JSON
- Fields: `review`, `rating`, `summary`, `product_id`

## ⚙️ API Endpoints

### `POST /upload`

Uploads and processes the review dataset.

### `POST /summarize`

Returns top 3 pros, cons, and an overall verdict for a given product.

### `POST /ask`

Takes a user question and returns an answer based only on the reviews (MCP enforced).

### `POST /fetch-reviews`

Scrapes real-time reviews from Amazon, Walmart, etc. (given product URL).

## 📁 Project Structure

```
shopping-advisor/
├── frontend/
│   ├── components/
│   ├── pages/
│   └── ...
├── backend/
│   ├── routes/
│   ├── llm/
│   ├── scraper/
│   └── index.js
├── data/
│   └── sample_reviews.csv
└── README.md
```

## 🧪 Example Prompt (LLM)

```
You are a shopping advisor. Based only on the reviews below:
- List top 3 Pros
- List top 3 Cons
- Give a one-line summary verdict

Reviews:
{reviews_chunk}
```

## 🧠 MCP Integration

- Vector store only contains reviews from uploaded/fetched data
- No external hallucinated knowledge
- Chunk + embed reviews → retrieve relevant chunks → answer

## 💡 Stretch Goals

- 📊 Visualize sentiment/emotion breakdown
- 📦 Compare two products side-by-side
- 🧩 Deploy as a Chrome extension

## 🏁 Quick Start

1. Clone repo
2. Run backend: `npm install && npm run dev`
3. Run frontend: `npm install && npm run dev`
4. Upload a CSV or paste product link
5. Summarize or ask questions

---

Made with 💙 at a hackathon by Shekhar

