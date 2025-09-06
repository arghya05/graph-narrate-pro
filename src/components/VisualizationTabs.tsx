import { DrillDownVisualization } from './DrillDownVisualization';

interface VisualizationTabsProps {
  data: Record<string, any>[];
  onChartClick?: (chartTitle: string) => void;
}

export function VisualizationTabs({ data, onChartClick }: VisualizationTabsProps) {
  return <DrillDownVisualization data={data} onChartClick={onChartClick} />;
}