/**
 * Main Application Controller
 * Orchestrates all components of the NightscoutAI system
 */

class NightscoutAI {
  constructor() {
    this.predictor = null;
    this.dataManager = null;
    this.uiManager = null;
    this.isInitialized = false;
    
    this.initialize();
  }
  
  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('Initializing NightscoutAI...');
      
      // Wait for TensorFlow to be ready
      if (typeof tf === 'undefined') {
        throw new Error('TensorFlow.js not loaded');
      }
      
      await tf.ready();
      console.log('TensorFlow.js ready');
      
      // Initialize components
      this.dataManager = new DataManager();
      this.predictor = new BGPredictor();
      this.uiManager = new UIManager();
      
      // Set up global reference for UI callbacks
      window.app = this;
      
      this.isInitialized = true;
      console.log('NightscoutAI initialized successfully');
      
      // Perform initial data fetch and training
      await this.performInitialSetup();
      
    } catch (error) {
      console.error('Initialization failed:', error);
      this.handleInitializationError(error);
    }
  }
  
  /**
   * Perform initial setup with data fetch and training
   */
  async performInitialSetup() {
    try {
      console.log('Performing initial setup...');
      
      // Try to fetch real data, fallback to synthetic
      let data;
      try {
        data = await this.dataManager.fetchData();
      } catch (error) {
        console.warn('Failed to fetch real data, using synthetic data:', error.message);
        data = this.dataManager.generateSyntheticData(200);
      }
      
      if (data.length === 0) {
        throw new Error('No data available for training');
      }
      
      console.log(`Initial setup with ${data.length} data points`);
      
      // Update UI with initial data
      this.uiManager.updateDashboard(data, [], this.predictor.getMetrics());
      
      // Start auto-update if enabled
      this.uiManager.startAutoUpdate();
      
    } catch (error) {
      console.error('Initial setup failed:', error);
      this.uiManager.showError(`Initial setup failed: ${error.message}`);
    }
  }
  
  /**
   * Main update and train function
   */
  async updateAndTrain() {
    if (!this.isInitialized) {
      throw new Error('Application not initialized');
    }
    
    try {
      console.log('Starting update and training cycle...');
      
      // Fetch latest data
      const data = await this.dataManager.fetchData();
      
      if (data.length < CONFIG.model.sequenceLength) {
        throw new Error(`Insufficient data for training. Need at least ${CONFIG.model.sequenceLength} points, got ${data.length}`);
      }
      
      // Train the model with progress callback
      await this.predictor.trainOnData(data, (epoch, logs) => {
        this.handleTrainingProgress(epoch, logs);
      });
      
      // Generate predictions for visualization
      const predictions = await this.generatePredictions(data);
      
      // Update UI with new data and predictions
      const metrics = this.predictor.getMetrics();
      this.uiManager.updateDashboard(data, predictions, metrics);
      
      // Update predicted BG display
      if (predictions.length > 0) {
        const nextPrediction = predictions[predictions.length - 1];
        document.getElementById('predicted-bg').textContent = Math.round(nextPrediction.value);
      }
      
      console.log('Update and training cycle completed successfully');
      
    } catch (error) {
      console.error('Update and training failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate predictions for the current data
   */
  async generatePredictions(data) {
    const predictions = [];
    const sequenceLength = CONFIG.model.sequenceLength;
    
    try {
      // Generate predictions for the last few data points for visualization
      const predictionCount = Math.min(20, data.length - sequenceLength + 1);
      
      for (let i = data.length - predictionCount; i < data.length - sequenceLength + 1; i++) {
        if (i >= 0) {
          const sequence = data.slice(i, i + sequenceLength - 1);
          const prediction = await this.predictor.predict(sequence);
          predictions.push(prediction);
        }
      }
      
      // Generate next prediction
      if (data.length >= sequenceLength) {
        const lastSequence = data.slice(-sequenceLength + 1);
        const nextPrediction = await this.predictor.predict(lastSequence);
        predictions.push(nextPrediction);
      }
      
      return predictions;
      
    } catch (error) {
      console.error('Prediction generation failed:', error);
      return [];
    }
  }
  
  /**
   * Handle training progress updates
   */
  handleTrainingProgress(epoch, logs) {
    const progress = {
      epoch: epoch + 1,
      totalEpochs: CONFIG.training.epochs,
      loss: logs.loss || 0,
      valLoss: logs.val_loss || 0,
      accuracy: Math.max(0, 1 - (logs.val_loss || logs.loss || 1))
    };
    
    // Update progress indicator if it exists
    const progressElement = document.getElementById('training-progress');
    if (progressElement) {
      const percentage = (progress.epoch / progress.totalEpochs) * 100;
      progressElement.style.width = `${percentage}%`;
      progressElement.textContent = `Epoch ${progress.epoch}/${progress.totalEpochs}`;
    }
    
    // Log progress every 10 epochs
    if (epoch % 10 === 0) {
      console.log(`Training Progress - Epoch ${progress.epoch}: Loss=${progress.loss.toFixed(4)}, Val Loss=${progress.valLoss.toFixed(4)}, Accuracy=${(progress.accuracy*100).toFixed(2)}%`);
    }
  }
  
  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    const errorMessage = `Initialization failed: ${error.message}`;
    
    // Try to show error in UI
    const errorElement = document.getElementById('error-display') || 
                        document.querySelector('.error') || 
                        document.body;
    
    if (errorElement) {
      errorElement.innerHTML = `
        <div style="background: #fee; border: 1px solid #fcc; padding: 15px; margin: 10px; border-radius: 5px;">
          <h3 style="color: #c33; margin: 0 0 10px 0;">⚠️ Application Error</h3>
          <p style="margin: 0; color: #666;">${errorMessage}</p>
          <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">Reload Page</button>
        </div>
      `;
    }
    
    console.error('Application initialization failed:', error);
  }
  
  /**
   * Get application status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      dataManager: !!this.dataManager,
      predictor: !!this.predictor,
      uiManager: !!this.uiManager,
      modelMetrics: this.predictor ? this.predictor.getMetrics() : null,
      dataStats: this.dataManager ? this.dataManager.getDataStats(this.dataManager.cache) : null
    };
  }
  
  /**
   * Export application data
   */
  exportData(format = 'json') {
    if (!this.dataManager) {
      throw new Error('Data manager not initialized');
    }
    
    return this.dataManager.exportData(format);
  }
  
  /**
   * Reset the application
   */
  async reset() {
    try {
      console.log('Resetting application...');
      
      // Stop auto-update
      if (this.uiManager) {
        this.uiManager.stopAutoUpdate();
      }
      
      // Clear data cache
      if (this.dataManager) {
        this.dataManager.clearCache();
      }
      
      // Reinitialize model
      if (this.predictor) {
        this.predictor = new BGPredictor();
      }
      
      // Perform fresh setup
      await this.performInitialSetup();
      
      console.log('Application reset completed');
      
    } catch (error) {
      console.error('Reset failed:', error);
      throw error;
    }
  }
  
  /**
   * Save current model and configuration
   */
  async saveAll() {
    try {
      const results = {
        model: false,
        data: false
      };
      
      // Save model
      if (this.predictor) {
        results.model = await this.predictor.saveModel();
      }
      
      // Save data export
      if (this.dataManager) {
        const dataExport = this.exportData();
        const blob = new Blob([dataExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nightscout-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        results.data = true;
      }
      
      return results;
      
    } catch (error) {
      console.error('Save all failed:', error);
      throw error;
    }
  }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing NightscoutAI...');
  
  // Check for required dependencies and initialize demo mode if needed
  const needsDemoMode = window.tfLoadFailed || window.chartLoadFailed;
  
  if (needsDemoMode) {
    console.log('🎭 Dependencies unavailable, switching to demo mode...');
    
    // Initialize demo mode
    if (window.initializeDemoMode) {
      window.initializeDemoMode();
    }
    
    // Remove existing error messages
    const errorDivs = document.querySelectorAll('div[style*="background: #fee"]');
    errorDivs.forEach(div => div.remove());
  }
  
  // Check for TensorFlow.js
  if (typeof tf === 'undefined') {
    if (!needsDemoMode) {
      console.error('TensorFlow.js not loaded - check your internet connection or use local files');
      document.body.innerHTML += `
        <div style="background: #fee; border: 1px solid #fcc; padding: 15px; margin: 10px; border-radius: 5px;">
          <h3 style="color: #c33;">⚠️ Dependencies Missing</h3>
          <p>TensorFlow.js failed to load. Running in demo mode with limited functionality.</p>
        </div>
      `;
    }
    
    if (!window.tf && window.createMockTensorFlow) {
      window.tf = window.createMockTensorFlow();
    }
  }
  
  // Check for Chart.js
  if (typeof Chart === 'undefined') {
    if (!needsDemoMode) {
      console.error('Chart.js not loaded - check your internet connection or use local files');
      document.body.innerHTML += `
        <div style="background: #fee; border: 1px solid #fcc; padding: 15px; margin: 10px; border-radius: 5px;">
          <h3 style="color: #c33;">⚠️ Dependencies Missing</h3>
          <p>Chart.js failed to load. Using fallback visualization.</p>
        </div>
      `;
    }
    
    if (!window.Chart && window.createMockChart) {
      window.Chart = window.createMockChart();
    }
  }
  
  // Initialize the application
  try {
    window.nightscoutAI = new NightscoutAI();
    
    if (needsDemoMode) {
      // In demo mode, use synthetic data immediately
      setTimeout(() => {
        if (window.nightscoutAI && window.nightscoutAI.dataManager) {
          const demoData = window.generateDemoData ? window.generateDemoData() : [];
          if (demoData.length > 0) {
            window.nightscoutAI.dataManager.cache = demoData;
            window.nightscoutAI.updateAndTrain().catch(console.error);
          }
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Failed to initialize NightscoutAI:', error);
    
    // Show error in UI
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: #fee; 
      border: 1px solid #fcc; 
      padding: 15px; 
      margin: 10px; 
      border-radius: 5px;
      text-align: center;
    `;
    errorDiv.innerHTML = `
      <h3 style="color: #c33;">⚠️ Initialization Error</h3>
      <p>Failed to start the application: ${error.message}</p>
      <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">Reload Page</button>
    `;
    document.body.appendChild(errorDiv);
  }
});