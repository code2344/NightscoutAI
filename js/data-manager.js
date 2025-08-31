/**
 * Enhanced Data Management for Nightscout API
 * Handles data fetching, validation, and preprocessing
 */

class DataManager {
  constructor(config = CONFIG.nightscout) {
    this.config = config;
    this.cache = [];
    this.lastFetch = null;
    this.isOnline = navigator.onLine;
    
    // Monitor online status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Connection restored');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Connection lost - using cached data');
    });
  }
  
  /**
   * Fetch data from Nightscout API with enhanced error handling
   */
  async fetchData(maxRetries = 3) {
    if (!this.isOnline && this.cache.length > 0) {
      console.log('Offline mode - using cached data');
      return this.cache;
    }
    
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const url = `${this.config.url}${this.config.apiPath}`;
        console.log(`Fetching data from: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const processedData = this.validateAndProcessData(data);
        
        // Update cache and timestamp
        this.cache = processedData;
        this.lastFetch = new Date();
        
        console.log(`Successfully fetched ${processedData.length} data points`);
        return processedData;
        
      } catch (error) {
        retries++;
        console.error(`Fetch attempt ${retries} failed:`, error.message);
        
        if (retries >= maxRetries) {
          if (this.cache.length > 0) {
            console.log('Using cached data due to fetch failure');
            return this.cache;
          }
          
          // In demo mode, generate synthetic data
          if (window.generateDemoData && (window.tfLoadFailed || window.chartLoadFailed)) {
            console.log('Generating demo data due to fetch failure');
            const demoData = window.generateDemoData();
            this.cache = demoData;
            this.lastFetch = new Date();
            return demoData;
          }
          
          throw new Error(`Failed to fetch data after ${maxRetries} retries: ${error.message}`);
        }
        
        // Exponential backoff
        await this.delay(1000 * Math.pow(2, retries));
      }
    }
  }
  
  /**
   * Validate and process raw Nightscout data
   */
  validateAndProcessData(rawData) {
    if (!Array.isArray(rawData)) {
      throw new Error('Invalid data format: expected array');
    }
    
    const processedData = rawData
      .filter(entry => this.isValidEntry(entry))
      .map(entry => [
        this.sanitizeBG(entry.sgv || entry.bg),
        this.sanitizeInsulin(entry.insulin || 0),
        this.sanitizeCarbs(entry.carbs || 0),
        new Date(entry.date || entry.dateString).getTime()
      ])
      .sort((a, b) => a[3] - b[3]) // Sort by timestamp
      .map(entry => [entry[0], entry[1], entry[2]]); // Remove timestamp for model
    
    console.log(`Processed ${processedData.length} valid entries from ${rawData.length} raw entries`);
    return processedData;
  }
  
  /**
   * Validate individual data entry
   */
  isValidEntry(entry) {
    // Check for required fields
    const bgValue = entry.sgv || entry.bg;
    if (!bgValue || isNaN(bgValue)) return false;
    
    // Check BG range
    if (bgValue < CONFIG.data.bgMin || bgValue > CONFIG.data.bgMax) return false;
    
    // Check for valid timestamp
    const timestamp = entry.date || entry.dateString;
    if (!timestamp || isNaN(new Date(timestamp).getTime())) return false;
    
    return true;
  }
  
  /**
   * Sanitize blood glucose value
   */
  sanitizeBG(value) {
    const bg = parseFloat(value);
    return Math.max(CONFIG.data.bgMin, Math.min(CONFIG.data.bgMax, bg));
  }
  
  /**
   * Sanitize insulin value
   */
  sanitizeInsulin(value) {
    const insulin = parseFloat(value) || 0;
    return Math.max(0, Math.min(50, insulin)); // Cap at 50 units
  }
  
  /**
   * Sanitize carbs value
   */
  sanitizeCarbs(value) {
    const carbs = parseFloat(value) || 0;
    return Math.max(0, Math.min(200, carbs)); // Cap at 200g
  }
  
  /**
   * Generate synthetic data for testing when API is unavailable
   */
  generateSyntheticData(count = 100) {
    console.log('Generating synthetic data for testing');
    
    const data = [];
    let baseBG = 120; // Starting blood glucose
    
    for (let i = 0; i < count; i++) {
      // Simulate realistic BG patterns
      const time = i * 5; // 5-minute intervals
      const dailyCycle = Math.sin((time / 60) * 2 * Math.PI / 24) * 20; // Daily rhythm
      const noise = (Math.random() - 0.5) * 10; // Random variation
      
      let insulin = 0;
      let carbs = 0;
      
      // Simulate meals and insulin
      if (i % 36 === 0) { // Every 3 hours
        carbs = Math.random() * 60 + 20; // 20-80g carbs
        insulin = carbs * 0.1 + Math.random() * 2; // Insulin ratio
      }
      
      baseBG = Math.max(70, Math.min(300, baseBG + dailyCycle + noise + (carbs * 0.5) - (insulin * 5)));
      
      data.push([
        Math.round(baseBG),
        Math.round(insulin * 10) / 10,
        Math.round(carbs)
      ]);
    }
    
    return data;
  }
  
  /**
   * Get data statistics
   */
  getDataStats(data) {
    if (!data || data.length === 0) {
      return { count: 0, bgAvg: 0, bgMin: 0, bgMax: 0 };
    }
    
    const bgValues = data.map(d => d[0]);
    
    return {
      count: data.length,
      bgAvg: Math.round(bgValues.reduce((a, b) => a + b, 0) / bgValues.length),
      bgMin: Math.min(...bgValues),
      bgMax: Math.max(...bgValues),
      insulinTotal: data.reduce((sum, d) => sum + d[1], 0),
      carbsTotal: data.reduce((sum, d) => sum + d[2], 0),
      lastUpdate: this.lastFetch
    };
  }
  
  /**
   * Check if data needs refresh
   */
  needsRefresh() {
    if (!this.lastFetch) return true;
    
    const timeSinceLastFetch = Date.now() - this.lastFetch.getTime();
    return timeSinceLastFetch > this.config.updateInterval;
  }
  
  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache = [];
    this.lastFetch = null;
    console.log('Data cache cleared');
  }
  
  /**
   * Export data for analysis
   */
  exportData(format = 'json') {
    const stats = this.getDataStats(this.cache);
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        source: this.config.url,
        stats: stats
      },
      data: this.cache
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'csv':
        const header = 'BG,Insulin,Carbs\\n';
        const rows = this.cache.map(row => row.join(',')).join('\\n');
        return header + rows;
      default:
        return exportData;
    }
  }
}