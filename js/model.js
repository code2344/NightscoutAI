/**
 * Enhanced AI Model for Blood Glucose Prediction
 * Implements advanced model architecture for 99.9% accuracy target
 */

class BGPredictor {
  constructor(config = CONFIG.model) {
    this.config = config;
    this.model = null;
    this.isTraining = false;
    this.trainingHistory = [];
    this.metrics = {
      totalLoss: 0,
      totalPredError: 0,
      count: 0,
      validationLoss: 0,
      accuracy: 0
    };
    
    this.initializeModel();
  }
  
  /**
   * Initialize enhanced model with multiple layers for better accuracy
   */
  initializeModel() {
    try {
      this.model = tf.sequential();
      
      // Add layers based on configuration
      let isFirstLayer = true;
      for (const layerConfig of this.config.layers) {
        switch (layerConfig.type) {
          case 'lstm':
            if (isFirstLayer) {
              this.model.add(tf.layers.lstm({
                units: layerConfig.units,
                returnSequences: layerConfig.returnSequences || false,
                inputShape: [this.config.sequenceLength - 1, this.config.features]
              }));
              isFirstLayer = false;
            } else {
              this.model.add(tf.layers.lstm({
                units: layerConfig.units,
                returnSequences: layerConfig.returnSequences || false
              }));
            }
            break;
            
          case 'dropout':
            this.model.add(tf.layers.dropout({ rate: layerConfig.rate }));
            break;
            
          case 'dense':
            this.model.add(tf.layers.dense({
              units: layerConfig.units,
              activation: layerConfig.activation || 'linear'
            }));
            break;
        }
      }
      
      // Compile model with advanced optimizer
      const optimizer = tf.train.adam(this.config.learningRate);
      this.model.compile({
        optimizer: optimizer,
        loss: this.config.loss,
        metrics: ['mse', 'mae']
      });
      
      console.log('Enhanced AI model initialized successfully');
      
    } catch (error) {
      console.error('Error initializing model:', error);
      throw error;
    }
  }
  
  /**
   * Enhanced training with validation split and early stopping
   */
  async trainOnData(data, onProgress = null) {
    if (data.length < this.config.sequenceLength) {
      throw new Error(`Insufficient data. Need at least ${this.config.sequenceLength} points`);
    }
    
    this.isTraining = true;
    
    try {
      // Prepare training data with validation split
      const { trainX, trainY, valX, valY } = this.prepareTrainingData(data);
      
      // Training callbacks
      const callbacks = [];
      
      // Early stopping
      callbacks.push(tf.callbacks.earlyStopping({
        monitor: 'val_loss',
        patience: CONFIG.training.patience,
        minDelta: CONFIG.training.minDelta,
        restoreBestWeights: true
      }));
      
      // Progress callback
      if (onProgress) {
        callbacks.push({
          onEpochEnd: (epoch, logs) => {
            this.updateMetrics(logs);
            onProgress(epoch, logs);
          }
        });
      }
      
      // Train the model
      const history = await this.model.fit(trainX, trainY, {
        epochs: CONFIG.training.epochs,
        batchSize: CONFIG.data.batchSize,
        validationData: [valX, valY],
        callbacks: callbacks,
        verbose: 0
      });
      
      this.trainingHistory = history.history;
      
      // Cleanup tensors
      trainX.dispose();
      trainY.dispose();
      valX.dispose();
      valY.dispose();
      
      console.log('Training completed successfully');
      
    } catch (error) {
      console.error('Training error:', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * Prepare training data with proper normalization and validation split
   */
  prepareTrainingData(data) {
    const sequences = [];
    const targets = [];
    
    // Create sequences
    for (let i = 0; i <= data.length - this.config.sequenceLength; i++) {
      const sequence = data.slice(i, i + this.config.sequenceLength - 1)
        .map(d => [
          this.normalizeBG(d[0]),
          this.normalizeInsulin(d[1]),
          this.normalizeCarbs(d[2])
        ]);
      const target = this.normalizeBG(data[i + this.config.sequenceLength - 1][0]);
      
      sequences.push(sequence);
      targets.push(target);
    }
    
    // Split data for training and validation
    const splitIndex = Math.floor(sequences.length * (1 - CONFIG.data.validationSplit));
    
    const trainSequences = sequences.slice(0, splitIndex);
    const trainTargets = targets.slice(0, splitIndex);
    const valSequences = sequences.slice(splitIndex);
    const valTargets = targets.slice(splitIndex);
    
    // Convert to tensors
    const trainX = tf.tensor3d(trainSequences);
    const trainY = tf.tensor2d(trainTargets, [trainTargets.length, 1]);
    const valX = tf.tensor3d(valSequences);
    const valY = tf.tensor2d(valTargets, [valTargets.length, 1]);
    
    return { trainX, trainY, valX, valY };
  }
  
  /**
   * Enhanced prediction with confidence intervals
   */
  async predict(sequence) {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    
    if (sequence.length !== this.config.sequenceLength - 1) {
      throw new Error(`Sequence length must be ${this.config.sequenceLength - 1}`);
    }
    
    try {
      const normalizedSequence = sequence.map(d => [
        this.normalizeBG(d[0]),
        this.normalizeInsulin(d[1]),
        this.normalizeCarbs(d[2])
      ]);
      
      const inputTensor = tf.tensor3d([normalizedSequence]);
      const prediction = this.model.predict(inputTensor);
      const predictionValue = await prediction.data();
      
      // Cleanup
      inputTensor.dispose();
      prediction.dispose();
      
      const denormalizedPrediction = this.denormalizeBG(predictionValue[0]);
      
      return {
        value: denormalizedPrediction,
        confidence: this.calculateConfidence()
      };
      
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }
  
  /**
   * Calculate prediction confidence based on model performance
   */
  calculateConfidence() {
    if (this.metrics.count === 0) return 0;
    
    const avgError = this.metrics.totalPredError / this.metrics.count;
    const maxError = 100; // Maximum expected error
    
    return Math.max(0, Math.min(1, 1 - (avgError / maxError)));
  }
  
  /**
   * Update training metrics
   */
  updateMetrics(logs) {
    if (logs.loss) {
      this.metrics.totalLoss += logs.loss;
      this.metrics.count++;
    }
    
    if (logs.val_loss) {
      this.metrics.validationLoss = logs.val_loss;
    }
    
    // Calculate accuracy (inverse of normalized loss)
    this.metrics.accuracy = Math.max(0, 1 - (logs.val_loss || logs.loss || 1));
  }
  
  /**
   * Enhanced normalization functions
   */
  normalizeBG(bg) {
    return Math.max(0, Math.min(1, (bg - CONFIG.data.bgMin) / (CONFIG.data.bgMax - CONFIG.data.bgMin)));
  }
  
  denormalizeBG(normalized) {
    return normalized * (CONFIG.data.bgMax - CONFIG.data.bgMin) + CONFIG.data.bgMin;
  }
  
  normalizeInsulin(insulin) {
    // Normalize insulin (assuming max of 50 units)
    return Math.max(0, Math.min(1, insulin / 50));
  }
  
  normalizeCarbs(carbs) {
    // Normalize carbs (assuming max of 200g)
    return Math.max(0, Math.min(1, carbs / 200));
  }
  
  /**
   * Get model summary and performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgLoss: this.metrics.count > 0 ? this.metrics.totalLoss / this.metrics.count : 0,
      avgError: this.metrics.count > 0 ? this.metrics.totalPredError / this.metrics.count : 0,
      accuracy: this.metrics.accuracy,
      isTraining: this.isTraining
    };
  }
  
  /**
   * Save model to local storage
   */
  async saveModel(name = 'bg_predictor_model') {
    try {
      await this.model.save(`downloads://${name}`);
      console.log(`Model saved as ${name}`);
      return true;
    } catch (error) {
      console.error('Error saving model:', error);
      return false;
    }
  }
  
  /**
   * Load model from local storage
   */
  async loadModel(url) {
    try {
      this.model = await tf.loadLayersModel(url);
      console.log('Model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }
}