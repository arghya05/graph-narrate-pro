import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { VisualizationTabs } from '@/components/VisualizationTabs';
import { DetailedAnalysis } from '@/components/DetailedAnalysis';
import { Toaster } from '@/components/ui/toaster';

export function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentData, setCurrentData] = useState<Record<string, any>[]>([]);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

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
    <div className="min-h-screen bg-background flex flex-col">
      <Header onMenuClick={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
      
      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        
        <main className="flex-1 flex">
          {/* Left side - Chat Interface */}
          <div className="w-1/3 border-r border-border p-4">
            <ChatInterface onDataReceived={handleDataReceived} />
          </div>

          {/* Right side - Visualizations */}
          <div className="flex-1 p-4">
            <VisualizationTabs data={currentData} />
          </div>
        </main>
      </div>

      <Toaster />
    </div>
  );
}