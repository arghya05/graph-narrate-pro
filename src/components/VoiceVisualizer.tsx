import React from 'react';
import { Card } from '@/components/ui/card';

interface VoiceVisualizerProps {
  isRecording: boolean;
  audioData: number[];
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isRecording,
  audioData,
}) => {
  return (
    <Card className="p-4 bg-accent">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-primary rounded-full transition-all duration-200 ${
                isRecording ? 'h-8 animate-pulse' : 'h-2'
              }`}
              style={{
                animationDelay: `${i * 0.1}s`,
                height: isRecording 
                  ? `${Math.random() * 20 + 10}px` 
                  : '8px'
              }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {isRecording ? 'Recording... Speak now' : 'Ready to record'}
        </span>
        {isRecording && (
          <div className="ml-auto">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </Card>
  );
};