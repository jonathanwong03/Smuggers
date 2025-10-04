const tf = require('@tensorflow/tfjs-node');
const dataProcessor = require('./dataProcessor');

class ForecastEngine {
  constructor() {
    this.model = null;
    this.historicalData = [];
    this.maxHistoricalSize = 1000;
    this.isTraining = false;
  }

  async initializeModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [8], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'linear' })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    console.log('✓ ML Model initialized');
  }

  addHistoricalData(data) {
    this.historicalData.push(data);
    if (this.historicalData.length > this.maxHistoricalSize) {
      this.historicalData.shift();
    }
  }

  async trainModel() {
    if (this.historicalData.length < 50 || this.isTraining) {
      return;
    }

    this.isTraining = true;
    console.log('Training model with', this.historicalData.length, 'samples...');

    try {
      const features = [];
      const labels = [];

      for (let i = 0; i < this.historicalData.length - 1; i++) {
        const current = dataProcessor.prepareForPrediction(this.historicalData[i]);
        const nextAQI = this.historicalData[i + 1].aqi / 500;
        features.push(current);
        labels.push(nextAQI);
      }

      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels, [labels.length, 1]);

      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0
      });

      xs.dispose();
      ys.dispose();
      console.log('✓ Model training completed');
    } catch (error) {
      console.error('Model training error:', error.message);
    } finally {
      this.isTraining = false;
    }
  }

  async predict(currentData) {
    if (!this.model) {
      await this.initializeModel();
    }

    const normalizedData = dataProcessor.normalizeData(currentData);
    if (!normalizedData) {
      throw new Error('Unable to normalize data for prediction');
    }

    const inputFeatures = dataProcessor.prepareForPrediction(normalizedData);
    const inputTensor = tf.tensor2d([inputFeatures]);
    const prediction = this.model.predict(inputTensor);
    const predictedAQI = (await prediction.data())[0] * 500;

    inputTensor.dispose();
    prediction.dispose();

    const currentAQI = normalizedData.aqi;
    const forecast6h = Math.round(predictedAQI);
    const forecast24h = Math.round(predictedAQI * 1.05);

    return {
      current: {
        aqi: Math.round(currentAQI),
        category: dataProcessor.getAQICategory(currentAQI),
        pollutants: {
          pm25: normalizedData.pm25,
          pm10: normalizedData.pm10,
          no2: normalizedData.no2,
          o3: normalizedData.o3,
          so2: normalizedData.so2
        },
        timestamp: new Date().toISOString()
      },
      forecast_6h: {
        aqi: forecast6h,
        category: dataProcessor.getAQICategory(forecast6h),
        confidence: this.calculateConfidence(),
        timestamp: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      },
      forecast_24h: {
        aqi: forecast24h,
        category: dataProcessor.getAQICategory(forecast24h),
        confidence: this.calculateConfidence() * 0.85,
        timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  calculateConfidence() {
    const dataQuality = Math.min(this.historicalData.length / 100, 1);
    return Math.round(70 + (dataQuality * 25));
  }
}

module.exports = new ForecastEngine();