'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileType } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MLStudioUploadProps {
  onDataUploaded: (file: File) => void;
}

export function MLStudioUpload({ onDataUploaded }: MLStudioUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onDataUploaded(acceptedFiles[0]);
    }
  }, [onDataUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        {...getRootProps()}
        className={`glass-morphism p-12 text-center cursor-pointer transition-all
          ${isDragActive ? 'ring-2 ring-primary scale-[1.02]' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            {isDragActive ? (
              <FileType className="w-8 h-8 animate-pulse" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          <h3 className="text-xl font-semibold">
            {isDragActive ? 'Drop your file here' : 'Upload your dataset'}
          </h3>
          <p className="text-muted-foreground">
            Drag and drop your CSV or image files here, or click to select
          </p>
          <div className="text-sm text-muted-foreground mt-2">
            Supported formats: CSV, PNG, JPG, JPEG
          </div>
        </div>
      </Card>
    </motion.div>
  );
}