import * as tf from '@tensorflow/tfjs';

export interface ModelConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  targetVariable?: string;
  modelType?: string;
  hiddenLayers?: number[];
  dropoutRate?: number;
  optimizer?: string;
  activation?: string;
}

export interface AutoMLConfig {
  maxTrials: number;
  validationSplit: number;
  earlyStoppingPatience: number;
  crossValidationFolds: number;
}

export interface ModelResult {
  model: tf.LayersModel;
  config: ModelConfig;
  metrics: {
    accuracy: number;
    loss: number;
    valAccuracy: number;
    valLoss: number;
  };
  modelType: string;
  trainingTime: number;
}

export interface ProcessedData {
  tensor: tf.Tensor;
  features: string[];
  targetTensor?: tf.Tensor;
}

export async function preprocessData(file: File): Promise<ProcessedData> {
  if (file.type.startsWith('image/')) {
    const tensor = await preprocessImage(file);
    return { tensor, features: ['image_data'] };
  } else {
    return preprocessCSV(file);
  }
}

async function preprocessImage(file: File): Promise<tf.Tensor> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();
    
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        try {
          const tensor = tf.browser.fromPixels(img)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .expandDims();
          resolve(tensor);
        } catch (error) {
          reject(error);
        }
      };
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function preprocessCSV(file: File): Promise<ProcessedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n')
          .filter(row => row.trim())
          .map(row => row.split(',').map(cell => cell.trim()));
        
        const headers = rows[0];
        const data = rows.slice(1);
        
        const cleanData = data.map(row => 
          row.map(val => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
          })
        );
        
        const tensor = tf.tensor2d(cleanData);
        resolve({ 
          tensor,
          features: headers
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function splitFeatureTarget(
  data: ProcessedData,
  targetColumn: string
): { features: tf.Tensor, target: tf.Tensor } {
  const targetIndex = data.features.indexOf(targetColumn);
  if (targetIndex === -1) {
    throw new Error(`Target column "${targetColumn}" not found in dataset`);
  }

  const tensorData = data.tensor.arraySync() as number[][];
  const features = tensorData.map(row => row.filter((_, i) => i !== targetIndex));
  const targets = tensorData.map(row => row[targetIndex]);

  return {
    features: tf.tensor2d(features),
    target: tf.tensor1d(targets)
  };
}

// Model creation functions for different architectures
export async function createSimpleModel(inputFeatures: number, config: ModelConfig): Promise<tf.LayersModel> {
  const model = tf.sequential();
  
  model.add(tf.layers.dense({
    inputShape: [inputFeatures],
    units: 32,
    activation: config.activation || 'relu'
  }));
  
  if (config.dropoutRate && config.dropoutRate > 0) {
    model.add(tf.layers.dropout({ rate: config.dropoutRate }));
  }
  
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));
  
  return model;
}

export async function createDeepModel(inputFeatures: number, config: ModelConfig): Promise<tf.LayersModel> {
  const model = tf.sequential();
  const hiddenLayers = config.hiddenLayers || [128, 64, 32];

  model.add(tf.layers.dense({
    inputShape: [inputFeatures],
    units: hiddenLayers[0],
    activation: config.activation || 'relu'
  }));

  if (config.dropoutRate && config.dropoutRate > 0) {
    model.add(tf.layers.dropout({ rate: config.dropoutRate }));
  }

  for (let i = 1; i < hiddenLayers.length; i++) {
    model.add(tf.layers.dense({
      units: hiddenLayers[i],
      activation: config.activation || 'relu'
    }));

    if (config.dropoutRate && config.dropoutRate > 0) {
      model.add(tf.layers.dropout({ rate: config.dropoutRate }));
    }
  }

  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));

  return model;
}

export async function createWideModel(inputFeatures: number, config: ModelConfig): Promise<tf.LayersModel> {
  const model = tf.sequential();

  model.add(tf.layers.dense({
    inputShape: [inputFeatures],
    units: 256,
    activation: config.activation || 'relu'
  }));

  if (config.dropoutRate && config.dropoutRate > 0) {
    model.add(tf.layers.dropout({ rate: config.dropoutRate }));
  }

  model.add(tf.layers.dense({
    units: 128,
    activation: config.activation || 'relu'
  }));

  if (config.dropoutRate && config.dropoutRate > 0) {
    model.add(tf.layers.dropout({ rate: config.dropoutRate }));
  }

  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));

  return model;
}

export async function createLinearModel(inputFeatures: number): Promise<tf.LayersModel> {
  const model = tf.sequential();

  model.add(tf.layers.dense({
    inputShape: [inputFeatures],
    units: 1,
    activation: 'sigmoid'
  }));
  
  return model;
}

export async function createModel(inputFeatures: number, config: ModelConfig): Promise<tf.LayersModel> {
  switch (config.modelType) {
    case 'simple':
      return createSimpleModel(inputFeatures, config);
    case 'deep':
      return createDeepModel(inputFeatures, config);
    case 'wide':
      return createWideModel(inputFeatures, config);
    case 'linear':
      return createLinearModel(inputFeatures);
    default:
      return createSimpleModel(inputFeatures, config);
  }
}

function getOptimizer(optimizerName: string, learningRate: number): tf.Optimizer {
  switch (optimizerName) {
    case 'adam':
      return tf.train.adam(learningRate);
    case 'sgd':
      return tf.train.sgd(learningRate);
    case 'rmsprop':
      return tf.train.rmsprop(learningRate);
    case 'adagrad':
      return tf.train.adagrad(learningRate);
    default:
      return tf.train.adam(learningRate);
  }
}

export async function trainModel(
  model: tf.LayersModel,
  features: tf.Tensor,
  target: tf.Tensor,
  config: ModelConfig,
  onEpochEnd?: (epoch: number, logs: tf.Logs) => void
): Promise<tf.History> {
  const optimizer = getOptimizer(config.optimizer || 'adam', config.learningRate);

  model.compile({
    optimizer,
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  const callbacks: any = {};
  if (onEpochEnd) {
    callbacks.onEpochEnd = onEpochEnd;
  }

  return model.fit(features, target, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: 0.2,
    callbacks
  });
}

export async function exportModel(model: tf.LayersModel): Promise<string> {
  const saveResult = await model.save('downloads://ml-studio-model');
  return saveResult.modelArtifactsInfo.dateSaved.toString();
}

export async function importModel(file: File): Promise<tf.LayersModel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const modelJSON = JSON.parse(e.target?.result as string);
        const model = await tf.loadLayersModel(tf.io.fromMemory(modelJSON));
        resolve(model);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// AutoML functionality
export function generateModelConfigurations(baseConfig: ModelConfig): ModelConfig[] {
  const configurations: ModelConfig[] = [];

  const modelTypes = ['simple', 'deep', 'wide', 'linear'];
  const learningRates = [0.001, 0.01, 0.1];
  const batchSizes = [16, 32, 64];
  const dropoutRates = [0, 0.1, 0.2, 0.3];
  const optimizers = ['adam', 'sgd', 'rmsprop'];
  const activations = ['relu', 'tanh', 'sigmoid'];
  const hiddenLayerConfigs = [
    [32],
    [64, 32],
    [128, 64, 32],
    [256, 128, 64]
  ];

  // Generate combinations (limited to prevent too many trials)
  for (const modelType of modelTypes) {
    for (const learningRate of learningRates) {
      for (const batchSize of batchSizes) {
        for (const dropoutRate of dropoutRates) {
          for (const optimizer of optimizers) {
            for (const activation of activations) {
              for (const hiddenLayers of hiddenLayerConfigs) {
                configurations.push({
                  ...baseConfig,
                  modelType,
                  learningRate,
                  batchSize,
                  dropoutRate,
                  optimizer,
                  activation,
                  hiddenLayers,
                  epochs: Math.min(baseConfig.epochs, 20) // Limit epochs for AutoML
                });

                // Limit total configurations to prevent excessive computation
                if (configurations.length >= 50) {
                  return configurations;
                }
              }
            }
          }
        }
      }
    }
  }

  return configurations;
}

export async function crossValidate(
  features: tf.Tensor,
  target: tf.Tensor,
  config: ModelConfig,
  folds: number = 5
): Promise<{ accuracy: number; loss: number }> {
  const dataSize = features.shape[0];
  const foldSize = Math.floor(dataSize / folds);
  let totalAccuracy = 0;
  let totalLoss = 0;

  for (let fold = 0; fold < folds; fold++) {
    const startIdx = fold * foldSize;
    const endIdx = fold === folds - 1 ? dataSize : (fold + 1) * foldSize;

    // Create validation set
    const valFeatures = features.slice([startIdx, 0], [endIdx - startIdx, -1]);
    const valTarget = target.slice([startIdx], [endIdx - startIdx]);

    // Create training set (excluding validation fold)
    const trainIndices = [];
    for (let i = 0; i < dataSize; i++) {
      if (i < startIdx || i >= endIdx) {
        trainIndices.push(i);
      }
    }

    const trainFeatures = tf.gather(features, trainIndices);
    const trainTarget = tf.gather(target, trainIndices);

    // Train model
    const model = await createModel(features.shape[1], config);
    await trainModel(model, trainFeatures, trainTarget, config);

    // Evaluate on validation set
    const evaluation = model.evaluate(valFeatures, valTarget) as tf.Scalar[];
    const loss = await evaluation[0].data();
    const accuracy = await evaluation[1].data();

    totalLoss += loss[0];
    totalAccuracy += accuracy[0];

    // Clean up tensors
    model.dispose();
    valFeatures.dispose();
    valTarget.dispose();
    trainFeatures.dispose();
    trainTarget.dispose();
    evaluation[0].dispose();
    evaluation[1].dispose();
  }

  return {
    accuracy: totalAccuracy / folds,
    loss: totalLoss / folds
  };
}

export async function runAutoML(
  features: tf.Tensor,
  target: tf.Tensor,
  baseConfig: ModelConfig,
  autoMLConfig: AutoMLConfig,
  onProgress?: (progress: number, currentTrial: number, bestResult?: ModelResult) => void
): Promise<ModelResult[]> {
  const configurations = generateModelConfigurations(baseConfig);
  const results: ModelResult[] = [];
  let bestResult: ModelResult | undefined;

  // Limit trials to maxTrials
  const trialsToRun = Math.min(configurations.length, autoMLConfig.maxTrials);

  for (let i = 0; i < trialsToRun; i++) {
    const config = configurations[i];
    const startTime = Date.now();

    try {
      // Use cross-validation for better evaluation
      const cvResults = await crossValidate(features, target, config, autoMLConfig.crossValidationFolds);

      // Train final model on full dataset
      const model = await createModel(features.shape[1], config);
      const history = await trainModel(model, features, target, config);

      const finalEpoch = history.history.loss.length - 1;
      const result: ModelResult = {
        model,
        config,
        metrics: {
          accuracy: cvResults.accuracy,
          loss: cvResults.loss,
          valAccuracy: history.history.val_acc ? history.history.val_acc[finalEpoch] : cvResults.accuracy,
          valLoss: history.history.val_loss ? history.history.val_loss[finalEpoch] : cvResults.loss
        },
        modelType: config.modelType || 'simple',
        trainingTime: Date.now() - startTime
      };

      results.push(result);

      // Update best result
      if (!bestResult || result.metrics.accuracy > bestResult.metrics.accuracy) {
        bestResult = result;
      }

      // Report progress
      if (onProgress) {
        onProgress((i + 1) / trialsToRun * 100, i + 1, bestResult);
      }

    } catch (error) {
      console.error(`Error training model ${i + 1}:`, error);
    }
  }

  // Sort results by accuracy (descending)
  results.sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);

  return results;
}
