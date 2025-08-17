// Vercel serverless function for garden layout image generation using DALL-E
const OpenAI = require('openai');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST Method not allowed' });
  }

  try {
    const { beds2x2, beds4x4, beds4x8, trellises, tomatoCages, selectedVegetables, layoutText } = req.body;

    // Validate input
    if (!selectedVegetables || selectedVegetables.length === 0) {
      return res.status(400).json({ 
        error: 'Please select at least one plant.' 
      });
    }

    const totalBeds = (beds2x2 || 0) + (beds4x4 || 0) + (beds4x8 || 0);
    if (totalBeds === 0) {
      return res.status(400).json({ 
        error: 'Please select at least one bed.' 
      });
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Image generation requires an API key.' 
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create bed summary for prompt
    const bedSummary = [];
    if (beds2x2 > 0) bedSummary.push(`${beds2x2} small 2x2 feet raised bed${beds2x2 > 1 ? 's' : ''}`);
    if (beds4x4 > 0) bedSummary.push(`${beds4x4} medium 4x4 feet raised bed${beds4x4 > 1 ? 's' : ''}`);
    if (beds4x8 > 0) bedSummary.push(`${beds4x8} large 4x8 feet raised bed${beds4x8 > 1 ? 's' : ''}`);

    // Create support structure summary
    const supportSummary = [];
    if (trellises > 0) supportSummary.push(`${trellises} garden trellis${trellises > 1 ? 'es' : ''}`);
    if (tomatoCages > 0) supportSummary.push(`${tomatoCages} tomato cage${tomatoCages > 1 ? 's' : ''}`);

    // Categorize plants for better description
    const vegetables = ['Tomatoes', 'Carrots', 'Peppers', 'Onions', 'Radishes', 'Beans', 'Peas', 'Cucumber', 'Zucchini', 'Broccoli', 'Cauliflower', 'Beets', 'Corn', 'Squash', 'Eggplant', 'Brussels Sprouts', 'Cabbage', 'Leeks'];
    const greens = ['Lettuce', 'Spinach', 'Kale', 'Swiss Chard', 'Arugula', 'Bok Choy', 'Collard Greens', 'Mustard Greens', 'Watercress', 'Endive'];
    const fruits = ['Strawberries', 'Blueberries', 'Raspberries', 'Blackberries', 'Rhubarb', 'Melons', 'Watermelons', 'Cantaloupe'];
    const herbs = ['Basil', 'Cilantro', 'Parsley', 'Oregano', 'Thyme', 'Rosemary', 'Sage', 'Chives', 'Dill', 'Mint', 'Lavender', 'Tarragon'];
    const companions = ['Wildflowers', 'Marigolds', 'Nasturtiums', 'Sunflowers'];

    const selectedVeggies = selectedVegetables.filter(plant => vegetables.includes(plant));
    const selectedGreens = selectedVegetables.filter(plant => greens.includes(plant));
    const selectedFruits = selectedVegetables.filter(plant => fruits.includes(plant));
    const selectedHerbs = selectedVegetables.filter(plant => herbs.includes(plant));
    const selectedCompanions = selectedVegetables.filter(plant => companions.includes(plant));

    // Create detailed DALL-E prompt using the layout text for alignment
    let prompt = `Create a detailed bird's-eye view illustration of a vegetable garden layout. The garden should include:

GARDEN BEDS: ${bedSummary.join(', ')} arranged in an organized pattern with pathways between them.

PLANTS: Show the following plants growing in appropriate sections of the beds:
${selectedVeggies.length > 0 ? `- Vegetables: ${selectedVeggies.join(', ')}` : ''}
${selectedGreens.length > 0 ? `- Leafy Greens: ${selectedGreens.join(', ')}` : ''}
${selectedFruits.length > 0 ? `- Fruits: ${selectedFruits.join(', ')}` : ''}
${selectedHerbs.length > 0 ? `- Herbs: ${selectedHerbs.join(', ')}` : ''}
${selectedCompanions.length > 0 ? `- Companion Plants: ${selectedCompanions.join(', ')}` : ''}

${supportSummary.length > 0 ? `SUPPORT STRUCTURES: Include ${supportSummary.join(' and ')} positioned appropriately near climbing plants.` : ''}`;

    // If we have layout text from GPT, use it to inform the visual layout
    if (layoutText && typeof layoutText === 'string') {
      // Extract key layout information from the text
      const layoutInfo = layoutText.substring(0, 500); // Use first 500 chars for context
      prompt += `\n\nLAYOUT GUIDANCE: Follow this specific layout plan: ${layoutInfo}`;
    }

    prompt += `\n\nThe illustration should be:
- A realistic garden view from above showing rectangular raised beds
- Plants should be recognizable and properly sized for their type
- Include garden pathways between beds
- Use natural garden colors (greens, browns, earth tones)
- Show plants at a mid-growing stage, not seedlings
- Organized and well-planned layout following the specific guidance provided
- Include some soil texture and garden path materials
- Bright, clear daylight lighting

Style: Detailed garden illustration, realistic but clean, like a professional garden design rendering.`;

    // Call DALL-E API
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url"
    });

    // Safely extract the image URL
    if (!response || !response.data || response.data.length === 0) {
      throw new Error('No image generated from DALL-E');
    }

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('Invalid image URL from DALL-E');
    }

    res.json({ imageUrl });

  } catch (error) {
    console.error('Error generating garden image:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please check your configuration.' 
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'OpenAI API rate limit exceeded. Please try again later.' 
      });
    }

    if (error.status === 400) {
      return res.status(400).json({ 
        error: 'Image generation request was rejected. The content might not be suitable for image generation.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate garden image. Please try again.' 
    });
  }
}
