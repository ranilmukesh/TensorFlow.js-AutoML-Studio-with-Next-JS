'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Zap } from 'lucide-react';

interface TrainingVisualizationProps {
  currentEpoch: number;
  totalEpochs: number;
  metrics: {
    loss: number;
    accuracy: number;
  };
  isAutoML?: boolean;
  autoMLProgress?: number;
}

export function TrainingVisualization({ 
  currentEpoch, 
  totalEpochs, 
  metrics,
  isAutoML = false,
  autoMLProgress = 0
}: TrainingVisualizationProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isAutoML) {
      setProgress(autoMLProgress);
    } else {
      setProgress((currentEpoch / totalEpochs) * 100);
    }
  }, [currentEpoch, totalEpochs, isAutoML, autoMLProgress]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-morphism p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            {isAutoML ? 'AutoML Progress' : 'Training Progress'}
          </h3>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            {isAutoML ? (
              <Zap className="w-6 h-6 text-primary" />
            ) : (
              <Brain className="w-6 h-6 text-primary" />
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground mt-2">
              {isAutoML
                ? `Trial ${currentEpoch} of ${totalEpochs}`
                : `Epoch ${currentEpoch} of ${totalEpochs}`
              }
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isAutoML ? 'Best Loss' : 'Loss'}
              </p>
              <p className="text-2xl font-bold">{metrics.loss.toFixed(4)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isAutoML ? 'Best Accuracy' : 'Accuracy'}
              </p>
              <p className="text-2xl font-bold">
                {(metrics.accuracy * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          {isAutoML && (
            <div className="text-center text-sm text-muted-foreground">
              AutoML is testing different model architectures and hyperparameters to find the best performing model.
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
