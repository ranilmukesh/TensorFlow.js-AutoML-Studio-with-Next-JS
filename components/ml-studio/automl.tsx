'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Trophy, Clock, Target } from 'lucide-react';

interface AutoMLProps {
  config: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    targetVariable?: string;
    autoML?: {
      maxTrials: number;
      validationSplit: number;
      earlyStoppingPatience: number;
      crossValidationFolds: number;
    };
  };
  features: string[];
  onConfigUpdate: (config: any) => void;
  onStart: () => void;
  isRunning?: boolean;
  progress?: number;
  currentTrial?: number;
  maxTrials?: number;
  bestResult?: any;
}

export function MLStudioAutoML({
  config,
  features,
  onConfigUpdate,
  onStart,
  isRunning = false,
  progress = 0,
  currentTrial = 0,
  maxTrials = 20,
  bestResult
}: AutoMLProps) {
  const handleAutoMLConfigChange = (key: string, value: any) => {
    onConfigUpdate({
      ...config,
      autoML: {
        ...config.autoML,
        [key]: value
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-morphism p-8">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">AutoML Configuration</h3>
          <Badge variant="secondary" className="ml-auto">
            AI-Powered
          </Badge>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Target Variable</Label>
            <Select
              value={config.targetVariable}
              onValueChange={(value) =>
                onConfigUpdate({ ...config, targetVariable: value })
              }
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target variable" />
              </SelectTrigger>
              <SelectContent>
                {features.map((feature) => (
                  <SelectItem key={feature} value={feature}>
                    {feature}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Trials: {config.autoML?.maxTrials || 20}</Label>
              <Slider
                value={[config.autoML?.maxTrials || 20]}
                min={5}
                max={50}
                step={5}
                onValueChange={([value]) =>
                  handleAutoMLConfigChange('maxTrials', value)
                }
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label>Cross-Validation Folds: {config.autoML?.crossValidationFolds || 3}</Label>
              <Slider
                value={[config.autoML?.crossValidationFolds || 3]}
                min={2}
                max={10}
                step={1}
                onValueChange={([value]) =>
                  handleAutoMLConfigChange('crossValidationFolds', value)
                }
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Validation Split: {((config.autoML?.validationSplit || 0.2) * 100).toFixed(0)}%</Label>
            <Slider
              value={[(config.autoML?.validationSplit || 0.2) * 100]}
              min={10}
              max={40}
              step={5}
              onValueChange={([value]) =>
                handleAutoMLConfigChange('validationSplit', value / 100)
              }
              disabled={isRunning}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="early-stopping">Enable Early Stopping</Label>
            <Switch
              id="early-stopping"
              checked={config.autoML?.earlyStoppingPatience > 0}
              onCheckedChange={(checked) =>
                handleAutoMLConfigChange('earlyStoppingPatience', checked ? 5 : 0)
              }
              disabled={isRunning}
            />
          </div>

          {isRunning && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AutoML Progress</span>
                <span className="text-sm text-muted-foreground">
                  Trial {currentTrial} of {maxTrials}
                </span>
              </div>
              <Progress value={progress} className="w-full" />

              {bestResult && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Best Accuracy</div>
                      <div className="font-semibold">{(bestResult.metrics.accuracy * 100).toFixed(2)}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Model Type</div>
                      <div className="font-semibold capitalize">{bestResult.modelType}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Training Time</div>
                      <div className="font-semibold">{(bestResult.trainingTime / 1000).toFixed(1)}s</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full mt-6"
            onClick={onStart}
            disabled={!config.targetVariable || isRunning}
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Running AutoML...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start AutoML
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            AutoML will automatically test multiple model architectures, hyperparameters, and optimizers to find the best performing model for your data.
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
