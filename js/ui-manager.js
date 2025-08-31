/**
 * Enhanced UI Manager for Nightscout AI Dashboard
 * Handles all user interface interactions and visualizations
 */

class UIManager {
  constructor() {
    this.chart = null;
    this.updateInterval = null;
    this.isAutoUpdateEnabled = true;
    
    this.initializeChart();
    this.setupEventListeners();
  }
  
  /**
   * Initialize enhanced chart with better styling and features
   */
  initializeChart() {
    const ctx = document.getElementById('bg-chart').getContext('2d');
    
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Actual BG',
            data: [],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
          },
          {
            label: 'Predicted BG',
            data: [],
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            borderDash: [5, 5]
          },
          {
            label: 'Confidence Band',
            data: [],
            borderColor: 'rgba(220, 38, 38, 0.3)',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderWidth: 1,
            fill: '+1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Blood Glucose (mg/dL)'
            },
            suggestedMin: 40,
            suggestedMax: 400,
            grid: {
              color: function(context) {
                // Highlight target range (80-180)
                if (context.tick.value >= 80 && context.tick.value <= 180) {
                  return 'rgba(34, 197, 94, 0.2)';
                }
                return 'rgba(0, 0, 0, 0.1)';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                const value = Math.round(context.parsed.y);
                return `${context.dataset.label}: ${value} mg/dL`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Setup event listeners for UI interactions
   */
  setupEventListeners() {
    // Fetch & Train button
    document.getElementById('update-btn').addEventListener('click', () => {
      this.handleFetchAndTrain();
    });
    
    // Save Model button
    document.getElementById('save-btn').addEventListener('click', () => {
      this.handleSaveModel();
    });
    
    // Auto-update toggle (if element exists)
    const autoUpdateToggle = document.getElementById('auto-update-toggle');
    if (autoUpdateToggle) {
      autoUpdateToggle.addEventListener('change', (e) => {
        this.toggleAutoUpdate(e.target.checked);
      });
    }
    
    // Settings modal (if exists)
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }
  }
  
  /**
   * Handle fetch and train button click
   */
  async handleFetchAndTrain() {
    const button = document.getElementById('update-btn');
    const originalText = button.textContent;
    
    try {
      button.textContent = 'Training...';
      button.disabled = true;
      
      // Show loading state
      this.showLoading('Fetching data and training model...');
      
      // Trigger the update process
      if (window.app && window.app.updateAndTrain) {
        await window.app.updateAndTrain();
      }
      
      this.showSuccess('Model training completed successfully!');
      
    } catch (error) {
      console.error('Training error:', error);
      this.showError(`Training failed: ${error.message}`);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
      this.hideLoading();
    }
  }
  
  /**
   * Handle save model button click
   */
  async handleSaveModel() {
    try {
      if (window.app && window.app.predictor) {
        const success = await window.app.predictor.saveModel();
        if (success) {
          this.showSuccess('Model saved successfully!');
        } else {
          this.showError('Failed to save model');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showError(`Save failed: ${error.message}`);
    }
  }
  
  /**
   * Update dashboard with new data and predictions
   */
  updateDashboard(data, predictions, metrics) {
    if (!data || data.length === 0) {
      this.showError('No data available');
      return;
    }
    
    // Update basic stats
    this.updateBasicStats(data, metrics);
    
    // Update advanced metrics
    this.updateAdvancedMetrics(metrics);
    
    // Update chart
    this.updateChart(data, predictions);
    
    // Update status indicator
    this.updateStatusIndicator(metrics);
  }
  
  /**
   * Update basic statistics display
   */
  updateBasicStats(data, metrics) {
    const latest = data[data.length - 1];
    
    // Latest BG
    document.getElementById('latest-bg').textContent = Math.round(latest[0]);
    
    // Data points
    document.getElementById('total-data').textContent = data.length;
    
    // Sequence length and LSTM units
    document.getElementById('seq-len').textContent = CONFIG.model.sequenceLength;
    document.getElementById('lstm-units').textContent = CONFIG.model.lstmUnits;
  }
  
  /**
   * Update advanced metrics display
   */
  updateAdvancedMetrics(metrics) {
    // Training metrics
    document.getElementById('avg-loss').textContent = 
      metrics.avgLoss ? metrics.avgLoss.toFixed(4) : '-';
    
    document.getElementById('avg-error').textContent = 
      metrics.avgError ? metrics.avgError.toFixed(2) : '-';
    
    document.getElementById('train-steps').textContent = metrics.count || 0;
    
    // Add accuracy display if element exists
    const accuracyElement = document.getElementById('accuracy');
    if (accuracyElement) {
      const accuracy = (metrics.accuracy * 100).toFixed(2);
      accuracyElement.textContent = `${accuracy}%`;
      
      // Color code accuracy
      if (accuracy >= 99.9) {
        accuracyElement.className = 'accuracy excellent';
      } else if (accuracy >= 95) {
        accuracyElement.className = 'accuracy good';
      } else {
        accuracyElement.className = 'accuracy poor';
      }
    }
  }
  
  /**
   * Update chart with data and predictions
   */
  updateChart(data, predictions) {
    const maxPoints = CONFIG.ui.chartMaxPoints;
    const displayData = data.length > maxPoints ? data.slice(-maxPoints) : data;
    
    // Update labels (time indices)
    this.chart.data.labels = displayData.map((_, i) => i + 1);
    
    // Update actual BG data
    this.chart.data.datasets[0].data = displayData.map(d => d[0]);
    
    // Update predictions
    if (predictions && predictions.length > 0) {
      const predictionData = new Array(displayData.length).fill(null);
      
      // Fill prediction data starting from the point where we have predictions
      const startIndex = Math.max(0, displayData.length - predictions.length);
      predictions.forEach((pred, i) => {
        if (startIndex + i < predictionData.length) {
          predictionData[startIndex + i] = pred.value;
        }
      });
      
      this.chart.data.datasets[1].data = predictionData;
      
      // Add confidence bands if available
      if (this.chart.data.datasets[2] && predictions[0].confidence !== undefined) {
        const confidenceBand = predictionData.map((pred, i) => {
          if (pred === null) return null;
          const confidence = predictions[i - startIndex]?.confidence || 0;
          return pred + (pred * 0.1 * (1 - confidence)); // Adjust band size based on confidence
        });
        this.chart.data.datasets[2].data = confidenceBand;
      }
    }
    
    this.chart.update('none'); // Fast update without animation
  }
  
  /**
   * Update status indicator
   */
  updateStatusIndicator(metrics) {
    const statusElement = document.getElementById('status-indicator');
    if (!statusElement) return;
    
    if (metrics.isTraining) {
      statusElement.textContent = '🔄 Training...';
      statusElement.className = 'status training';
    } else if (metrics.accuracy >= 0.999) {
      statusElement.textContent = '✅ Excellent';
      statusElement.className = 'status excellent';
    } else if (metrics.accuracy >= 0.95) {
      statusElement.textContent = '✓ Good';
      statusElement.className = 'status good';
    } else {
      statusElement.textContent = '⚠️ Needs Training';
      statusElement.className = 'status warning';
    }
  }
  
  /**
   * Show loading state
   */
  showLoading(message = 'Loading...') {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.textContent = message;
      loadingElement.style.display = 'block';
    }
  }
  
  /**
   * Hide loading state
   */
  hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
  
  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }
  
  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error');
    console.error(message);
  }
  
  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Try to use existing notification system
    let notificationElement = document.getElementById('notification');
    
    if (!notificationElement) {
      // Create notification element if it doesn't exist
      notificationElement = document.createElement('div');
      notificationElement.id = 'notification';
      notificationElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 300px;
      `;
      document.body.appendChild(notificationElement);
    }
    
    // Set appearance based on type
    switch (type) {
      case 'success':
        notificationElement.style.backgroundColor = '#10b981';
        break;
      case 'error':
        notificationElement.style.backgroundColor = '#ef4444';
        break;
      default:
        notificationElement.style.backgroundColor = '#3b82f6';
    }
    
    notificationElement.textContent = message;
    notificationElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      notificationElement.style.display = 'none';
    }, 5000);
  }
  
  /**
   * Toggle auto-update functionality
   */
  toggleAutoUpdate(enabled) {
    this.isAutoUpdateEnabled = enabled;
    
    if (enabled) {
      this.startAutoUpdate();
    } else {
      this.stopAutoUpdate();
    }
  }
  
  /**
   * Start auto-update interval
   */
  startAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.updateInterval = setInterval(() => {
      if (window.app && window.app.updateAndTrain) {
        window.app.updateAndTrain().catch(console.error);
      }
    }, CONFIG.nightscout.updateInterval);
  }
  
  /**
   * Stop auto-update interval
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Show settings modal (placeholder)
   */
  showSettings() {
    alert('Settings panel coming soon!');
  }
}