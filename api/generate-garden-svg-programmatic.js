// Vercel serverless function for programmatic garden layout SVG generation
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

    // Plant categories and colors
    const plantCategories = {
      vegetables: { plants: ['Tomatoes', 'Carrots', 'Peppers', 'Onions', 'Radishes', 'Beans', 'Peas', 'Cucumber', 'Zucchini', 'Broccoli', 'Cauliflower', 'Beets', 'Corn', 'Squash', 'Eggplant', 'Brussels Sprouts', 'Cabbage', 'Leeks'], color: '#4CAF50' },
      greens: { plants: ['Lettuce', 'Spinach', 'Kale', 'Swiss Chard', 'Arugula', 'Bok Choy', 'Collard Greens', 'Mustard Greens', 'Watercress', 'Endive'], color: '#8BC34A' },
      fruits: { plants: ['Strawberries', 'Blueberries', 'Raspberries', 'Blackberries', 'Rhubarb', 'Melons', 'Watermelons', 'Cantaloupe'], color: '#F44336' },
      herbs: { plants: ['Basil', 'Cilantro', 'Parsley', 'Oregano', 'Thyme', 'Rosemary', 'Sage', 'Chives', 'Dill', 'Mint', 'Lavender', 'Tarragon'], color: '#9C27B0' },
      companions: { plants: ['Wildflowers', 'Marigolds', 'Nasturtiums', 'Sunflowers'], color: '#FF9800' }
    };

    // Categorize selected plants
    const categorizedPlants = {};
    selectedVegetables.forEach(plant => {
      for (const [category, data] of Object.entries(plantCategories)) {
        if (data.plants.includes(plant)) {
          if (!categorizedPlants[category]) categorizedPlants[category] = [];
          categorizedPlants[category].push(plant);
          break;
        }
      }
    });

    // SVG dimensions
    const svgWidth = 1000;
    const svgHeight = 700;
    const bedAreaWidth = 650;
    const legendAreaX = 700;

    // Start building SVG
    let svg = `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#f8fdf8" stroke="none"/>`;
    
    // Title
    svg += `<text x="500" y="30" font-family="Arial" font-size="20" font-weight="bold" text-anchor="middle" fill="#2d5a3d">Garden Layout Plan</text>`;

    // Create beds
    let currentY = 70;
    let bedNumber = 1;
    const bedSpacing = 40;

    // Helper function to create a bed
    const createBed = (x, y, width, height, bedSize, bedNum) => {
      const bedSvg = `
        <!-- Bed ${bedNum} -->
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="white" stroke="#2d5a3d" stroke-width="3"/>
        <text x="${x + width/2}" y="${y - 10}" font-family="Arial" font-size="14" 
              font-weight="bold" text-anchor="middle" fill="#2d5a3d">${bedSize} Bed #${bedNum}</text>
      `;
      return bedSvg;
    };

    // Helper function to add plants to a bed
    const addPlantsTobed = (bedX, bedY, bedWidth, bedHeight, plants, maxPlantsPerBed = 8) => {
      let plantSvg = '';
      const plantsToShow = plants.slice(0, maxPlantsPerBed);
      const plantsPerRow = Math.ceil(Math.sqrt(plantsToShow.length));
      const padding = 20;
      const availableWidth = bedWidth - (padding * 2);
      const availableHeight = bedHeight - (padding * 2);
      
      plantsToShow.forEach((plant, index) => {
        const row = Math.floor(index / plantsPerRow);
        const col = index % plantsPerRow;
        const totalRows = Math.ceil(plantsToShow.length / plantsPerRow);
        
        const plantX = bedX + padding + (col * availableWidth / plantsPerRow) + (availableWidth / plantsPerRow / 2);
        const plantY = bedY + padding + (row * availableHeight / totalRows) + (availableHeight / totalRows / 2);
        
        // Get plant color
        let plantColor = '#4CAF50'; // default
        for (const [category, data] of Object.entries(plantCategories)) {
          if (data.plants.includes(plant)) {
            plantColor = data.color;
            break;
          }
        }
        
        plantSvg += `
          <circle cx="${plantX}" cy="${plantY}" r="10" fill="${plantColor}" stroke="#2d5a3d" stroke-width="1"/>
          <text x="${plantX}" y="${plantY + 25}" font-family="Arial" font-size="10" 
                text-anchor="middle" fill="#2d5a3d">${plant}</text>
        `;
      });
      
      return plantSvg;
    };

    // Parse layout text to extract bed assignments if available
    const parseBedAssignments = (layoutText) => {
      if (!layoutText) return null;
      
      console.log('Parsing layout text:', layoutText.substring(0, 500)); // Debug log
      
      const bedAssignments = [];
      
      // Look for VISUALIZATION_DATA section first
      const vizDataMatch = layoutText.match(/VISUALIZATION_DATA:\s*([\s\S]*?)(?:\n\n|$)/i);
      const textToParse = vizDataMatch ? vizDataMatch[1] : layoutText;
      
      console.log('Text to parse for beds:', textToParse); // Debug log
      
      // Simple pattern: BED 1 (4x4): Plant1, Plant2, Plant3
      const bedRegex = /BED\s+(\d+)\s*\(([^)]+)\):\s*([^.\n\r]+)/gi;
      let match;
      
      while ((match = bedRegex.exec(textToParse)) !== null) {
        const bedNumber = parseInt(match[1]);
        const bedSize = match[2].trim();
        const plantsText = match[3].trim();
        
        console.log(`Found bed ${bedNumber} (${bedSize}): ${plantsText}`); // Debug log
        
        // Split plants by comma and clean up
        const plantNames = plantsText.split(',').map(p => p.trim());
        const plants = [];
        
        for (const plantName of plantNames) {
          // Find exact match in selected vegetables
          const matchedPlant = selectedVegetables.find(v => 
            v.toLowerCase() === plantName.toLowerCase() ||
            plantName.toLowerCase().includes(v.toLowerCase()) ||
            v.toLowerCase().includes(plantName.toLowerCase())
          );
          
          if (matchedPlant) {
            plants.push(matchedPlant);
            console.log(`Matched "${plantName}" to "${matchedPlant}"`); // Debug log
          } else {
            console.log(`Could not match "${plantName}" to any selected plant`); // Debug log
          }
        }
        
        if (plants.length > 0) {
          bedAssignments.push({
            bedNumber,
            bedSize: bedSize.toLowerCase(),
            plants
          });
        }
      }
      
      console.log('Final bed assignments:', bedAssignments); // Debug log
      return bedAssignments.length > 0 ? bedAssignments : null;
    };

    // Parse layout assignments from GPT response
    const bedAssignments = parseBedAssignments(layoutText);
    
    // Generate beds and distribute plants intelligently
    bedNumber = 1; // Reset bed counter
    let unassignedPlants = [...selectedVegetables]; // Fallback for plants not assigned by GPT

    // Helper function to get plants for a specific bed
    const getPlantsForBed = (bedNum, fallbackCount) => {
      if (bedAssignments) {
        // Find assignment for this bed number
        const assignment = bedAssignments.find(a => a.bedNumber === bedNum);
        if (assignment && assignment.plants.length > 0) {
          // Remove assigned plants from unassigned list
          assignment.plants.forEach(plant => {
            const index = unassignedPlants.indexOf(plant);
            if (index > -1) unassignedPlants.splice(index, 1);
          });
          return assignment.plants;
        }
      }
      
      // Fallback: take plants from unassigned list
      const plants = unassignedPlants.slice(0, fallbackCount);
      unassignedPlants = unassignedPlants.slice(fallbackCount);
      return plants;
    };

    // Add 2x2 beds
    for (let i = 0; i < beds2x2; i++) {
      const bedWidth = 120;
      const bedHeight = 120;
      const bedX = 50 + (i % 3) * (bedWidth + 30);
      const bedY = currentY + Math.floor(i / 3) * (bedHeight + bedSpacing);
      
      svg += createBed(bedX, bedY, bedWidth, bedHeight, "2' x 2'", bedNumber);
      
      // Get plants for this specific bed (smart assignment or fallback)
      const plantsForBed = getPlantsForBed(bedNumber, 4);
      svg += addPlantsTobed(bedX, bedY, bedWidth, bedHeight, plantsForBed);
      bedNumber++;
    }

    // Update currentY for next bed size
    if (beds2x2 > 0) {
      currentY += Math.ceil(beds2x2 / 3) * (120 + bedSpacing) + 20;
    }

    // Add 4x4 beds
    for (let i = 0; i < beds4x4; i++) {
      const bedWidth = 160;
      const bedHeight = 160;
      const bedX = 50 + (i % 2) * (bedWidth + 30);
      const bedY = currentY + Math.floor(i / 2) * (bedHeight + bedSpacing);
      
      svg += createBed(bedX, bedY, bedWidth, bedHeight, "4' x 4'", bedNumber);
      
      // Get plants for this specific bed (smart assignment or fallback)
      const plantsForBed = getPlantsForBed(bedNumber, 6);
      svg += addPlantsTobed(bedX, bedY, bedWidth, bedHeight, plantsForBed);
      bedNumber++;
    }

    // Update currentY for next bed size
    if (beds4x4 > 0) {
      currentY += Math.ceil(beds4x4 / 2) * (160 + bedSpacing) + 20;
    }

    // Add 4x8 beds
    for (let i = 0; i < beds4x8; i++) {
      const bedWidth = 200;
      const bedHeight = 320;
      const bedX = 50 + (i % 2) * (bedWidth + 30);
      const bedY = currentY + i * (bedHeight + bedSpacing);
      
      svg += createBed(bedX, bedY, bedWidth, bedHeight, "4' x 8'", bedNumber);
      
      // Get plants for this specific bed (smart assignment or fallback)
      const plantsForBed = getPlantsForBed(bedNumber, 8);
      svg += addPlantsTobed(bedX, bedY, bedWidth, bedHeight, plantsForBed);
      bedNumber++;
    }

    // Create Legend
    svg += `<text x="${legendAreaX}" y="80" font-family="Arial" font-size="16" font-weight="bold" fill="#2d5a3d">Plant Guide</text>`;
    
    let legendY = 100;
    selectedVegetables.forEach((plant, index) => {
      // Get plant color
      let plantColor = '#4CAF50'; // default
      for (const [category, data] of Object.entries(plantCategories)) {
        if (data.plants.includes(plant)) {
          plantColor = data.color;
          break;
        }
      }
      
      svg += `
        <circle cx="${legendAreaX + 15}" cy="${legendY}" r="8" fill="${plantColor}" stroke="#2d5a3d" stroke-width="1"/>
        <text x="${legendAreaX + 35}" y="${legendY + 4}" font-family="Arial" font-size="12" fill="#2d5a3d">${plant}</text>
      `;
      legendY += 25;
    });

    // Add support structure info if present
    if (trellises > 0 || tomatoCages > 0) {
      legendY += 20;
      svg += `<text x="${legendAreaX}" y="${legendY}" font-family="Arial" font-size="14" font-weight="bold" fill="#2d5a3d">Support Structures</text>`;
      legendY += 20;
      
      if (trellises > 0) {
        svg += `<text x="${legendAreaX}" y="${legendY}" font-family="Arial" font-size="12" fill="#2d5a3d">${trellises} Trellis${trellises > 1 ? 'es' : ''}</text>`;
        legendY += 20;
      }
      if (tomatoCages > 0) {
        svg += `<text x="${legendAreaX}" y="${legendY}" font-family="Arial" font-size="12" fill="#2d5a3d">${tomatoCages} Tomato Cage${tomatoCages > 1 ? 's' : ''}</text>`;
      }
    }

    // Close SVG
    svg += '</svg>';

    // Return the SVG content directly
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);

  } catch (error) {
    console.error('Error generating programmatic SVG:', error);
    res.status(500).json({ 
      error: 'Failed to generate garden SVG. Please try again.' 
    });
  }
}
