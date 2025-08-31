// NightscoutAI Configuration
const CONFIG = {
  // Nightscout API Configuration
  nightscout: {
    url: 'https://rubensnightscout.herokuapp.com',
    apiPath: '/api/v1/entries.json',
    updateInterval: 5 * 60 * 1000 // 5 minutes
  },
  
  // Model Configuration
  model: {
    sequenceLength: 10,
    features: 3, // [bg, insulin, carbs]
    lstmUnits: 64, // Increased from 16 for better accuracy
    layers: [
      { type: 'lstm', units: 64, returnSequences: true },
      { type: 'dropout', rate: 0.2 },
      { type: 'lstm', units: 32 },
      { type: 'dropout', rate: 0.2 },
      { type: 'dense', units: 16, activation: 'relu' },
      { type: 'dense', units: 1 }
    ],
    optimizer: 'adam',
    loss: 'meanSquaredError',
    learningRate: 0.001
  },
  
  // Data Configuration
  data: {
    bgMin: 40,
    bgMax: 400,
    validationSplit: 0.2,
    batchSize: 32
  },
  
  // Training Configuration
  training: {
    epochs: 100,
    patience: 10, // Early stopping patience
    minDelta: 0.001 // Early stopping min delta
  },
  
  // UI Configuration
  ui: {
    chartMaxPoints: 100,
    refreshInterval: 1000
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}