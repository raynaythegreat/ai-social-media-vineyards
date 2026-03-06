# Social Media Engine for Vineyards

AI-powered social media content generator that creates Instagram, Facebook, and Twitter posts from your vineyard photos.

## Features

- 📸 Upload vineyard photos (harvest, tastings, events)
- 🤖 AI analyzes images and generates content
- 📝 Creates captions for Instagram, Facebook, Twitter
- 🏷️ Generates relevant hashtags
- 📅 Content calendar for scheduling
- 💡 Story ideas and content suggestions
- 📊 Export ready-to-post content

## Quick Start

```bash
# Install dependencies
npm run install:all

# Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY

# Start development servers
npm run dev
```

Opens at:
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

## Tech Stack

- **Backend**: Node.js, Express, SQLite, OpenAI GPT-4 Vision
- **Frontend**: React, Vite, Modern CSS
- **AI**: OpenAI GPT-4 Vision for image analysis and content generation

## Environment Variables

Create `backend/.env`:
```
OPENAI_API_KEY=your_key_here
PORT=4000
```

## API Endpoints

- `POST /api/content/upload` - Upload photo and generate content
- `GET /api/content` - Get all content history
- `PUT /api/content/:id/schedule` - Schedule content
- `GET /api/content/calendar` - Get calendar view
- `GET /api/content/:id/export` - Export single post

## Project Structure

```
social-media-vineyards/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── services/
│   │   └── db/
│   ├── uploads/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── main.jsx
│   └── package.json
└── package.json
```

## License

MIT
