'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function MLStudioResults() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-morphism p-8">
        <h3 className="text-xl font-semibold mb-6">Model Performance</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Training Accuracy</span>
              <span>95%</span>
            </div>
            <Progress value={95} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Validation Accuracy</span>
              <span>92%</span>
            </div>
            <Progress value={92} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Test Accuracy</span>
              <span>91%</span>
            </div>
            <Progress value={91} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}