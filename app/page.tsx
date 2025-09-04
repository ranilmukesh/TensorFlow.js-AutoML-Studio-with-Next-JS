'use client';

import { motion } from 'framer-motion';
import { Upload, Brain, Settings2, BarChart3, Zap } from 'lucide-react';
import { useState } from 'react';
import { MLStudioUpload } from '@/components/ml-studio/upload';
import { MLStudioTraining } from '@/components/ml-studio/training';
import { MLStudioResults } from '@/components/ml-studio/results';
import { MLStudioAutoML } from '@/components/ml-studio/automl';
import { AutoMLResults } from '@/components/ml-studio/automl-results';
import { TrainingVisualization } from '@/components/ml-studio/training-visualization';
import { ThemeToggle } from '@/components/theme-toggle';
import * as tf from '@tensorflow/tfjs';
import {
  createModel,
  trainModel,
  ModelConfig,
  AutoMLConfig,
  ModelResult,
  preprocessData,
  ProcessedData,
  splitFeatureTarget,
  runAutoML,
  exportModel
} from '@/lib/ml-utils';

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
    autoML: {
      maxTrials: 20,
      validationSplit: 0.2,
      earlyStoppingPatience: 5,
      crossValidationFolds: 3
    }
  });
  const [isAutoMLMode, setIsAutoMLMode] = useState(false);
  const [autoMLResults, setAutoMLResults] = useState<ModelResult[]>([]);
  const [isAutoMLRunning, setIsAutoMLRunning] = useState(false);
  const [autoMLProgress, setAutoMLProgress] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [bestResult, setBestResult] = useState<ModelResult | undefined>();

  const steps = [
    { icon: Upload, title: 'Upload Data', component: MLStudioUpload },
    { icon: isAutoMLMode ? Zap : Settings2, title: isAutoMLMode ? 'AutoML Setup' : 'Configure Model', component: isAutoMLMode ? MLStudioAutoML : MLStudioTraining },
    { icon: Brain, title: 'Training', component: TrainingVisualization },
    { icon: BarChart3, title: 'Results', component: isAutoMLMode ? AutoMLResults : MLStudioResults },
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

      if (isAutoMLMode) {
        // Run AutoML
        setIsAutoMLRunning(true);
        setAutoMLProgress(0);
        setCurrentTrial(0);
        setBestResult(undefined);

        const autoMLConfig: AutoMLConfig = {
          maxTrials: modelConfig.autoML?.maxTrials || 20,
          validationSplit: modelConfig.autoML?.validationSplit || 0.2,
          earlyStoppingPatience: modelConfig.autoML?.earlyStoppingPatience || 5,
          crossValidationFolds: modelConfig.autoML?.crossValidationFolds || 3
        };

        const results = await runAutoML(
          features,
          target,
          modelConfig,
          autoMLConfig,
          (progress, trial, bestResult) => {
            setAutoMLProgress(progress);
            setCurrentTrial(trial);
            if (bestResult) {
              setBestResult(bestResult);
            }
          }
        );

        setAutoMLResults(results);
        setIsAutoMLRunning(false);
        if (results.length > 0) {
          setModel(results[0].model); // Set the best model
        }
      } else {
        // Regular training
        const newModel = await createModel(features.shape[1], modelConfig);
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
      }

      setActiveStep(3);
    } catch (error) {
      console.error('Error during training:', error);
      setIsAutoMLRunning(false);
    }
  };

  const handleModelSelect = (result: ModelResult) => {
    setModel(result.model);
    // You could also update other state here if needed
  };

  const handleModelExport = async (model: tf.LayersModel) => {
    try {
      await exportModel(model);
    } catch (error) {
      console.error('Error exporting model:', error);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setIsAutoMLMode(!isAutoMLMode)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isAutoMLMode
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {isAutoMLMode ? 'AutoML Mode' : 'Manual Mode'}
        </button>
        <ThemeToggle />
      </div>
      
      <div className="parallax-bg" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-4"
        >
          ML Studio
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center text-muted-foreground mb-12"
        >
          {isAutoMLMode
            ? 'AI-powered AutoML will automatically find the best model for your data'
            : 'Configure and train machine learning models manually'
          }
        </motion.p>

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
            <>
              {isAutoMLMode ? (
                <MLStudioAutoML
                  config={modelConfig}
                  onConfigUpdate={setModelConfig}
                  onStart={handleTrainingStart}
                  features={processedData.features}
                  isRunning={isAutoMLRunning}
                  progress={autoMLProgress}
                  currentTrial={currentTrial}
                  maxTrials={modelConfig.autoML?.maxTrials || 20}
                  bestResult={bestResult}
                />
              ) : (
                <MLStudioTraining
                  config={modelConfig}
                  onConfigUpdate={setModelConfig}
                  onStart={handleTrainingStart}
                  features={processedData.features}
                />
              )}
            </>
          )}
          {activeStep === 2 && (
            <TrainingVisualization
              currentEpoch={isAutoMLMode ? currentTrial : trainingMetrics.currentEpoch}
              totalEpochs={isAutoMLMode ? (modelConfig.autoML?.maxTrials || 20) : modelConfig.epochs}
              metrics={{
                loss: isAutoMLMode ? (bestResult?.metrics.loss || 0) : trainingMetrics.loss,
                accuracy: isAutoMLMode ? (bestResult?.metrics.accuracy || 0) : trainingMetrics.accuracy
              }}
              isAutoML={isAutoMLMode}
              autoMLProgress={autoMLProgress}
            />
          )}
          {activeStep === 3 && (
            <>
              {isAutoMLMode && autoMLResults.length > 0 ? (
                <AutoMLResults
                  results={autoMLResults}
                  onExportModel={handleModelExport}
                  onSelectModel={handleModelSelect}
                />
              ) : (
                model && <MLStudioResults />
              )}
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
