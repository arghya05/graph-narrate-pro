import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3ChartProps {
  data: any[];
  chartType: 'bar' | 'histogram' | 'scatter';
  xKey: string;
  yKey: string;
  width?: number;
  height?: number;
}

export function D3Chart({ data, chartType, xKey, yKey, width = 400, height = 200 }: D3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
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

      // Create gradient
      const gradient = svg
        .append('defs')
        .append('linearGradient')
        .attr('id', 'bar-gradient')
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
        .attr('fill', 'url(#bar-gradient)')
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

      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '10px');

      g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '10px');

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

      // Create gradient for scatter points
      const gradient = svg
        .append('defs')
        .append('radialGradient')
        .attr('id', 'circle-gradient');

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
        .attr('fill', 'url(#circle-gradient)')
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
        .style('font-size', '10px');

      g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '10px');

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