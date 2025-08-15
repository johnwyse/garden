import React, { useState } from 'react';
import './GardenDesigner.css';
// Temporarily comment out the service import to avoid potential issues
// import { generateGardenLayout as callGardenAPI } from '../services/gardenService';

const GardenDesigner = () => {
  const [beds2x2, setBeds2x2] = useState(0);
  const [beds4x4, setBeds4x4] = useState(0);
  const [beds4x8, setBeds4x8] = useState(0);
  const [selectedVegetables, setSelectedVegetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gardenLayout, setGardenLayout] = useState('');
  const [error, setError] = useState('');

  // List of common vegetables
  const vegetables = [
    'Tomatoes', 'Lettuce', 'Carrots', 'Peppers', 'Onions', 'Spinach',
    'Radishes', 'Beans', 'Peas', 'Cucumber', 'Zucchini', 'Broccoli',
    'Cauliflower', 'Kale', 'Swiss Chard', 'Beets', 'Corn', 'Squash',
    'Herbs (Basil, Cilantro, Parsley)', 'Eggplant'
  ];

  const handleVegetableChange = (vegetable) => {
    setSelectedVegetables(prev => 
      prev.includes(vegetable)
        ? prev.filter(v => v !== vegetable)
        : [...prev, vegetable]
    );
  };

  const generateGardenLayout = async () => {
    const totalBeds = beds2x2 + beds4x4 + beds4x8;
    
    if (totalBeds === 0 || selectedVegetables.length === 0) {
      alert('Please select at least one bed and one vegetable.');
      return;
    }

    setLoading(true);
    setError('');
    setGardenLayout('');
    
    try {
      // Create bed summary for the layout
      const bedSummary = [];
      if (beds2x2 > 0) bedSummary.push(`${beds2x2} bed(s) 2x2 feet`);
      if (beds4x4 > 0) bedSummary.push(`${beds4x4} bed(s) 4x4 feet`);
      if (beds4x8 > 0) bedSummary.push(`${beds4x8} bed(s) 4x8 feet`);
      
      // Temporary simulation - replace with actual API call later
      const simulatedLayout = `Garden Layout Plan:

Bed Configuration: ${totalBeds} total bed(s)
- ${bedSummary.join('\n- ')}

Vegetable Arrangement:
${selectedVegetables.map((veg, index) => `${index + 1}. ${veg}`).join('\n')}

Layout Recommendations by Bed Size:

2x2 feet beds (${beds2x2} beds):
${beds2x2 > 0 ? '- Perfect for herbs, lettuce, radishes, or small plants\n- Plant 1-4 plants depending on size\n- Great for succession planting' : '- None selected'}

4x4 feet beds (${beds4x4} beds):
${beds4x4 > 0 ? '- Ideal for medium plants like peppers, bush beans, or compact tomatoes\n- Can fit 4-9 plants in a square foot grid\n- Good for companion planting combinations' : '- None selected'}

4x8 feet beds (${beds4x8} beds):
${beds4x8 > 0 ? '- Best for larger plants like tomatoes, corn, or sprawling vegetables\n- Place tall plants (tomatoes) on north side\n- Can accommodate 8-16 plants depending on type' : '- None selected'}

General Tips:
- Group companion plants together (e.g., tomatoes with basil, carrots with onions)
- Leave adequate spacing between plants for proper growth
- Consider succession planting for continuous harvests

NOTE: This is a simulated response. The OpenAI integration will be added once the basic app is working.`;

      // Simulate API delay
      setTimeout(() => {
        setGardenLayout(simulatedLayout);
        setLoading(false);
      }, 2000);

      return;

      // TODO: Uncomment when ready to use API
      // Call the actual API
      // const layout = await callGardenAPI(numBeds, bedSize, selectedVegetables);
      // setGardenLayout(layout);
    } catch (error) {
      console.error('Error generating garden layout:', error);
      setError(error.message || 'Failed to generate garden layout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="garden-designer">
      <h1>AI Garden Layout Designer</h1>
      
      <div className="input-section">
        <h3>Select Your Raised Beds</h3>
        
        <div className="beds-grid">
          <div className="input-group">
            <label htmlFor="beds2x2">2x2 feet beds:</label>
            <select 
              id="beds2x2"
              value={beds2x2} 
              onChange={(e) => setBeds2x2(parseInt(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="beds4x4">4x4 feet beds:</label>
            <select 
              id="beds4x4"
              value={beds4x4} 
              onChange={(e) => setBeds4x4(parseInt(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="beds4x8">4x8 feet beds:</label>
            <select 
              id="beds4x8"
              value={beds4x8} 
              onChange={(e) => setBeds4x8(parseInt(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        {(beds2x2 > 0 || beds4x4 > 0 || beds4x8 > 0) && (
          <div className="beds-summary">
            <h4>Your Garden Summary:</h4>
            <p>Total beds: {beds2x2 + beds4x4 + beds4x8}</p>
            <ul>
              {beds2x2 > 0 && <li>{beds2x2} × 2x2 feet beds</li>}
              {beds4x4 > 0 && <li>{beds4x4} × 4x4 feet beds</li>}
              {beds4x8 > 0 && <li>{beds4x8} × 4x8 feet beds</li>}
            </ul>
          </div>
        )}

        <div className="input-group">
          <label>Select Vegetables:</label>
          <div className="vegetables-grid">
            {vegetables.map(vegetable => (
              <label key={vegetable} className="vegetable-checkbox">
                <input
                  type="checkbox"
                  checked={selectedVegetables.includes(vegetable)}
                  onChange={() => handleVegetableChange(vegetable)}
                />
                {vegetable}
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={generateGardenLayout}
          disabled={loading}
          className="generate-button"
        >
          {loading ? 'Designing Your Garden...' : 'Generate Garden Layout'}
        </button>
      </div>

      {error && (
        <div className="error-section">
          <p className="error-message">{error}</p>
        </div>
      )}

      {gardenLayout && (
        <div className="results-section">
          <h2>Your Garden Layout</h2>
          <pre className="layout-output">{gardenLayout}</pre>
        </div>
      )}
    </div>
  );
};

export default GardenDesigner;
