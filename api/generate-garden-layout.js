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
    const { beds2x2, beds4x4, beds4x8, trellises, selectedVegetables } = req.body;

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
    
    IMPORTANT: At the beginning of your response, include a section called "BED LAYOUT PLAN SUMMARY" followed by a structured breakdown:
    
    Format each bed as:
    "🏡 BED X (dimensions) - Total sq ft
    ├── 🌱 Plant Name (quantity) - Spacing details
    ├── 🌱 Plant Name (quantity) - Spacing details  
    └── Support: Trellis/none"
    
    Example:
    "🏡 BED 1 (4x4 feet) - 16 sq ft
    ├── 🍅 Tomatoes (2) - Center, 18" apart, need support
    ├── 🌿 Basil (4) - Corners, 8" spacing
    └── Support: 1 trellis for tomatoes"

    Then, include a section called "LAYOUT RECOMMENDATIONS:" with detailed planting advice. Provide a detailed layout plan including:
    1. Specific bed-by-bed plant assignments with exact counts that matches the summary above.
    2. Spacing recommendations with measurements for each plant
    3. Companion planting suggestions and reasoning
    4. Support structure assignments (which plants need trellises)`;
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Fallback to known working model
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
      max_tokens: 1500,
      temperature: 0.5,
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

    // During development, log the BED LAYOUT PLAN section
    const bedLayoutMatch = layout.match(/BED LAYOUT PLAN SUMMARY\s*([\s\S]*?)(?:\n\n|$)/i);
    if (bedLayoutMatch) {
      console.log('=== BED LAYOUT PLAN SECTION ===');
      console.log(bedLayoutMatch[1].trim());
      console.log('=== END BED LAYOUT PLAN ===');
    } else {
      console.log('No BED LAYOUT PLAN section found in response');
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
