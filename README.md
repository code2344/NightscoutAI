# 🩺 NightscoutAI - Advanced Blood Glucose Prediction Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.5.0-orange.svg)](https://www.tensorflow.org/js)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

An advanced AI-powered blood glucose prediction dashboard for Nightscout data, targeting 99.9% accuracy using enhanced deep learning techniques.

## 🌟 Features

### 🧠 Advanced AI Model
- **Multi-layer LSTM architecture** with dropout for enhanced accuracy
- **Enhanced training capabilities** with validation split and early stopping
- **Real-time prediction** with confidence intervals
- **Configurable hyperparameters** for optimal performance
- **Model persistence** for saving and loading trained models

### 📊 Comprehensive Dashboard
- **Real-time blood glucose monitoring** and prediction
- **Interactive charts** with confidence bands
- **Performance metrics** including accuracy tracking
- **Training progress visualization**
- **Export functionality** for data analysis

### 🛠️ Technical Excellence
- **Modular architecture** with separated concerns
- **Enhanced error handling** and data validation
- **Offline support** with synthetic data generation
- **Responsive design** for mobile and desktop
- **Configuration management** for flexible deployment

## 🚀 Quick Start

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection for external dependencies (or local dependency files)
- Access to Nightscout API (or synthetic data will be generated)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/code2344/NightscoutAI.git
   cd NightscoutAI
   ```

2. **Start a local server:**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Configuration

Edit `config.js` to customize the application:

```javascript
const CONFIG = {
  nightscout: {
    url: 'YOUR_NIGHTSCOUT_URL',
    updateInterval: 5 * 60 * 1000 // 5 minutes
  },
  model: {
    sequenceLength: 10,
    lstmUnits: 64,
    layers: [
      { type: 'lstm', units: 64, returnSequences: true },
      { type: 'dropout', rate: 0.2 },
      { type: 'lstm', units: 32 },
      { type: 'dropout', rate: 0.2 },
      { type: 'dense', units: 16, activation: 'relu' },
      { type: 'dense', units: 1 }
    ]
  }
  // ... more configuration options
};
```

## 📈 Model Architecture

### Enhanced LSTM Network
The AI model uses a sophisticated multi-layer architecture designed for high accuracy:

```
Input Layer (9 timesteps × 3 features)
    ↓
LSTM Layer (64 units, return sequences)
    ↓
Dropout Layer (20% rate)
    ↓
LSTM Layer (32 units)
    ↓
Dropout Layer (20% rate)
    ↓
Dense Layer (16 units, ReLU activation)
    ↓
Output Layer (1 unit, blood glucose prediction)
```

### Training Features
- **Validation Split**: 20% of data for validation
- **Early Stopping**: Prevents overfitting
- **Learning Rate Scheduling**: Adaptive learning rate
- **Batch Training**: Configurable batch size
- **Progress Tracking**: Real-time training metrics

## 🔧 API Reference

### Core Classes

#### `BGPredictor`
Main AI model class for blood glucose prediction.

```javascript
const predictor = new BGPredictor(config);

// Train the model
await predictor.trainOnData(data, progressCallback);

// Make predictions
const prediction = await predictor.predict(sequence);

// Get model metrics
const metrics = predictor.getMetrics();

// Save/load model
await predictor.saveModel('my_model');
await predictor.loadModel('path/to/model');
```

#### `DataManager`
Handles data fetching, validation, and preprocessing.

```javascript
const dataManager = new DataManager(config);

// Fetch data from Nightscout
const data = await dataManager.fetchData();

// Generate synthetic data for testing
const syntheticData = dataManager.generateSyntheticData(100);

// Get data statistics
const stats = dataManager.getDataStats(data);

// Export data
const exportedData = dataManager.exportData('json');
```

#### `UIManager`
Manages user interface interactions and visualizations.

```javascript
const uiManager = new UIManager();

// Update dashboard
uiManager.updateDashboard(data, predictions, metrics);

// Show notifications
uiManager.showSuccess('Operation completed!');
uiManager.showError('An error occurred');

// Control auto-update
uiManager.toggleAutoUpdate(true);
```

### Data Format

The system expects data in the following format:

```javascript
[
  [bloodGlucose, insulin, carbs],
  [120, 2.5, 45],  // Example: 120 mg/dL BG, 2.5 units insulin, 45g carbs
  [125, 0, 0],     // Example: 125 mg/dL BG, no insulin or carbs
  // ... more data points
]
```

## 🧪 Testing

### Synthetic Data Mode
When Nightscout API is unavailable, the system automatically generates realistic synthetic data for testing:

```javascript
// Generate 200 synthetic data points
const testData = dataManager.generateSyntheticData(200);

// Test model training
await predictor.trainOnData(testData);
```

### Validation Metrics
The system tracks multiple accuracy metrics:

- **Loss**: Mean squared error between predictions and actual values
- **Validation Loss**: Loss on held-out validation data
- **Accuracy**: Percentage accuracy (target: 99.9%)
- **Average Error**: Mean absolute deviation in mg/dL

## 🎯 Achieving 99.9% Accuracy

### Model Optimization Strategies

1. **Enhanced Architecture**:
   - Multi-layer LSTM for complex pattern recognition
   - Dropout layers to prevent overfitting
   - Proper layer sizing for optimal capacity

2. **Advanced Training**:
   - Validation split for unbiased evaluation
   - Early stopping to prevent overfitting
   - Learning rate scheduling for optimal convergence

3. **Data Quality**:
   - Input validation and sanitization
   - Outlier detection and handling
   - Proper normalization techniques

4. **Feature Engineering**:
   - Multi-feature input (BG, insulin, carbs)
   - Temporal sequence modeling
   - Contextual information preservation

### Performance Monitoring
The dashboard provides real-time monitoring of:
- Training progress and convergence
- Validation metrics and overfitting detection
- Prediction accuracy and confidence intervals
- Model performance over time

## 🔒 Security & Privacy

- **Local Processing**: All AI computations run in the browser
- **No Data Storage**: Data is not permanently stored on servers
- **API Security**: Secure HTTPS connections to Nightscout
- **Input Validation**: All user inputs are validated and sanitized

## 🌐 Browser Compatibility

- **Chrome/Chromium**: 88+ (recommended)
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 88+

Requires WebGL support for TensorFlow.js operations.

## 📱 Mobile Support

The dashboard is fully responsive and optimized for:
- **Smartphones**: iOS 14+, Android 10+
- **Tablets**: iPadOS 14+, Android tablets
- **Touch interactions**: Optimized for touch screens
- **PWA Ready**: Can be installed as a Progressive Web App

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- **ES6+** JavaScript syntax
- **JSDoc** comments for all functions
- **Modular** architecture with clear separation of concerns
- **Error handling** for all async operations
- **Responsive** design principles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Nightscout Community** for the open diabetes data platform
- **TensorFlow.js Team** for making AI accessible in browsers
- **Chart.js** for beautiful data visualizations
- **Contributors** who help improve this project

## 📞 Support

For support and questions:

- **Issues**: [GitHub Issues](https://github.com/code2344/NightscoutAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/code2344/NightscoutAI/discussions)
- **Documentation**: [Wiki](https://github.com/code2344/NightscoutAI/wiki)

## 🗺️ Roadmap

### Short Term
- [ ] Advanced model architectures (Transformer, CNN-LSTM)
- [ ] Real-time model retraining
- [ ] Enhanced data preprocessing
- [ ] Mobile app development

### Long Term
- [ ] Multi-user support
- [ ] Cloud model training
- [ ] Integration with CGM devices
- [ ] Clinical validation studies

---

**Disclaimer**: This tool is for educational and research purposes only. Always consult with healthcare professionals for medical decisions. This software is not intended to replace professional medical advice, diagnosis, or treatment.