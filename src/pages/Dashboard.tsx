import { useState } from 'react';
import { Header } from '@/components/Header';
import { ChatInterface } from '@/components/ChatInterface';
import { VisualizationTabs } from '@/components/VisualizationTabs';
import { DetailedAnalysis } from '@/components/DetailedAnalysis';
import { Toaster } from '@/components/ui/toaster';

export function Dashboard() {
  const [currentData, setCurrentData] = useState<Record<string, any>[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const handleDataReceived = (data: Record<string, any>[]) => {
    setCurrentData(data);
  };

  const handleChartClick = (chartTitle: string) => {
    setSelectedChart(chartTitle);
  };

  const closeDetailedAnalysis = () => {
    setSelectedChart(null);
  };

  if (selectedChart) {
    return (
      <DetailedAnalysis
        open={true}
        onOpenChange={closeDetailedAnalysis}
        title={selectedChart}
        data={currentData}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-200 p-4 flex flex-col overflow-hidden">
      <div className="flex-1 bg-background border-8 border-black rounded-xl overflow-hidden flex flex-col">
        <Header />
        
        <div className="flex-1 flex p-8 gap-6 overflow-hidden">
          <div className="w-1/3 border border-primary rounded-lg overflow-hidden flex flex-col">
            <ChatInterface onDataReceived={handleDataReceived} />
          </div>

          <div className="flex-1 border border-primary rounded-lg overflow-hidden">
            <VisualizationTabs data={currentData} />
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}