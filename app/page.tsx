'use client';

import { motion } from 'framer-motion';
import { Upload, Brain, Settings2, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { MLStudioUpload } from '@/components/ml-studio/upload';
import { MLStudioTraining } from '@/components/ml-studio/training';
import { MLStudioResults } from '@/components/ml-studio/results';
import { TrainingVisualization } from '@/components/ml-studio/training-visualization';
import { ThemeToggle } from '@/components/theme-toggle';
import * as tf from '@tensorflow/tfjs';
import { createModel, trainModel, ModelConfig, preprocessData, ProcessedData, splitFeatureTarget } from '@/lib/ml-utils';

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [trainingMetrics, setTrainingMetrics] = useState({
    currentEpoch: 0,
    loss: 0,
    accuracy: 0
  });
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    epochs: 10,
    batchSize: 32,
    learningRate: 0.001,
  });

  const steps = [
    { icon: Upload, title: 'Upload Data', component: MLStudioUpload },
    { icon: Settings2, title: 'Configure Model', component: MLStudioTraining },
    { icon: Brain, title: 'Training', component: TrainingVisualization },
    { icon: BarChart3, title: 'Results', component: MLStudioResults },
  ];

  const handleFileUploaded = async (file: File) => {
    try {
      const data = await preprocessData(file);
      setProcessedData(data);
      setActiveStep(1);
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  const handleTrainingStart = async () => {
    if (!processedData || !modelConfig.targetVariable) return;

    try {
      setActiveStep(2);
      const { features, target } = splitFeatureTarget(processedData, modelConfig.targetVariable);
      const newModel = await createModel(features.shape[1]);
      setModel(newModel);

      await trainModel(
        newModel,
        features,
        target,
        modelConfig,
        (epoch, logs) => {
          setTrainingMetrics({
            currentEpoch: epoch + 1,
            loss: logs.loss,
            accuracy: logs.acc
          });
        }
      );

      setActiveStep(3);
    } catch (error) {
      console.error('Error during training:', error);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className="parallax-bg" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-12"
        >
          ML Studio
        </motion.h1>

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-morphism rounded-full p-4 cursor-pointer transition-all
                    ${activeStep === index ? 'ring-2 ring-primary' : 'opacity-70'}`}
                  onClick={() => setActiveStep(index)}
                >
                  <step.icon className="w-6 h-6" />
                </motion.div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {activeStep === 0 && (
            <MLStudioUpload onDataUploaded={handleFileUploaded} />
          )}
          {activeStep === 1 && processedData && (
            <MLStudioTraining
              config={modelConfig}
              onConfigUpdate={setModelConfig}
              onStart={handleTrainingStart}
              features={processedData.features}
            />
          )}
          {activeStep === 2 && (
            <TrainingVisualization
              currentEpoch={trainingMetrics.currentEpoch}
              totalEpochs={modelConfig.epochs}
              metrics={{
                loss: trainingMetrics.loss,
                accuracy: trainingMetrics.accuracy
              }}
            />
          )}
          {activeStep === 3 && model && <MLStudioResults />}
        </motion.div>
      </div>
    </main>
  );
}