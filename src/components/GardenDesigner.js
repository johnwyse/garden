import React, { useState } from 'react';
import './GardenDesigner.css';
import { generateGardenLayout as callGardenAPI} from '../services/gardenService';

// Simple markdown to HTML conversion
const markdownToHtml = (text) => {
  if (!text) return '';
  
  return text
    // Convert headers
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')  
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Convert bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert bullet points
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    // Wrap consecutive list items in ul tags
    .replace(/(<li>.*<\/li>\s*)+/gs, '<ul>$&</ul>')
    // Convert line breaks to paragraphs
    .replace(/\n\s*\n/g, '</p><p>')
    // Wrap in initial paragraph tags
    .replace(/^(.+)/s, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '');
};

const GardenDesigner = () => {
  const [beds2x2, setBeds2x2] = useState(0);
  const [beds4x4, setBeds4x4] = useState(0);
  const [beds4x8, setBeds4x8] = useState(0);
  const [trellises, setTrellises] = useState(0);
  const [selectedVegetables, setSelectedVegetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gardenLayout, setGardenLayout] = useState('');
  const [tableHtml, setTableHtml] = useState('');
  const [showTableView, setShowTableView] = useState(false);
  // const [gardenImage, setGardenImage] = useState('');
  const [error, setError] = useState('');

  // List of plants organized by category
  const vegetables = [
    'Tomatoes', 'Carrots', 'Peppers', 'Onions', 'Radishes', 'Beans', 
    'Peas', 'Cucumber', 'Zucchini', 'Broccoli', 'Cauliflower', 'Beets', 
    'Corn', 'Squash', 'Eggplant', 'Brussels Sprouts', 'Cabbage', 'Leeks'
  ];

  const greens = [
    'Lettuce', 'Spinach', 'Kale', 'Swiss Chard', 'Arugula', 'Bok Choy',
    'Collard Greens', 'Mustard Greens', 'Watercress', 'Endive'
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
    setTableHtml('');
    setShowTableView(false);
    // setGardenImage('');
    
    try {
      // Generate the garden layout text with structured bed plan
      const result = await callGardenAPI(beds2x2, beds4x4, beds4x8, trellises, selectedVegetables);
      
      // Handle both old and new response formats
      if (typeof result === 'object' && result.layout) {
        setGardenLayout(result.layout);
        if (result.tableHtml) {
          setTableHtml(result.tableHtml);
        }
      } else {
        // Fallback for old string response format
        setGardenLayout(result);
      }

      // No more SVG generation - the structured text layout is much better!

    } catch (error) {
      console.error('Error generating garden content:', error);
      setError(error.message || 'Failed to generate garden layout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to categorize selected plants for summary
  const categorizeSelectedPlants = () => {
    const selectedVeggies = selectedVegetables.filter(plant => vegetables.includes(plant));
    const selectedGreens = selectedVegetables.filter(plant => greens.includes(plant));
    const selectedFruits = selectedVegetables.filter(plant => fruits.includes(plant));
    const selectedHerbs = selectedVegetables.filter(plant => herbs.includes(plant));
    const selectedCompanions = selectedVegetables.filter(plant => companions.includes(plant));
    
    return { selectedVeggies, selectedGreens, selectedFruits, selectedHerbs, selectedCompanions };
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

          <div className="input-group">
            <label htmlFor="trellises">Trellises:</label>
            <select 
              id="trellises"
              value={trellises} 
              onChange={(e) => setTrellises(parseInt(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

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
              <h4>🥬 Greens</h4>
              <div className="plants-grid">
                {greens.map(green => (
                  <label key={green} className="plant-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedVegetables.includes(green)}
                      onChange={() => handleVegetableChange(green)}
                    />
                    {green}
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

      {(loading || gardenLayout) && (
        <div className={`summary-section ${loading ? 'loading' : ''}`}>
          <h2>{loading ? 'Generating Your Garden Layout & Blueprint...' : 'Your Garden Summary'}</h2>
          <div className="selection-summary">
            <div className="summary-category">
              <h4>🏡 Garden Infrastructure</h4>
              <div className="summary-items">
                {beds2x2 > 0 && <p>{beds2x2} × 2x2 feet bed{beds2x2 > 1 ? 's' : ''}</p>}
                {beds4x4 > 0 && <p>{beds4x4} × 4x4 feet bed{beds4x4 > 1 ? 's' : ''}</p>}
                {beds4x8 > 0 && <p>{beds4x8} × 4x8 feet bed{beds4x8 > 1 ? 's' : ''}</p>}
                {trellises > 0 && <p>{trellises} × Trellis{trellises > 1 ? 'es' : ''}</p>}
                <p className="total-beds">Total: {beds2x2 + beds4x4 + beds4x8} bed{beds2x2 + beds4x4 + beds4x8 > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="summary-category">
              <h4>🌱 Selected Plants ({selectedVegetables.length} total)</h4>
              <div className="summary-plants">
                {(() => {
                  const { selectedVeggies, selectedGreens, selectedFruits, selectedHerbs, selectedCompanions } = categorizeSelectedPlants();
                  return (
                    <>
                      {selectedVeggies.length > 0 && (
                        <div className="plant-group">
                          <strong>🥕 Vegetables ({selectedVeggies.length}):</strong>
                          <span>{selectedVeggies.join(', ')}</span>
                        </div>
                      )}
                      {selectedGreens.length > 0 && (
                        <div className="plant-group">
                          <strong>🥬 Greens ({selectedGreens.length}):</strong>
                          <span>{selectedGreens.join(', ')}</span>
                        </div>
                      )}
                      {selectedFruits.length > 0 && (
                        <div className="plant-group">
                          <strong>🍓 Fruits ({selectedFruits.length}):</strong>
                          <span>{selectedFruits.join(', ')}</span>
                        </div>
                      )}
                      {selectedHerbs.length > 0 && (
                        <div className="plant-group">
                          <strong>🌿 Herbs ({selectedHerbs.length}):</strong>
                          <span>{selectedHerbs.join(', ')}</span>
                        </div>
                      )}
                      {selectedCompanions.length > 0 && (
                        <div className="plant-group">
                          <strong>🌸 Companions ({selectedCompanions.length}):</strong>
                          <span>{selectedCompanions.join(', ')}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {gardenLayout && !loading && (
        <div className="results-section">
          <h2>Your Garden Layout Plan</h2>
          
          {/* View Toggle Buttons - only show if table is available */}
          {tableHtml && (
            <div className="view-toggle">
              <button 
                className={`toggle-btn ${!showTableView ? 'active' : ''}`}
                onClick={() => setShowTableView(false)}
              >
                📝 Text View
              </button>
              <button 
                className={`toggle-btn ${showTableView ? 'active' : ''}`}
                onClick={() => setShowTableView(true)}
              >
                📊 Table View
              </button>
            </div>
          )}
          
          {!showTableView ? (
            <div className="layout-text-container">
              <h3>Detailed Plant Layout & Recommendations</h3>
              <div 
                className="layout-output"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(gardenLayout) }}
              />
            </div>
          ) : (
            <div className="layout-table-container">
              <h3>Garden Layout Table</h3>
              <div 
                className="table-output"
                dangerouslySetInnerHTML={{ __html: tableHtml }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GardenDesigner;
