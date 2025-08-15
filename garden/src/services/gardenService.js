// gardenService.js
// This service handles API calls to OpenAI for garden layout generation

let OpenAI;
let openai;

// Try to import OpenAI, but handle gracefully if it fails
try {
  OpenAI = require('openai').default || require('openai');
  // Initialize OpenAI client only if we have an API key
  if (process.env.REACT_APP_OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Only for development - use backend in production
    });
  }
} catch (error) {
  console.warn('OpenAI package not available or failed to load:', error.message);
}

export const generateGardenLayout = async (numBeds, bedSize, vegetables) => {
  // Check if OpenAI is available and configured
  if (!openai || !process.env.REACT_APP_OPENAI_API_KEY) {
    // Return a simulated response when OpenAI isn't available
    return `Garden Layout Plan (Simulated):

Bed Configuration: ${numBeds} raised bed(s), each ${bedSize}

Vegetable Arrangement:
${vegetables.map((veg, index) => `${index + 1}. ${veg}`).join('\n')}

Layout Recommendations:
- Place taller plants (like tomatoes) on the north side to avoid shading shorter plants
- Group companion plants together (e.g., tomatoes with basil, carrots with onions)
- Leave adequate spacing between plants for proper growth
- Consider succession planting for continuous harvests

NOTE: This is a simulated response. To get AI-generated recommendations, add your OpenAI API key to the environment variables (REACT_APP_OPENAI_API_KEY).`;
  }

  try {
    const prompt = `Please design a vegetable garden layout with the following specifications:
    - Number of raised beds: ${numBeds}
    - Size of each bed: ${bedSize}
    - Vegetables to include: ${vegetables.join(', ')}
    
    Please provide a detailed layout plan including:
    1. How to arrange the vegetables in each bed
    2. Spacing recommendations
    3. Companion planting suggestions
    4. Any seasonal considerations
    5. A visual representation using ASCII art or simple text layout
    
    Format the response in a clear, organized manner that would be helpful for a gardener.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert gardener and landscape designer specializing in vegetable gardens. Provide practical, detailed advice for garden layouts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate garden layout. Please check your API key and try again.');
  }
};

// Alternative function for GitHub Copilot API (if available)
export const generateGardenLayoutWithCopilot = async (numBeds, bedSize, vegetables) => {
  // This would be implemented based on GitHub Copilot's API when available
  // For now, this is a placeholder
  throw new Error('GitHub Copilot API integration not yet implemented');
};
