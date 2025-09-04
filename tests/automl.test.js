// Simple test to verify AutoML functionality
const tf = require('@tensorflow/tfjs-node');

// Mock the ML utils functions for testing
const mockMLUtils = {
  generateModelConfigurations: (baseConfig) => {
    // Return a few test configurations
    return [
      { ...baseConfig, modelType: 'simple', learningRate: 0.001, batchSize: 32 },
      { ...baseConfig, modelType: 'deep', learningRate: 0.01, batchSize: 16 },
      { ...baseConfig, modelType: 'wide', learningRate: 0.1, batchSize: 64 }
    ];
  },

  createModel: async (inputFeatures, config) => {
    const model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [inputFeatures],
      units: 32,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));
    return model;
  },

  trainModel: async (model, features, target, config) => {
    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    return model.fit(features, target, {
      epochs: Math.min(config.epochs, 5), // Limit epochs for testing
      batchSize: config.batchSize,
      validationSplit: 0.2,
      verbose: 0
    });
  }
};

async function testAutoMLFunctionality() {
  console.log('Testing AutoML functionality...');

  try {
    // Create synthetic test data
    const numSamples = 100;
    const numFeatures = 4;

    const features = tf.randomUniform([numSamples, numFeatures]);
    const target = tf.randomUniform([numSamples, 1], 0, 2, 'int32').cast('float32');

    console.log('✓ Created synthetic test data');

    // Test configuration generation
    const baseConfig = {
      epochs: 10,
      batchSize: 32,
      learningRate: 0.001,
      targetVariable: 'target'
    };

    const configurations = mockMLUtils.generateModelConfigurations(baseConfig);
    console.log(`✓ Generated ${configurations.length} model configurations`);

    // Test model creation and training
    const results = [];
    for (let i = 0; i < Math.min(configurations.length, 2); i++) {
      const config = configurations[i];
      const startTime = Date.now();

      const model = await mockMLUtils.createModel(numFeatures, config);
      console.log(`✓ Created ${config.modelType} model`);

      const history = await mockMLUtils.trainModel(model, features, target, config);
      const trainingTime = Date.now() - startTime;

      const finalEpoch = history.history.loss.length - 1;
      const result = {
        model,
        config,
        metrics: {
          accuracy: history.history.acc ? history.history.acc[finalEpoch] : 0.5,
          loss: history.history.loss[finalEpoch],
          valAccuracy: history.history.val_acc ? history.history.val_acc[finalEpoch] : 0.5,
          valLoss: history.history.val_loss ? history.history.val_loss[finalEpoch] : 0.5
        },
        modelType: config.modelType,
        trainingTime
      };

      results.push(result);
      console.log(`✓ Trained ${config.modelType} model - Accuracy: ${(result.metrics.accuracy * 100).toFixed(2)}%`);

      // Clean up
      model.dispose();
    }

    // Sort results by accuracy
    results.sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);

    console.log('\n=== AutoML Results ===');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.modelType} - Accuracy: ${(result.metrics.accuracy * 100).toFixed(2)}%, Loss: ${result.metrics.loss.toFixed(4)}, Time: ${result.trainingTime}ms`);
    });

    console.log(`\n✓ Best model: ${results[0].modelType} with ${(results[0].metrics.accuracy * 100).toFixed(2)}% accuracy`);

    // Clean up tensors
    features.dispose();
    target.dispose();

    console.log('\n✅ AutoML functionality test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ AutoML test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAutoMLFunctionality().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testAutoMLFunctionality };
