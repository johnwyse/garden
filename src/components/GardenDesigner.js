import React, { useState } from 'react';
import './GardenDesigner.css';
import { generateGardenLayout as callGardenAPI } from '../services/gardenService';

const GardenDesigner = () => {
  const [beds2x2, setBeds2x2] = useState(0);
  const [beds4x4, setBeds4x4] = useState(0);
  const [beds4x8, setBeds4x8] = useState(0);
  const [selectedVegetables, setSelectedVegetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gardenLayout, setGardenLayout] = useState('');
  const [error, setError] = useState('');

  // List of plants organized by category
  const vegetables = [
    'Tomatoes', 'Lettuce', 'Carrots', 'Peppers', 'Onions', 'Spinach',
    'Radishes', 'Beans', 'Peas', 'Cucumber', 'Zucchini', 'Broccoli',
    'Cauliflower', 'Kale', 'Swiss Chard', 'Beets', 'Corn', 'Squash',
    'Eggplant', 'Brussels Sprouts', 'Cabbage', 'Leeks'
  ];

  const fruits = [
    'Strawberries', 'Blueberries', 'Raspberries', 'Blackberries',
    'Rhubarb', 'Melons', 'Watermelons', 'Cantaloupe'
  ];

  const herbs = [
    'Basil', 'Cilantro', 'Parsley', 'Oregano', 'Thyme', 'Rosemary',
    'Sage', 'Chives', 'Dill', 'Mint', 'Lavender', 'Tarragon'
  ];

  const companions = [
    'Wildflowers', 'Marigolds', 'Nasturtiums', 'Sunflowers'
  ];

  const handleVegetableChange = (plant) => {
    setSelectedVegetables(prev => 
      prev.includes(plant)
        ? prev.filter(v => v !== plant)
        : [...prev, plant]
    );
  };

  const generateGardenLayout = async () => {
    const totalBeds = beds2x2 + beds4x4 + beds4x8;
    
    if (totalBeds === 0 || selectedVegetables.length === 0) {
      alert('Please select at least one bed and one plant.');
      return;
    }

    setLoading(true);
    setError('');
    setGardenLayout('');
    
    try {
      // Call the API with the new signature
      const layout = await callGardenAPI(beds2x2, beds4x4, beds4x8, selectedVegetables);
      setGardenLayout(layout);
    } catch (error) {
      console.error('Error generating garden layout:', error);
      setError(error.message || 'Failed to generate garden layout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="garden-designer">
      <h1>Garden Layout Designer</h1>
      
      <div className="input-section">
        <h3>Select Your Raised Beds</h3>
        
        <div className="beds-grid">
          <div className="input-group">
            <label htmlFor="beds2x2">2' x 2' beds:</label>
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
            <label htmlFor="beds4x4">4' x 4' beds:</label>
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
            <label htmlFor="beds4x8">4' x 8' beds:</label>
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
          <label>Select Plants for Your Garden:</label>
          
          <div className="plant-categories">
            <div className="plant-category">
              <h4>🥕 Vegetables</h4>
              <div className="plants-grid">
                {vegetables.map(vegetable => (
                  <label key={vegetable} className="plant-checkbox">
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

            <div className="plant-category">
              <h4>🍓 Fruits</h4>
              <div className="plants-grid">
                {fruits.map(fruit => (
                  <label key={fruit} className="plant-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedVegetables.includes(fruit)}
                      onChange={() => handleVegetableChange(fruit)}
                    />
                    {fruit}
                  </label>
                ))}
              </div>
            </div>

            <div className="plant-category">
              <h4>🌿 Herbs</h4>
              <div className="plants-grid">
                {herbs.map(herb => (
                  <label key={herb} className="plant-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedVegetables.includes(herb)}
                      onChange={() => handleVegetableChange(herb)}
                    />
                    {herb}
                  </label>
                ))}
              </div>
            </div>

            <div className="plant-category companions-section">
              <h4>🌸 Companion Plants & Flowers</h4>
              <p className="category-description">Optional additions for pest control and pollinator attraction</p>
              <div className="plants-grid">
                {companions.map(companion => (
                  <label key={companion} className="plant-checkbox companion-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedVegetables.includes(companion)}
                      onChange={() => handleVegetableChange(companion)}
                    />
                    {companion}
                  </label>
                ))}
              </div>
            </div>
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
