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
    let prompt = `Create a detailed garden layout blueprint diagram showing EXACTLY these specifications:

PRECISE GARDEN BLUEPRINT:
- Draw exactly ${totalBeds} rectangular raised bed(s): ${bedSummary.join(', ')}
- Each bed clearly labeled with dimensions (2x2, 4x4, or 4x8 feet)
${supportSummary.length > 0 ? `- Include exactly ${supportSummary.join(' and ')} with clear icons` : ''}

PLANT ICONS TO INCLUDE (use specific helpful symbols):
${selectedVeggies.length > 0 ? `🍅 Vegetables (${selectedVeggies.length}): ${selectedVeggies.join(', ')} - use tomato, carrot, pepper icons` : ''}
${selectedGreens.length > 0 ? `🥬 Leafy Greens (${selectedGreens.length}): ${selectedGreens.join(', ')} - use leaf symbols` : ''}
${selectedFruits.length > 0 ? `🍓 Fruits (${selectedFruits.length}): ${selectedFruits.join(', ')} - use berry and fruit icons` : ''}
${selectedHerbs.length > 0 ? `🌿 Herbs (${selectedHerbs.length}): ${selectedHerbs.join(', ')} - use small herb leaf symbols` : ''}
${selectedCompanions.length > 0 ? `🌸 Companion Plants (${selectedCompanions.length}): ${selectedCompanions.join(', ')} - use flower symbols` : ''}

SUPPORT STRUCTURE ICONS:
${trellises > 0 ? `🏗️ ${trellises} Trellis(es) - draw as vertical grid/lattice rectangles near climbing plants` : ''}
${tomatoCages > 0 ? `🔺 ${tomatoCages} Tomato Cage(s) - draw as triangular/cone symbols near tomato plants` : ''}

BLUEPRINT STYLE REQUIREMENTS:
- Top-down architectural view (like a landscape plan)
- Clean black lines on white background with colored plant icons
- Each bed drawn as a labeled rectangle with exact dimensions
- Plants positioned logically within beds using recognizable icons/symbols
- Support structures clearly marked with simple geometric shapes
- Include a legend/key showing what each icon represents
- Grid lines or measurement marks for spacing reference
- Plant labels next to each icon for clarity`;

    // If we have visualization data from GPT, use it to inform the precise layout
    if (layoutText && typeof layoutText === 'string') {
      // Use the detailed visualization data for precise positioning
      const cleanLayoutText = layoutText.replace('VISUALIZATION_DATA:', '').trim();
      prompt += `\n\nPRECISE LAYOUT INSTRUCTIONS: ${cleanLayoutText}`;
      prompt += `\n\nFollow these positioning details exactly - use this to determine where each plant icon should be placed within each bed and where support structures should be positioned.`;
    }

    prompt += `\n\nSTYLE: Professional landscape architecture blueprint with helpful plant icons. Black lines on white background with colorful, recognizable plant symbols (tomatoes, carrots, leaves, etc.). Include a clear legend/key. Focus on practical garden planning utility - make it easy to understand where each specific plant goes and where to place support structures.`;

    // Call DALL-E API with cost-effective settings for blueprint diagrams
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024", // Square format good for garden layouts
      quality: "standard", // Standard quality sufficient for diagrams
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
