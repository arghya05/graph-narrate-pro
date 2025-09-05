import { useState } from 'react';
import { Header } from '@/components/Header';
import { ChatInterface } from '@/components/ChatInterface';
import { VisualizationTabs } from '@/components/VisualizationTabs';
import { DetailedAnalysis } from '@/components/DetailedAnalysis';
import { Toaster } from '@/components/ui/toaster';
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

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
      <div className="flex-1 bg-background border-8 border-primary rounded-xl overflow-hidden flex flex-col">
        <Header />
        
        <div className="flex-1 p-8 overflow-hidden">
          <PanelGroup direction="horizontal" className="gap-6">
            <Panel defaultSize={33} minSize={20} className="border border-primary rounded-lg overflow-hidden">
              <ChatInterface onDataReceived={handleDataReceived} />
            </Panel>
            
            <PanelResizeHandle className="w-2 bg-primary/20 hover:bg-primary/40 transition-colors rounded-full" />
            
            <Panel defaultSize={67} minSize={30} className="border border-primary rounded-lg overflow-hidden">
              <VisualizationTabs data={currentData} />
            </Panel>
          </PanelGroup>
        </div>
      </div>

      <Toaster />
    </div>
  );
}