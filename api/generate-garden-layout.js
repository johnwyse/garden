// Vercel serverless function for garden layout generation
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
    const { beds2x2, beds4x4, beds4x8, trellises, tomatoCages, selectedVegetables } = req.body;

    // Validate input
    if (!selectedVegetables || selectedVegetables.length === 0) {
      return res.status(400).json({ 
        error: 'Please select at least one vegetable.' 
      });
    }

    const totalBeds = (beds2x2 || 0) + (beds4x4 || 0) + (beds4x8 || 0);
    if (totalBeds === 0) {
      return res.status(400).json({ 
        error: 'Please select at least one bed.' 
      });
    }

    // Create bed summary
    const bedSummary = [];
    if (beds2x2 > 0) bedSummary.push(`${beds2x2} bed(s) 2x2 feet`);
    if (beds4x4 > 0) bedSummary.push(`${beds4x4} bed(s) 4x4 feet`);
    if (beds4x8 > 0) bedSummary.push(`${beds4x8} bed(s) 4x8 feet`);

    // Create support structure summary
    const supportSummary = [];
    if (trellises > 0) supportSummary.push(`${trellises} trellis(es)`);
    if (tomatoCages > 0) supportSummary.push(`${tomatoCages} tomato cage(s)`);

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Return a simple placeholder response
      const placeholderResponse = `Garden Layout Generator

        Your Selection:
        - Beds: ${bedSummary.join(', ')}
        ${supportSummary.length > 0 ? `- Support Structures: ${supportSummary.join(', ')}` : ''}
        - Plants: ${selectedVegetables.join(', ')}

        To get personalized garden layouts, add your OPENAI_API_KEY environment variable in your Vercel deployment settings.`;

      return res.json({ layout: placeholderResponse });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Categorize the selected plants
    const vegetables = [];
    const greens = [];
    const fruits = [];
    const herbs = [];
    const companions = [];
    
    // Define plant categories
    const vegetableList = ['Tomatoes', 'Carrots', 'Peppers', 'Onions', 'Radishes', 'Beans', 'Peas', 'Cucumber', 'Zucchini', 'Broccoli', 'Cauliflower', 'Beets', 'Corn', 'Squash', 'Eggplant', 'Brussels Sprouts', 'Cabbage', 'Leeks'];
    const greensList = ['Lettuce', 'Spinach', 'Kale', 'Swiss Chard', 'Arugula', 'Bok Choy', 'Collard Greens', 'Mustard Greens', 'Watercress', 'Endive'];
    const fruitsList = ['Strawberries', 'Blueberries', 'Raspberries', 'Blackberries', 'Rhubarb', 'Melons', 'Watermelons', 'Cantaloupe'];
    const herbsList = ['Basil', 'Cilantro', 'Parsley', 'Oregano', 'Thyme', 'Rosemary', 'Sage', 'Chives', 'Dill', 'Mint', 'Lavender', 'Tarragon'];
    const companionsList = ['Wildflowers', 'Marigolds', 'Nasturtiums', 'Sunflowers'];
    
    // Categorize selected plants
    selectedVegetables.forEach(plant => {
      if (vegetableList.includes(plant)) vegetables.push(plant);
      else if (greensList.includes(plant)) greens.push(plant);
      else if (fruitsList.includes(plant)) fruits.push(plant);
      else if (herbsList.includes(plant)) herbs.push(plant);
      else if (companionsList.includes(plant)) companions.push(plant);
    });

    // Create prompt for OpenAI
    const prompt = `Please design a vegetable garden layout with the following specifications:
    
    GARDEN SUMMARY:
    =================
    Raised Beds: ${totalBeds} total beds (${bedSummary.join(', ')})
    ${supportSummary.length > 0 ? `Support Structures: ${supportSummary.join(', ')}` : ''}
    
    Selected Plants by Category:
    ${[
      vegetables.length > 0 ? `• Vegetables (${vegetables.length}): ${vegetables.join(', ')}` : '',
      greens.length > 0 ? `• Greens (${greens.length}): ${greens.join(', ')}` : '',
      fruits.length > 0 ? `• Fruits (${fruits.length}): ${fruits.join(', ')}` : '',
      herbs.length > 0 ? `• Herbs (${herbs.length}): ${herbs.join(', ')}` : '',
      companions.length > 0 ? `• Companion Plants & Flowers (${companions.length}): ${companions.join(', ')}` : ''
    ].filter(line => line).join('\n    ')}
    
    Total Plants Selected: ${selectedVegetables.length}
    =================
    
    Please provide a detailed layout plan including:
    1. How to arrange the vegetables in each bed size
    2. Specific spacing recommendations for each bed size
    3. Companion planting suggestions
    4. How to best utilize the available trellises and tomato cages with appropriate plants
    5. Seasonal considerations
    6. A simple visual representation or layout description
    
    Format the response in a clear, organized manner that would be helpful for a gardener.
    
    Consider that:
    - 2x2 feet beds are best for herbs and small plants
    - 4x4 feet beds work well for medium plants and companion planting
    - 4x8 feet beds are ideal for larger plants like tomatoes and corn
    - Trellises are perfect for climbing plants like beans, peas, cucumbers, and some tomatoes
    - Tomato cages are specifically designed for supporting tomato plants and can also work for peppers and eggplants
    - Match climbing/vining plants to available support structures
    
    If there are too many plants selected for the given area, make sure to explain that and what you recommend removing. If there are climbing plants selected but no support structures, recommend adding trellises or suggest alternative growing methods`;

    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert gardener and landscape designer specializing in vegetable gardens. Provide practical, detailed advice for garden layouts with specific spacing and companion planting recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Safely extract the response
    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error('No response generated from OpenAI');
    }

    const choice = completion.choices[0];
    if (!choice || !choice.message || !choice.message.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    const layout = choice.message.content.trim();
    if (!layout) {
      throw new Error('Empty response from OpenAI');
    }

    res.json({ layout });

  } catch (error) {
    console.error('Error generating garden layout:', error);
    
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

    res.status(500).json({ 
      error: 'Failed to generate garden layout. Please try again.' 
    });
  }
}
