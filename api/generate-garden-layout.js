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
    const { beds2x2, beds4x4, beds4x8, selectedVegetables } = req.body;

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

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      // Return a simple placeholder response
      const placeholderResponse = `Garden Layout Generator

        Your Selection:
        - Beds: ${bedSummary.join(', ')}
        - Vegetables: ${selectedVegetables.join(', ')}

        To get personalized garden layouts, add your OPENAI_API_KEY environment variable in your Vercel deployment settings.`;

      return res.json({ layout: placeholderResponse });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create prompt for OpenAI
    const prompt = `Please design a vegetable garden layout with the following specifications:
    - Total beds: ${totalBeds}
    - Bed configuration: ${bedSummary.join(', ')}
    - Vegetables to include: ${selectedVegetables.join(', ')}
    
    Please provide a detailed layout plan including:
    1. How to arrange the vegetables in each bed size
    2. Specific spacing recommendations for each bed size
    3. Companion planting suggestions
    4. Seasonal considerations
    5. A simple visual representation or layout description
    
    Format the response in a clear, organized manner that would be helpful for a gardener.
    
    Consider that:
    - 2x2 feet beds are best for herbs and small plants
    - 4x4 feet beds work well for medium plants and companion planting
    - 4x8 feet beds are ideal for larger plants like tomatoes and corn`;

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
