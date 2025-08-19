# 🌱 Garden Layout Designer

*Because even vegetables need good neighbors!*

This is my personal garden planning tool that combines my love for gardening with AI technology. As someone who's tired of cramming too many tomatoes into tiny beds or wondering if carrots and onions really make good companions, I built this React app to help design better vegetable garden layouts using OpenAI's intelligence.

## What It Actually Does

Instead of guessing where to plant what, this app lets you:

- **Configure your real garden space**: Tell it how many 2×2, 4×4, or 4×8 foot raised beds you have
- **Pick your vegetables**: Choose from 20 common vegetables I actually grow (tomatoes, lettuce, herbs, etc.)
- **Get smart layout advice**: The AI considers companion planting, spacing, sunlight needs, and growth patterns
- **Learn as you go**: Each recommendation explains *why* certain plants work well together

The best part? It has a fallback mode when the API is down, so you're never left plantless.

## My Garden Setup Journey

I got tired of:
- Planting tomatoes that shaded out my lettuce
- Forgetting which herbs pair well with which vegetables  
- Overcrowding beds and getting disappointing harvests
- Redoing my garden layout every season from scratch

So I built this tool to remember all the companion planting wisdom and spacing requirements I keep forgetting.

## Getting Started

### Local Development
```bash
# Clone and install
git clone [your-repo-url]
cd garden
npm install

# Add your OpenAI API key
echo "OPENAI_API_KEY=your_key_here" > api/.env.local

# Start it up
npm start
```

Visit `http://localhost:3000` and start planning your garden!

### Production Deploy
The app runs on Vercel with a serverless function (`/api/generate-garden-layout.js`) that handles OpenAI API calls securely. No API keys exposed to the frontend.

## Architecture Choices

**Frontend**: React with hooks - keeps it simple for a personal project
**Backend**: Vercel serverless function - no need to maintain a server for occasional garden planning
**AI**: OpenAI GPT models - they surprisingly know a lot about companion planting
**Styling**: Custom CSS - because I wanted it to look like a garden, not a corporate dashboard

The `gardenService.js` intelligently switches between local development (port 3001) and production API endpoints.

## What I Learned Building This

1. **Serverless functions are perfect for hobby projects** - No server maintenance for something I use seasonally
2. **AI is great at garden knowledge** - GPT knows companion planting better than I do
3. **Fallback responses matter** - When the API is down, I still want garden advice
4. **Simple UX wins** - Checkboxes and number inputs beat complex forms

## Future Ideas

- [ ] Save and compare different layout plans
- [ ] Add planting calendar integration
- [ ] Include seed packet spacing recommendations
- [ ] Photo upload for existing garden analysis
- [ ] Weather-based planting suggestions

## Growing Season Notes

I typically use this app in late winter/early spring when planning the year's garden. The AI recommendations have genuinely improved my harvests by suggesting plant combinations I wouldn't have thought of.

*Happy gardening!* 🥕🍅🥬
