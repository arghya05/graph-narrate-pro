import { DrillDownVisualization } from './DrillDownVisualization';

interface VisualizationTabsProps {
  data: Record<string, any>[];
}

export function VisualizationTabs({ data }: VisualizationTabsProps) {
  return <DrillDownVisualization data={data} />;
}