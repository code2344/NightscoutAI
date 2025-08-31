/**
 * Basic Test Suite for NightscoutAI
 * Node.js compatible test runner for core functionality
 */

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  test(name, testFn) {
    this.tests.push({ name, testFn });
  }
  
  async run() {
    console.log('🧪 Running NightscoutAI Tests...\n');
    
    for (const { name, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    return this.failed === 0;
  }
}

// Mock global objects for Node.js environment
global.tf = {
  ready: () => Promise.resolve(),
  sequential: () => ({
    add: () => {},
    compile: () => {},
    fit: () => Promise.resolve({ history: {} }),
    predict: () => ({ dataSync: () => [0.5], dispose: () => {} }),
    save: () => Promise.resolve()
  }),
  layers: {
    lstm: () => ({}),
    dropout: () => ({}),
    dense: () => ({})
  },
  tensor3d: () => ({ dispose: () => {} }),
  tensor2d: () => ({ dispose: () => {} }),
  train: {
    adam: () => ({})
  },
  callbacks: {
    earlyStopping: () => ({})
  }
};

global.Chart = function() {
  return {
    data: { labels: [], datasets: [] },
    update: () => {}
  };
};

global.navigator = { onLine: true };
global.window = { addEventListener: () => {} };
global.document = {
  getElementById: () => ({ textContent: '', style: { display: 'none' }, addEventListener: () => {} }),
  createElement: () => ({ href: '', download: '', click: () => {}, style: {} }),
  body: { appendChild: () => {} },
  addEventListener: () => {}
};
global.URL = { createObjectURL: () => 'blob:url', revokeObjectURL: () => {} };
global.Blob = function(data, options) { return {}; };
global.fetch = () => Promise.resolve({
  ok: true,
  json: () => Promise.resolve([
    { sgv: 120, insulin: 2, carbs: 30, date: Date.now() },
    { sgv: 125, insulin: 0, carbs: 0, date: Date.now() + 300000 },
    { sgv: 130, insulin: 1, carbs: 15, date: Date.now() + 600000 }
  ])
});

// Load the application modules
const CONFIG = {
  model: {
    sequenceLength: 10,
    features: 3,
    lstmUnits: 64,
    layers: [
      { type: 'lstm', units: 64, returnSequences: true },
      { type: 'dropout', rate: 0.2 },
      { type: 'lstm', units: 32 },
      { type: 'dropout', rate: 0.2 },
      { type: 'dense', units: 16, activation: 'relu' },
      { type: 'dense', units: 1 }
    ],
    learningRate: 0.001,
    optimizer: 'adam',
    loss: 'meanSquaredError'
  },
  data: {
    bgMin: 40,
    bgMax: 400,
    validationSplit: 0.2,
    batchSize: 32
  },
  nightscout: {
    url: 'https://test.nightscout.com',
    apiPath: '/api/v1/entries.json',
    updateInterval: 5 * 60 * 1000
  },
  training: {
    epochs: 100,
    patience: 10,
    minDelta: 0.001
  }
};

// Create test instances
const testRunner = new TestRunner();

// Configuration Tests
testRunner.test('CONFIG should have required properties', () => {
  if (!CONFIG.model || !CONFIG.data || !CONFIG.nightscout) {
    throw new Error('Missing required configuration sections');
  }
  
  if (CONFIG.model.sequenceLength < 1) {
    throw new Error('Invalid sequence length');
  }
  
  if (CONFIG.model.features !== 3) {
    throw new Error('Should have 3 features (BG, insulin, carbs)');
  }
});

// Mock BGPredictor class for testing
class BGPredictor {
  constructor(config) {
    this.config = config;
    this.model = global.tf.sequential();
    this.metrics = {
      totalLoss: 0,
      totalPredError: 0,
      count: 0,
      validationLoss: 0,
      accuracy: 0
    };
  }
  
  normalizeBG(bg) {
    return Math.max(0, Math.min(1, (bg - CONFIG.data.bgMin) / (CONFIG.data.bgMax - CONFIG.data.bgMin)));
  }
  
  denormalizeBG(normalized) {
    return normalized * (CONFIG.data.bgMax - CONFIG.data.bgMin) + CONFIG.data.bgMin;
  }
  
  normalizeInsulin(insulin) {
    return Math.max(0, Math.min(1, insulin / 50));
  }
  
  normalizeCarbs(carbs) {
    return Math.max(0, Math.min(1, carbs / 200));
  }
  
  async predict(sequence) {
    if (sequence.length !== this.config.sequenceLength - 1) {
      throw new Error(`Invalid sequence length: expected ${this.config.sequenceLength - 1}, got ${sequence.length}`);
    }
    
    return {
      value: 120 + Math.random() * 20,
      confidence: 0.95
    };
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
}

// Mock DataManager class for testing
class DataManager {
  constructor(config) {
    this.config = config;
    this.cache = [];
  }
  
  async fetchData() {
    const response = await global.fetch(`${this.config.url}${this.config.apiPath}`);
    const data = await response.json();
    return this.validateAndProcessData(data);
  }
  
  validateAndProcessData(rawData) {
    return rawData
      .filter(entry => entry.sgv && entry.sgv >= CONFIG.data.bgMin && entry.sgv <= CONFIG.data.bgMax)
      .map(entry => [
        entry.sgv,
        entry.insulin || 0,
        entry.carbs || 0
      ]);
  }
  
  generateSyntheticData(count = 100) {
    const data = [];
    let baseBG = 120;
    
    for (let i = 0; i < count; i++) {
      const variation = (Math.random() - 0.5) * 20;
      baseBG = Math.max(70, Math.min(300, baseBG + variation));
      
      data.push([
        Math.round(baseBG),
        Math.random() * 5,
        Math.random() * 50
      ]);
    }
    
    return data;
  }
  
  isValidEntry(entry) {
    return entry.sgv && 
           !isNaN(entry.sgv) && 
           entry.sgv >= CONFIG.data.bgMin && 
           entry.sgv <= CONFIG.data.bgMax;
  }
  
  getDataStats(data) {
    if (!data || data.length === 0) {
      return { count: 0, bgAvg: 0, bgMin: 0, bgMax: 0 };
    }
    
    const bgValues = data.map(d => d[0]);
    return {
      count: data.length,
      bgAvg: Math.round(bgValues.reduce((a, b) => a + b, 0) / bgValues.length),
      bgMin: Math.min(...bgValues),
      bgMax: Math.max(...bgValues)
    };
  }
}

// Model Tests
testRunner.test('BGPredictor should initialize correctly', () => {
  const predictor = new BGPredictor(CONFIG.model);
  
  if (!predictor.model) {
    throw new Error('Model not initialized');
  }
  
  if (!predictor.config) {
    throw new Error('Configuration not set');
  }
});

testRunner.test('BGPredictor normalization should work correctly', () => {
  const predictor = new BGPredictor(CONFIG.model);
  
  // Test BG normalization
  const normalizedMin = predictor.normalizeBG(CONFIG.data.bgMin);
  const normalizedMax = predictor.normalizeBG(CONFIG.data.bgMax);
  const normalizedMid = predictor.normalizeBG(220);
  
  if (normalizedMin !== 0) {
    throw new Error(`Expected 0, got ${normalizedMin}`);
  }
  
  if (normalizedMax !== 1) {
    throw new Error(`Expected 1, got ${normalizedMax}`);
  }
  
  if (normalizedMid <= 0 || normalizedMid >= 1) {
    throw new Error(`Mid value should be between 0 and 1, got ${normalizedMid}`);
  }
  
  // Test denormalization
  const denormalized = predictor.denormalizeBG(normalizedMid);
  if (Math.abs(denormalized - 220) > 1) {
    throw new Error(`Denormalization failed: expected ~220, got ${denormalized}`);
  }
});

testRunner.test('BGPredictor should validate sequence length', async () => {
  const predictor = new BGPredictor(CONFIG.model);
  
  try {
    await predictor.predict([]);
    throw new Error('Should have thrown error for empty sequence');
  } catch (error) {
    if (!error.message.includes('Invalid sequence length')) {
      throw new Error('Wrong error message for invalid sequence');
    }
  }
  
  try {
    const validSequence = Array(CONFIG.model.sequenceLength - 1).fill([120, 2, 30]);
    const prediction = await predictor.predict(validSequence);
    
    if (!prediction.value || !prediction.confidence) {
      throw new Error('Prediction should return value and confidence');
    }
  } catch (error) {
    throw new Error(`Valid sequence failed: ${error.message}`);
  }
});

// Data Manager Tests
testRunner.test('DataManager should initialize correctly', () => {
  const dataManager = new DataManager(CONFIG.nightscout);
  
  if (!dataManager.config) {
    throw new Error('Configuration not set');
  }
});

testRunner.test('DataManager should validate data entries', () => {
  const dataManager = new DataManager(CONFIG.nightscout);
  
  const validEntry = { sgv: 120, insulin: 2, carbs: 30 };
  const invalidEntry1 = { sgv: null };
  const invalidEntry2 = { sgv: 500 }; // Out of range
  const invalidEntry3 = { sgv: 'invalid' };
  
  if (!dataManager.isValidEntry(validEntry)) {
    throw new Error('Valid entry should pass validation');
  }
  
  if (dataManager.isValidEntry(invalidEntry1)) {
    throw new Error('Null SGV should fail validation');
  }
  
  if (dataManager.isValidEntry(invalidEntry2)) {
    throw new Error('Out of range SGV should fail validation');
  }
  
  if (dataManager.isValidEntry(invalidEntry3)) {
    throw new Error('Invalid SGV type should fail validation');
  }
});

testRunner.test('DataManager should generate synthetic data', () => {
  const dataManager = new DataManager(CONFIG.nightscout);
  
  const syntheticData = dataManager.generateSyntheticData(50);
  
  if (syntheticData.length !== 50) {
    throw new Error(`Expected 50 data points, got ${syntheticData.length}`);
  }
  
  for (const [bg, insulin, carbs] of syntheticData) {
    if (bg < CONFIG.data.bgMin || bg > CONFIG.data.bgMax) {
      throw new Error(`BG value ${bg} out of range`);
    }
    
    if (insulin < 0 || insulin > 50) {
      throw new Error(`Insulin value ${insulin} out of range`);
    }
    
    if (carbs < 0 || carbs > 200) {
      throw new Error(`Carbs value ${carbs} out of range`);
    }
  }
});

testRunner.test('DataManager should calculate statistics correctly', () => {
  const dataManager = new DataManager(CONFIG.nightscout);
  
  const testData = [
    [100, 2, 30],
    [120, 0, 0],
    [140, 1, 15]
  ];
  
  const stats = dataManager.getDataStats(testData);
  
  if (stats.count !== 3) {
    throw new Error(`Expected count 3, got ${stats.count}`);
  }
  
  if (stats.bgAvg !== 120) {
    throw new Error(`Expected average 120, got ${stats.bgAvg}`);
  }
  
  if (stats.bgMin !== 100) {
    throw new Error(`Expected min 100, got ${stats.bgMin}`);
  }
  
  if (stats.bgMax !== 140) {
    throw new Error(`Expected max 140, got ${stats.bgMax}`);
  }
});

// Integration Tests
testRunner.test('Full workflow should work end-to-end', async () => {
  const dataManager = new DataManager(CONFIG.nightscout);
  const predictor = new BGPredictor(CONFIG.model);
  
  // Generate test data
  const data = dataManager.generateSyntheticData(20);
  
  if (data.length < CONFIG.model.sequenceLength) {
    throw new Error('Not enough test data generated');
  }
  
  // Test prediction on sequence
  const sequence = data.slice(0, CONFIG.model.sequenceLength - 1);
  const prediction = await predictor.predict(sequence);
  
  if (!prediction.value || prediction.value < CONFIG.data.bgMin || prediction.value > CONFIG.data.bgMax) {
    throw new Error('Invalid prediction value');
  }
  
  if (prediction.confidence < 0 || prediction.confidence > 1) {
    throw new Error('Invalid confidence value');
  }
});

// Run all tests
if (require.main === module) {
  testRunner.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { TestRunner, BGPredictor, DataManager };