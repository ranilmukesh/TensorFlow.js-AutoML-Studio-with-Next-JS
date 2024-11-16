'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MLStudioTrainingProps {
  config: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    targetVariable?: string;
  };
  features: string[];
  onConfigUpdate: (config: any) => void;
  onStart: () => void;
}

export function MLStudioTraining({
  config,
  features,
  onConfigUpdate,
  onStart,
}: MLStudioTrainingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-morphism p-8">
        <h3 className="text-xl font-semibold mb-6">Model Configuration</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Target Variable</Label>
            <Select
              value={config.targetVariable}
              onValueChange={(value) =>
                onConfigUpdate({ ...config, targetVariable: value })
              }
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

          <div className="space-y-2">
            <Label>Epochs: {config.epochs}</Label>
            <Slider
              value={[config.epochs]}
              min={1}
              max={100}
              step={1}
              onValueChange={([value]) =>
                onConfigUpdate({ ...config, epochs: value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Batch Size: {config.batchSize}</Label>
            <Slider
              value={[config.batchSize]}
              min={1}
              max={128}
              step={1}
              onValueChange={([value]) =>
                onConfigUpdate({ ...config, batchSize: value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Learning Rate: {config.learningRate}</Label>
            <Slider
              value={[config.learningRate * 1000]}
              min={1}
              max={100}
              step={1}
              onValueChange={([value]) =>
                onConfigUpdate({ ...config, learningRate: value / 1000 })
              }
            />
          </div>

          <Button
            className="w-full mt-6"
            onClick={onStart}
            disabled={!config.targetVariable}
          >
            Start Training
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}