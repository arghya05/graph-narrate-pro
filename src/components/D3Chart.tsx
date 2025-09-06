import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3ChartProps {
  data: any[];
  chartType: 'bar' | 'histogram' | 'scatter';
  xKey: string;
  yKey: string;
  width?: number;
  height?: number;
  title?: string;
}

export function D3Chart({ data, chartType, xKey, yKey, width = 500, height = 250, title }: D3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 120, bottom: 80, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    if (chartType === 'bar' || chartType === 'histogram') {
      // Create scales
      const xScale = d3
        .scaleBand()
        .domain(data.map(d => d[xKey]))
        .range([0, innerWidth])
        .padding(0.1);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, d => d[yKey]) || 0])
        .range([innerHeight, 0]);

      // Create gradient with unique ID
      const gradientId = `bar-gradient-${Math.random().toString(36).substr(2, 9)}`;
      const gradient = svg
        .append('defs')
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', innerHeight)
        .attr('x2', 0).attr('y2', 0);

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'hsl(var(--primary))')
        .attr('stop-opacity', 0.8);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'hsl(var(--primary))')
        .attr('stop-opacity', 1);

      // Create bars with animation
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d[xKey]) || 0)
        .attr('y', innerHeight)
        .attr('width', xScale.bandwidth())
        .attr('height', 0)
        .attr('fill', `url(#${gradientId})`)
        .attr('rx', 4)
        .attr('ry', 4)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
        .transition()
        .duration(800)
        .ease(d3.easeBounceOut)
        .attr('y', d => yScale(d[yKey]))
        .attr('height', d => innerHeight - yScale(d[yKey]));

      // Add hover effects
      g.selectAll('.bar')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2)) brightness(1.1)');
          
          // Add tooltip
          const tooltip = g.append('g').attr('class', 'tooltip');
          const rect = tooltip
            .append('rect')
            .attr('x', (xScale(d[xKey]) || 0) + xScale.bandwidth() / 2 - 30)
            .attr('y', yScale(d[yKey]) - 35)
            .attr('width', 60)
            .attr('height', 25)
            .attr('fill', 'hsl(var(--background))')
            .attr('stroke', 'hsl(var(--border))')
            .attr('rx', 4);
          
          tooltip
            .append('text')
            .attr('x', (xScale(d[xKey]) || 0) + xScale.bandwidth() / 2)
            .attr('y', yScale(d[yKey]) - 18)
            .attr('text-anchor', 'middle')
            .attr('fill', 'hsl(var(--foreground))')
            .style('font-size', '12px')
            .text(d[yKey]);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
          
          g.select('.tooltip').remove();
        });

      // Add axes with styling
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      // X axis with rotated labels
      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '11px')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-0.8em')
        .attr('dy', '0.15em');

      // Y axis
      g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '11px');

      // Y axis label
      if (title) {
        g.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', 0 - margin.left)
          .attr('x', 0 - (innerHeight / 2))
          .attr('dy', '1em')
          .style('text-anchor', 'middle')
          .style('fill', 'hsl(var(--muted-foreground))')
          .style('font-size', '12px')
          .style('font-weight', '500')
          .text(yKey);
      }

      // Legend
      const legendData = data.slice(0, 5); // Show legend for first 5 items
      const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth + 10}, 20)`);

      const legendItems = legend.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);

      legendItems.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', `url(#${gradientId})`)
        .attr('rx', 2);

      legendItems.append('text')
        .attr('x', 16)
        .attr('y', 6)
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('fill', 'hsl(var(--muted-foreground))')
        .text(d => String(d[xKey]).substring(0, 12) + (String(d[xKey]).length > 12 ? '...' : ''));

      // Style axis lines
      g.selectAll('.domain')
        .style('stroke', 'hsl(var(--border))');
      
      g.selectAll('.tick line')
        .style('stroke', 'hsl(var(--border))');

    } else if (chartType === 'scatter') {
      // Create scales for scatter plot
      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d[xKey]) as [number, number])
        .range([0, innerWidth]);

      const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d[yKey]) as [number, number])
        .range([innerHeight, 0]);

      // Create gradient for scatter points with unique ID
      const gradientId = `circle-gradient-${Math.random().toString(36).substr(2, 9)}`;
      const gradient = svg
        .append('defs')
        .append('radialGradient')
        .attr('id', gradientId);

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'hsl(var(--primary))')
        .attr('stop-opacity', 1);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'hsl(var(--primary))')
        .attr('stop-opacity', 0.6);

      // Add scatter points with animation
      g.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d[xKey]))
        .attr('cy', d => yScale(d[yKey]))
        .attr('r', 0)
        .attr('fill', `url(#${gradientId})`)
        .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))')
        .transition()
        .duration(600)
        .delay((d, i) => i * 20)
        .ease(d3.easeElasticOut)
        .attr('r', 4);

      // Add hover effects for scatter points
      g.selectAll('.dot')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4)
            .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))');
        });

      // Add axes
      const xAxis = d3.axisBottom(xScale);
      const yAxis = d3.axisLeft(yScale);

      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '11px');

      g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '11px');

      // Axis labels
      g.append('text')
        .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 10})`)
        .style('text-anchor', 'middle')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '12px')
        .style('font-weight', '500')
        .text(xKey);

      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (innerHeight / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '12px')
        .style('font-weight', '500')
        .text(yKey);

      // Legend for scatter plot
      const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth + 10}, 20)`);

      legend.append('circle')
        .attr('r', 6)
        .attr('fill', `url(#${gradientId})`);

      legend.append('text')
        .attr('x', 12)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('fill', 'hsl(var(--muted-foreground))')
        .text('Data Points');

      // Style axis lines
      g.selectAll('.domain')
        .style('stroke', 'hsl(var(--border))');
      
      g.selectAll('.tick line')
        .style('stroke', 'hsl(var(--border))');
    }

  }, [data, chartType, xKey, yKey, width, height]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      />
    </div>
  );
}