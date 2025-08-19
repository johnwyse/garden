// gardenService.js
// This service handles API calls to the backend for garden layout generation

export const generateGardenLayout = async (beds2x2, beds4x4, beds4x8, trellises, tomatoCages, selectedVegetables) => {
  try {
    // Determine API endpoint based on environment
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/generate-garden-layout'  // Vercel API route in production
      : 'http://localhost:3001/api/generate-garden-layout'; // Local backend in development

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beds2x2,
        beds4x4,
        beds4x8,
        trellises,
        tomatoCages,
        selectedVegetables
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate garden layout');
    }

    const data = await response.json();
    return data.layout;

  } catch (error) {
    console.error('Error calling garden API:', error);
    
    // Fallback to simulated response if API fails
    const totalBeds = (beds2x2 || 0) + (beds4x4 || 0) + (beds4x8 || 0);
    const bedSummary = [];
    if (beds2x2 > 0) bedSummary.push(`${beds2x2} bed(s) 2x2 feet`);
    if (beds4x4 > 0) bedSummary.push(`${beds4x4} bed(s) 4x4 feet`);
    if (beds4x8 > 0) bedSummary.push(`${beds4x8} bed(s) 4x8 feet`);
    
    const supportSummary = [];
    if (trellises > 0) supportSummary.push(`${trellises} trellis(es)`);
    if (tomatoCages > 0) supportSummary.push(`${tomatoCages} tomato cage(s)`);

    return `Garden Layout Plan (Fallback):

Bed Configuration: ${totalBeds} total bed(s)
- ${bedSummary.join('\n- ')}

${supportSummary.length > 0 ? `Plant Support: ${supportSummary.join(', ')}\n\n` : ''}Vegetable Selection: ${selectedVegetables.join(', ')}

Layout Recommendations:
- Place taller plants (like tomatoes) on the north side to avoid shading shorter plants
- Group companion plants together (e.g., tomatoes with basil, carrots with onions)
- Leave adequate spacing between plants for proper growth
- Consider succession planting for continuous harvests

NOTE: API connection failed. This is a fallback response. Error: ${error.message}`;
  }
};

// Function to generate garden layout image using DALL-E
export const generateGardenImage = async (beds2x2, beds4x4, beds4x8, trellises, tomatoCages, selectedVegetables, layoutText = null) => {
  try {
    // Determine API endpoint based on environment
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/generate-garden-image'  // Vercel API route in production
      : 'http://localhost:3001/api/generate-garden-image'; // Local backend in development

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beds2x2,
        beds4x4,
        beds4x8,
        trellises,
        tomatoCages,
        selectedVegetables,
        layoutText // Pass the generated layout for context
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate garden image');
    }

    const data = await response.json();
    return data.imageUrl;

  } catch (error) {
    console.error('Error calling garden image API:', error);
    
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return null if image generation fails - we'll handle this gracefully in the UI
    return null;
  }
};

// Function to generate garden layout SVG using GPT-4
export const generateGardenSVG = async (beds2x2, beds4x4, beds4x8, trellises, tomatoCages, selectedVegetables, layoutText = null) => {
  try {
    // Determine API endpoint based on environment - use programmatic SVG generation
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? '/api/generate-garden-svg-programmatic'  // Vercel API route in production
      : 'http://localhost:3001/api/generate-garden-svg-programmatic'; // Local backend in development

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        beds2x2,
        beds4x4,
        beds4x8,
        trellises,
        tomatoCages,
        selectedVegetables,
        layoutText
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate garden SVG: ${errorText}`);
    }

    // Get the SVG content directly
    const svgContent = await response.text();
    
    // Create a data URL for the SVG
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    
    return svgDataUrl;

  } catch (error) {
    console.error('Error calling garden SVG API:', error);
    
    // Add a small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return null if SVG generation fails - we'll handle this gracefully in the UI
    return null;
  }
};
