/**
 * Demo Mode for NightscoutAI
 * Provides fallback functionality when dependencies fail to load
 */

// Mock TensorFlow.js for demo mode
window.createMockTensorFlow = function() {
  return {
    ready: () => Promise.resolve(),
    sequential: () => ({
      add: () => {},
      compile: () => {},
      fit: (x, y, options) => {
        // Simulate training progress
        if (options.callbacks) {
          for (let epoch = 0; epoch < Math.min(10, options.epochs || 10); epoch++) {
            setTimeout(() => {
              options.callbacks.forEach(callback => {
                if (callback.onEpochEnd) {
                  callback.onEpochEnd(epoch, {
                    loss: Math.max(0.001, 0.1 * Math.exp(-epoch * 0.1)),
                    val_loss: Math.max(0.001, 0.12 * Math.exp(-epoch * 0.1))
                  });
                }
              });
            }, epoch * 100);
          }
        }
        return Promise.resolve({ 
          history: { 
            loss: [0.1, 0.05, 0.02, 0.01],
            val_loss: [0.12, 0.06, 0.025, 0.012]
          } 
        });
      },
      predict: () => ({ 
        dataSync: () => [0.5 + (Math.random() - 0.5) * 0.1], 
        dispose: () => {} 
      }),
      save: () => Promise.resolve()
    }),
    layers: {
      lstm: () => ({}),
      dropout: () => ({}),
      dense: () => ({})
    },
    tensor3d: (data) => ({ 
      dispose: () => {},
      data: () => Promise.resolve(new Float32Array(data.flat(2)))
    }),
    tensor2d: (data) => ({ 
      dispose: () => {},
      data: () => Promise.resolve(new Float32Array(data.flat()))
    }),
    train: {
      adam: () => ({})
    },
    callbacks: {
      earlyStopping: () => ({
        onEpochEnd: (epoch, logs) => false // Never stop early in demo
      })
    }
  };
};

// Mock Chart.js for demo mode
window.createMockChart = function() {
  return function(ctx, config) {
    // Create a simple canvas-based chart
    const canvas = ctx.canvas;
    const context = ctx;
    
    return {
      data: config.data || { labels: [], datasets: [] },
      options: config.options || {},
      update: function(mode) {
        // Simple chart rendering
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        context.clearRect(0, 0, width, height);
        
        // Draw background
        context.fillStyle = '#f8f9fa';
        context.fillRect(0, 0, width, height);
        
        // Draw title
        context.fillStyle = '#333';
        context.font = '16px Arial';
        context.textAlign = 'center';
        context.fillText('Demo Mode - Chart Visualization', width / 2, 30);
        
        if (this.data.datasets && this.data.datasets.length > 0) {
          const dataset = this.data.datasets[0];
          const data = dataset.data || [];
          
          if (data.length > 0) {
            // Calculate chart area
            const chartTop = 50;
            const chartBottom = height - 50;
            const chartLeft = 50;
            const chartRight = width - 50;
            const chartWidth = chartRight - chartLeft;
            const chartHeight = chartBottom - chartTop;
            
            // Find data range
            const maxValue = Math.max(...data.filter(d => d !== null));
            const minValue = Math.min(...data.filter(d => d !== null));
            const range = maxValue - minValue || 1;
            
            // Draw axes
            context.strokeStyle = '#ddd';
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(chartLeft, chartTop);
            context.lineTo(chartLeft, chartBottom);
            context.lineTo(chartRight, chartBottom);
            context.stroke();
            
            // Draw data line
            context.strokeStyle = dataset.borderColor || '#2563eb';
            context.lineWidth = 2;
            context.beginPath();
            
            let firstPoint = true;
            data.forEach((value, index) => {
              if (value !== null) {
                const x = chartLeft + (index / (data.length - 1)) * chartWidth;
                const y = chartBottom - ((value - minValue) / range) * chartHeight;
                
                if (firstPoint) {
                  context.moveTo(x, y);
                  firstPoint = false;
                } else {
                  context.lineTo(x, y);
                }
              }
            });
            context.stroke();
            
            // Draw data points
            context.fillStyle = dataset.borderColor || '#2563eb';
            data.forEach((value, index) => {
              if (value !== null) {
                const x = chartLeft + (index / (data.length - 1)) * chartWidth;
                const y = chartBottom - ((value - minValue) / range) * chartHeight;
                
                context.beginPath();
                context.arc(x, y, 3, 0, 2 * Math.PI);
                context.fill();
              }
            });
            
            // Draw predictions if available
            if (this.data.datasets[1]) {
              const predDataset = this.data.datasets[1];
              const predData = predDataset.data || [];
              
              context.strokeStyle = predDataset.borderColor || '#dc2626';
              context.setLineDash([5, 5]);
              context.beginPath();
              
              let firstPredPoint = true;
              predData.forEach((value, index) => {
                if (value !== null) {
                  const x = chartLeft + (index / (predData.length - 1)) * chartWidth;
                  const y = chartBottom - ((value - minValue) / range) * chartHeight;
                  
                  if (firstPredPoint) {
                    context.moveTo(x, y);
                    firstPredPoint = false;
                  } else {
                    context.lineTo(x, y);
                  }
                }
              });
              context.stroke();
              context.setLineDash([]);
            }
          }
        }
        
        // Draw demo mode indicator
        context.fillStyle = 'rgba(255, 193, 7, 0.8)';
        context.fillRect(10, 10, 100, 25);
        context.fillStyle = '#000';
        context.font = '12px Arial';
        context.textAlign = 'left';
        context.fillText('DEMO MODE', 15, 27);
      }
    };
  };
};

// Demo data generator
window.generateDemoData = function() {
  const data = [];
  let bg = 120;
  
  for (let i = 0; i < 50; i++) {
    // Simulate realistic BG fluctuations
    const timeOfDay = (i * 0.5) % 24; // 30-min intervals
    const mealEffect = Math.sin(timeOfDay * Math.PI / 12) * 15; // Meal patterns
    const randomNoise = (Math.random() - 0.5) * 10;
    
    bg = Math.max(70, Math.min(300, bg + mealEffect + randomNoise));
    
    data.push([
      Math.round(bg),
      Math.random() * 3, // Insulin
      Math.random() * 40  // Carbs
    ]);
  }
  
  return data;
};

// Enhanced demo mode initialization
window.initializeDemoMode = function() {
  console.log('🎭 Initializing Demo Mode...');
  
  // Create mock dependencies
  if (window.tfLoadFailed) {
    window.tf = window.createMockTensorFlow();
    console.log('📊 Using mock TensorFlow.js');
  }
  
  if (window.chartLoadFailed) {
    window.Chart = window.createMockChart();
    console.log('📈 Using mock Chart.js');
  }
  
  // Show demo mode notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
    color: #000;
    padding: 10px;
    text-align: center;
    font-weight: bold;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  `;
  notification.innerHTML = '🎭 DEMO MODE: External dependencies unavailable. Using simulated data and functionality.';
  document.body.insertBefore(notification, document.body.firstChild);
  
  // Adjust page padding to account for notification
  document.body.style.paddingTop = '60px';
  
  return true;
};