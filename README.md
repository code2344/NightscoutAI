# 🩸 NightscoutAI - Blood Glucose Prediction Dashboard

An AI-powered blood glucose prediction tool that trains entirely in your browser using Nightscout CGM data.

![NightscoutAI Dashboard](https://via.placeholder.com/800x400?text=NightscoutAI+Dashboard)

## ✨ Features

- **🤖 Real-time AI Training**: LSTM neural network trains on your Nightscout data directly in the browser
- **📊 Interactive Charts**: Beautiful visualizations of actual vs predicted blood glucose levels
- **💾 Model Persistence**: Save and load trained models locally in your browser
- **🎮 Demo Mode**: Test the application with sample data when Nightscout API is unavailable
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **🔐 Privacy-First**: All data processing happens locally - no data sent to external servers
- **⚡ Real-time Predictions**: Get instant blood glucose predictions based on historical patterns

## 🚀 Quick Start

1. **Open the Application**: Simply open `index.html` in a modern web browser
2. **Enter Your Nightscout URL**: Input your Nightscout site URL (e.g., `https://yoursite.herokuapp.com`)
3. **Fetch & Train**: Click the "🔄 Fetch & Train" button to download data and train the AI model
4. **View Predictions**: See your current BG and AI-predicted next reading

### Demo Mode

If you don't have access to a Nightscout site or want to test the application:
1. Click the "🎮 Demo Mode" button
2. The app will use sample blood glucose data to demonstrate functionality

## 🔧 Technical Details

### AI Model Architecture
- **Model Type**: LSTM (Long Short-Term Memory) Neural Network
- **Input Features**: Blood glucose, insulin doses, carbohydrate intake
- **Sequence Length**: 10 time points for pattern recognition
- **Training**: Online learning with each data update

### Technologies Used
- **TensorFlow.js**: Machine learning in the browser
- **Chart.js**: Interactive data visualizations
- **Vanilla JavaScript**: Lightweight, no framework dependencies
- **HTML5/CSS3**: Modern responsive design

### Data Processing
- Fetches data from Nightscout API (`/api/v1/entries.json`)
- Normalizes blood glucose values (40-400 mg/dL range)
- Filters invalid readings and sorts by timestamp
- Creates sliding windows for sequence-based learning

## 📊 Statistics Dashboard

The application provides comprehensive training statistics:
- **Average Loss**: Model training loss (lower is better)
- **Prediction Error**: Average prediction accuracy in mg/dL
- **Training Steps**: Total number of training iterations
- **Data Points**: Total CGM readings processed

## 💡 Usage Tips

1. **Data Quality**: More historical data generally leads to better predictions
2. **Regular Updates**: Train periodically with new data for improved accuracy
3. **Model Saving**: Save your trained model to avoid retraining each session
4. **Browser Compatibility**: Works best in Chrome, Firefox, Safari, and Edge

## ⚠️ Important Notes

- **Not Medical Advice**: This tool is for educational/research purposes only
- **Supplement, Don't Replace**: Should complement, not replace, medical monitoring
- **Data Privacy**: All processing happens locally in your browser
- **Internet Required**: Needs internet connection to fetch Nightscout data (except demo mode)

## 🔧 Configuration

### Adjustable Parameters (in code)
```javascript
const SEQ_LEN = 10;        // Sequence length for predictions
const LSTM_UNITS = 16;     // Neural network complexity
const BG_MIN = 40;         // Minimum BG value for normalization
const BG_MAX = 400;        // Maximum BG value for normalization
```

## 🐛 Troubleshooting

**Issue**: External libraries not loading
- **Solution**: The app includes fallback CDNs and demo mode for offline testing

**Issue**: No data from Nightscout
- **Solution**: Verify your Nightscout URL is correct and accessible

**Issue**: Poor prediction accuracy
- **Solution**: Ensure sufficient historical data (at least 100+ readings)

## 🤝 Contributing

Contributions are welcome! Some areas for improvement:
- Enhanced model architectures
- Additional input features (exercise, stress, sleep)
- Mobile app version
- Advanced visualization options
- Multi-step ahead predictions

## 📄 License

This project is open source. Please ensure compliance with medical device regulations in your jurisdiction.

## 🙏 Acknowledgments

- Nightscout community for the open CGM platform
- TensorFlow.js team for browser-based machine learning
- Chart.js for excellent visualization capabilities

---

**⚠️ Medical Disclaimer**: This software is not intended for medical diagnosis or treatment. Always consult healthcare professionals for medical decisions.