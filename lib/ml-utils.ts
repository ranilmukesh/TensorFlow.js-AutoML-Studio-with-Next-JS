import * as tf from '@tensorflow/tfjs';

export interface ModelConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  targetVariable?: string;
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

export async function createModel(inputFeatures: number): Promise<tf.LayersModel> {
  const model = tf.sequential();
  
  model.add(tf.layers.dense({
    inputShape: [inputFeatures],
    units: 64,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid'
  }));
  
  return model;
}

export async function trainModel(
  model: tf.LayersModel,
  features: tf.Tensor,
  target: tf.Tensor,
  config: ModelConfig,
  onEpochEnd: (epoch: number, logs: tf.Logs) => void
): Promise<tf.History> {
  model.compile({
    optimizer: tf.train.adam(config.learningRate),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  return model.fit(features, target, {
    epochs: config.epochs,
    batchSize: config.batchSize,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd
    }
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