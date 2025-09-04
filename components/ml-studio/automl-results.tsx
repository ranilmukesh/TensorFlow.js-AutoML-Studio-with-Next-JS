'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Download, BarChart3, Clock, Zap, Target } from 'lucide-react';
import { ModelResult } from '@/lib/ml-utils';

interface AutoMLResultsProps {
  results: ModelResult[];
  onExportModel: (model: any) => void;
  onSelectModel: (result: ModelResult) => void;
}

export function AutoMLResults({ results, onExportModel, onSelectModel }: AutoMLResultsProps) {
  if (!results || results.length === 0) {
    return (
      <Card className="glass-morphism p-8 text-center">
        <div className="text-muted-foreground">No AutoML results available</div>
      </Card>
    );
  }

  const bestResult = results[0]; // Results are sorted by accuracy

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Best Model Card */}
      <Card className="glass-morphism p-6 border-2 border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-semibold">Best Model</h3>
          <Badge variant="default" className="ml-auto">
            Winner
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {(bestResult.metrics.accuracy * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {bestResult.metrics.loss.toFixed(4)}
            </div>
            <div className="text-sm text-muted-foreground">Loss</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500 capitalize">
              {bestResult.modelType}
            </div>
            <div className="text-sm text-muted-foreground">Model Type</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {(bestResult.trainingTime / 1000).toFixed(1)}s
            </div>
            <div className="text-sm text-muted-foreground">Training Time</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onSelectModel(bestResult)}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-2" />
            Use This Model
          </Button>
          <Button
            variant="outline"
            onClick={() => onExportModel(bestResult.model)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* All Results */}
      <Card className="glass-morphism p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">All Results</h3>
          <Badge variant="secondary" className="ml-auto">
            {results.length} Models Tested
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                index === 0
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-muted/20 border-border hover:border-primary/20'
              }`}
              onClick={() => onSelectModel(result)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                  <div>
                    <div className="font-medium capitalize">
                      {result.modelType} Model
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.config.optimizer} optimizer, LR: {result.config.learningRate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-primary">
                      {(result.metrics.accuracy * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-500">
                      {result.metrics.loss.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground">Loss</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-500">
                      {(result.trainingTime / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>
                </div>
              </div>

              {/* Model Configuration Details */}
              <div className="mt-3 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  Batch: {result.config.batchSize}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Epochs: {result.config.epochs}
                </Badge>
                {result.config.dropoutRate && result.config.dropoutRate > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Dropout: {result.config.dropoutRate}
                  </Badge>
                )}
                {result.config.activation && (
                  <Badge variant="outline" className="text-xs">
                    {result.config.activation}
                  </Badge>
                )}
                {result.config.hiddenLayers && (
                  <Badge variant="outline" className="text-xs">
                    Layers: [{result.config.hiddenLayers.join(', ')}]
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Performance Summary */}
      <Card className="glass-morphism p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Performance Summary</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {(Math.max(...results.map(r => r.metrics.accuracy)) * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">Best Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-500">
              {(results.reduce((sum, r) => sum + r.metrics.accuracy, 0) / results.length * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-500">
              {(results.reduce((sum, r) => sum + r.trainingTime, 0) / 1000).toFixed(1)}s
            </div>
            <div className="text-sm text-muted-foreground">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-500">
              {results.length}
            </div>
            <div className="text-sm text-muted-foreground">Models Tested</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
