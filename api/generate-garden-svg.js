// Vercel serverless function for garden layout SVG generation using GPT-4
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
        error: 'OpenAI API key not configured. SVG generation requires an API key.' 
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create bed summary for prompt
    const bedSummary = [];
    if (beds2x2 > 0) bedSummary.push(`${beds2x2} bed(s) of 2x2 feet`);
    if (beds4x4 > 0) bedSummary.push(`${beds4x4} bed(s) of 4x4 feet`);
    if (beds4x8 > 0) bedSummary.push(`${beds4x8} bed(s) of 4x8 feet`);

    // Create support structure summary
    const supportSummary = [];
    if (trellises > 0) supportSummary.push(`${trellises} trellis${trellises > 1 ? 'es' : ''}`);
    if (tomatoCages > 0) supportSummary.push(`${tomatoCages} tomato cage${tomatoCages > 1 ? 's' : ''}`);

    // Categorize plants for better organization
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

    // Create detailed prompt for SVG generation
    let prompt = `Generate a clean, precise SVG garden layout diagram. Create ONLY valid SVG code.

GARDEN SPECIFICATIONS:
- ${totalBeds} raised beds total: ${bedSummary.join(', ')}
${supportSummary.length > 0 ? `- Support structures: ${supportSummary.join(', ')}` : ''}

PLANTS TO INCLUDE:
${selectedVeggies.length > 0 ? `• Vegetables: ${selectedVeggies.join(', ')}` : ''}
${selectedGreens.length > 0 ? `• Greens: ${selectedGreens.join(', ')}` : ''}
${selectedFruits.length > 0 ? `• Fruits: ${selectedFruits.join(', ')}` : ''}
${selectedHerbs.length > 0 ? `• Herbs: ${selectedHerbs.join(', ')}` : ''}
${selectedCompanions.length > 0 ? `• Companions: ${selectedCompanions.join(', ')}` : ''}

SVG REQUIREMENTS:
1. Use viewBox="0 0 800 600" for consistent sizing
2. Draw beds as rectangles with thick black borders (#000, stroke-width="2")
3. Scale beds proportionally (2x2=80x80px, 4x4=160x160px, 4x8=160x320px)
4. Place plants as small circles (r="8") INSIDE bed boundaries only
5. Use distinct colors: vegetables=#4CAF50, herbs=#9C27B0, fruits=#F44336, greens=#8BC34A, companions=#FF9800
6. Add plant labels as small text (font-size="10") positioned near each circle
7. Support structures: trellises as vertical rectangles (#8E8E8E), cages as triangular outlines
8. Create simple legend in bottom-right corner with color meanings
9. Ensure all elements stay within their designated bed areas
10. Use clean, readable fonts (Arial or sans-serif)`;

    // Add layout guidance if available
    if (layoutText && typeof layoutText === 'string') {
      const cleanLayoutText = layoutText.replace('VISUALIZATION_DATA:', '').trim();
      prompt += `\n\nPRECISE PLACEMENT INSTRUCTIONS: Use these exact coordinates and specifications:
${cleanLayoutText.substring(0, 500)}

Follow these placement details exactly - position each plant circle at the specified coordinates within each bed rectangle. Ensure no plant circles extend outside bed boundaries.`;
    }

    prompt += `\n\nSTRUCTURE: Return ONLY complete SVG code with:
- <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
- Bed rectangles with labels showing dimensions
- Plant circles positioned exactly inside bed boundaries
- Support structure shapes positioned correctly
- Simple legend showing color meanings
- Close with </svg>

Generate precise, clean SVG code only. No explanations or markdown.`;

    // Call GPT-4 for SVG generation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert SVG programmer. Generate precise, clean SVG code for garden layout diagrams. Always ensure plant elements are positioned within bed boundaries. Return only valid SVG markup."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent technical output
    });

    // Extract and validate SVG content
    if (!completion || !completion.choices || completion.choices.length === 0) {
      throw new Error('No SVG generated from GPT-4');
    }

    const choice = completion.choices[0];
    if (!choice || !choice.message || !choice.message.content) {
      throw new Error('Invalid response format from GPT-4');
    }

    let svgContent = choice.message.content.trim();
    
    // Clean up any markdown formatting that might be present
    svgContent = svgContent.replace(/```svg\n?/g, '').replace(/```\n?/g, '');
    
    // Validate that we have SVG content
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      throw new Error('Generated content is not valid SVG');
    }

    // Return the SVG content directly
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svgContent);

  } catch (error) {
    console.error('Error generating garden SVG:', error);
    
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
        error: 'SVG generation request was rejected. Please try with different inputs.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate garden SVG. Please try again.' 
    });
  }
}
