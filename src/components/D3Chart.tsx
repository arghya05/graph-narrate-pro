import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface D3ChartProps {
  data: any[];
  chartType: 'bar' | 'line' | 'scatter' | 'pie' | 'histogram' | 'box' | 'heatmap' | 'area' | 'violin' | 'sunburst' | 'treemap' | 'multi-line';
  xKey: string;
  yKey: string;
  width?: number;
  height?: number;
  title?: string;
}

export function D3Chart({ data, chartType, xKey, yKey, width = 500, height = 250, title }: D3ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;

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

      // Create gradient with unique ID based on chart
      const gradientId = `bar-gradient-${chartId}`;
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

      // Add axes with styling - reduced ticks (max 5)
      const maxTicks = Math.min(5, data.length);
      const xAxis = d3.axisBottom(xScale).ticks(maxTicks);
      const yAxis = d3.axisLeft(yScale).ticks(5);

      // X axis with rotated labels
      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '7px')
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
        .style('font-size', '7px');

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

      // Create gradient for scatter points with unique ID based on chart
      const gradientId = `circle-gradient-${chartId}`;
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

      // Add axes - reduced ticks (max 5)
      const xAxis = d3.axisBottom(xScale).ticks(5);
      const yAxis = d3.axisLeft(yScale).ticks(5);

      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '7px');

      g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '7px');

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

    } else if (chartType === 'multi-line') {
      // Multi-line chart implementation
      const allXValues = data.flatMap((series: any) => series.data.map((d: any) => d.x));
      const allYValues = data.flatMap((series: any) => series.data.map((d: any) => d.y));

      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(allXValues) as [number, number])
        .range([0, innerWidth]);

      const yScale = d3
        .scaleLinear()
        .domain(d3.extent(allYValues) as [number, number])
        .range([innerHeight, 0]);

      // Create line generator
      const line = d3
        .line<any>()
        .x((d: any) => xScale(d.x))
        .y((d: any) => yScale(d.y))
        .curve(d3.curveMonotoneX);

      // Color scale for different lines
      const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

      // Draw lines for each series
      data.forEach((series: any, index: number) => {
        const path = g
          .append('path')
          .datum(series.data)
          .attr('fill', 'none')
          .attr('stroke', series.color || colorScale(index.toString()))
          .attr('stroke-width', 2.5)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')
          .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))')
          .attr('d', line);

        // Animate line drawing
        const totalLength = path.node()?.getTotalLength() || 0;
        path
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1000)
          .delay(index * 200)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0);

        // Add data points for each series
        g.selectAll(`.dots-${index}`)
          .data(series.data)
          .enter()
          .append('circle')
          .attr('class', `dots-${index}`)
          .attr('cx', (d: any) => xScale(d.x))
          .attr('cy', (d: any) => yScale(d.y))
          .attr('r', 0)
          .attr('fill', series.color || colorScale(index.toString()))
          .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))')
          .transition()
          .duration(400)
          .delay((d: any, i: number) => index * 200 + i * 30)
          .ease(d3.easeElasticOut)
          .attr('r', 3);
      });

      // Add interactive legend
      const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth + 10}, 20)`);

      const legendItems = legend.selectAll('.legend-item')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d: any, i: number) => `translate(0, ${i * 20})`)
        .style('cursor', 'pointer');

      legendItems.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 6)
        .attr('y2', 6)
        .attr('stroke', (d: any, i: number) => d.color || colorScale(i.toString()))
        .attr('stroke-width', 3);

      legendItems.append('text')
        .attr('x', 20)
        .attr('y', 6)
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('fill', 'hsl(var(--muted-foreground))')
        .text((d: any) => d.name);

      // Add axes
      const xAxis = d3.axisBottom(xScale).ticks(6);
      const yAxis = d3.axisLeft(yScale).ticks(6);

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

    } else if (chartType === 'line') {
      // Create scales for line chart
      const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d, i) => i) as [number, number])
        .range([0, innerWidth]);

      const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d[yKey]) as [number, number])
        .range([innerHeight, 0]);

      // Create gradient for line with unique ID based on chart
      const gradientId = `line-gradient-${chartId}`;
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
        .attr('stop-opacity', 0.3);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'hsl(var(--primary))')
        .attr('stop-opacity', 0.8);

      // Create line generator
      const line = d3
        .line<any>()
        .x((d, i) => xScale(i))
        .y(d => yScale(d[yKey]))
        .curve(d3.curveMonotoneX);

      // Add line path with animation
      const path = g
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'hsl(var(--primary))')
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
        .attr('d', line);

      // Animate line drawing
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1200)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);

      // Add data points
      g.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', (d, i) => xScale(i))
        .attr('cy', d => yScale(d[yKey]))
        .attr('r', 0)
        .attr('fill', 'hsl(var(--primary))')
        .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))')
        .transition()
        .duration(600)
        .delay((d, i) => i * 50)
        .ease(d3.easeElasticOut)
        .attr('r', 4);

      // Add hover effects for data points
      g.selectAll('.dot')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
          
          // Add tooltip
          const tooltip = g.append('g').attr('class', 'tooltip');
          const xPos = Number(d3.select(this).attr('cx'));
          const yPos = Number(d3.select(this).attr('cy'));
          
          tooltip
            .append('rect')
            .attr('x', xPos - 30)
            .attr('y', yPos - 35)
            .attr('width', 60)
            .attr('height', 25)
            .attr('fill', 'hsl(var(--background))')
            .attr('stroke', 'hsl(var(--border))')
            .attr('rx', 4);
          
          tooltip
            .append('text')
            .attr('x', xPos)
            .attr('y', yPos - 18)
            .attr('text-anchor', 'middle')
            .attr('fill', 'hsl(var(--foreground))')
            .style('font-size', '12px')
            .text(d[yKey]);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4)
            .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))');
          
          g.select('.tooltip').remove();
        });

      // Add axes with limited ticks (max 5)
      const maxTicks = Math.min(5, data.length);
      const xAxis = d3.axisBottom(xScale).ticks(maxTicks).tickFormat((d, i) => {
        const dataIndex = Math.floor(Number(d));
        return data[dataIndex] ? String(data[dataIndex][xKey]).substring(0, 8) : '';
      });
      const yAxis = d3.axisLeft(yScale).ticks(5);

      // X axis
      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '7px')
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
        .style('font-size', '7px');

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

      // Legend for line chart
      const legend = g.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${innerWidth + 10}, 20)`);

      legend.append('line')
        .attr('x1', 0)
        .attr('y1', 6)
        .attr('x2', 12)
        .attr('y2', 6)
        .attr('stroke', 'hsl(var(--primary))')
        .attr('stroke-width', 3);

      legend.append('text')
        .attr('x', 16)
        .attr('y', 6)
        .attr('dy', '0.35em')
        .style('font-size', '10px')
        .style('fill', 'hsl(var(--muted-foreground))')
        .text(title || 'Data Trend');

      // Style axis lines
      g.selectAll('.domain')
        .style('stroke', 'hsl(var(--border))');
      
      g.selectAll('.tick line')
        .style('stroke', 'hsl(var(--border))');

    } else if (chartType === 'area') {
      // Create scales for area chart
      const xScale = d3
        .scaleLinear()
        .domain([0, data.length - 1])
        .range([0, innerWidth]);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, d => d[yKey]) || 0])
        .range([innerHeight, 0]);

      // Create gradient for area fill
      const gradientId = `area-gradient-${chartId}`;
      const gradient = svg
        .append('defs')
        .append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0).attr('y1', 0)
        .attr('x2', 0).attr('y2', innerHeight);

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'hsl(var(--primary))')
        .attr('stop-opacity', 0.8);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'hsl(var(--primary))')
        .attr('stop-opacity', 0.1);

      // Create area generator
      const area = d3
        .area<any>()
        .x((d, i) => xScale(i))
        .y0(innerHeight)
        .y1(d => yScale(d[yKey]))
        .curve(d3.curveMonotoneX);

      // Create line generator for top edge
      const line = d3
        .line<any>()
        .x((d, i) => xScale(i))
        .y(d => yScale(d[yKey]))
        .curve(d3.curveMonotoneX);

      // Add area path with animation
      const areaPath = g
        .append('path')
        .datum(data)
        .attr('fill', `url(#${gradientId})`)
        .attr('stroke', 'none')
        .attr('d', area);

      // Add line path on top
      const linePath = g
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'hsl(var(--primary))')
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line);

      // Add data points
      g.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', (d, i) => xScale(i))
        .attr('cy', d => yScale(d[yKey]))
        .attr('r', 3)
        .attr('fill', 'hsl(var(--primary))')
        .style('opacity', 0)
        .transition()
        .delay((d, i) => i * 50)
        .duration(500)
        .style('opacity', 1);

      // Add hover effects
      g.selectAll('.dot')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 5)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');
          
          // Add tooltip
          const tooltip = g.append('g').attr('class', 'tooltip');
          const rect = tooltip
            .append('rect')
            .attr('x', xScale(data.indexOf(d)) - 30)
            .attr('y', yScale(d[yKey]) - 35)
            .attr('width', 60)
            .attr('height', 25)
            .attr('fill', 'hsl(var(--background))')
            .attr('stroke', 'hsl(var(--border))')
            .attr('rx', 4);
          
          tooltip
            .append('text')
            .attr('x', xScale(data.indexOf(d)))
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
            .attr('r', 3)
            .style('filter', 'none');
          
          g.select('.tooltip').remove();
        });

      // Add axes with limited ticks (max 5)
      const maxTicks = Math.min(5, data.length);
      const xAxis = d3.axisBottom(xScale).ticks(maxTicks).tickFormat((d, i) => {
        const dataIndex = Math.floor(Number(d));
        return data[dataIndex] ? String(data[dataIndex][xKey]).substring(0, 8) : '';
      });
      const yAxis = d3.axisLeft(yScale).ticks(5);

      // X axis
      g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('fill', 'hsl(var(--muted-foreground))')
        .style('font-size', '7px')
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
        .style('font-size', '7px');

      // Style axis lines
      g.selectAll('.domain')
        .style('stroke', 'hsl(var(--border))');
      
      g.selectAll('.tick line')
        .style('stroke', 'hsl(var(--border))');

    } else if (chartType === 'pie') {
      // Create pie chart
      const radius = Math.min(innerWidth, innerHeight) / 2;
      const centerX = innerWidth / 2;
      const centerY = innerHeight / 2;

      // Move group to center
      g.attr('transform', `translate(${margin.left + centerX},${margin.top + centerY})`);

      // Create color scale
      const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d[xKey]))
        .range([
          'hsl(var(--primary))',
          'hsl(var(--accent))',
          'hsl(262 83% 45%)',
          'hsl(262 83% 65%)',
          'hsl(262 83% 75%)',
          'hsl(220 14.3% 75%)',
          'hsl(220 14.3% 85%)',
          'hsl(262 50% 50%)',
          'hsl(262 50% 60%)',
          'hsl(262 50% 70%)'
        ]);

      // Create pie generator
      const pie = d3.pie<any>()
        .value(d => d[yKey])
        .sort(null);

      // Create arc generator
      const arc = d3.arc<any>()
        .innerRadius(radius * 0.3)
        .outerRadius(radius * 0.8);

      const outerArc = d3.arc<any>()
        .innerRadius(radius * 0.9)
        .outerRadius(radius * 0.9);

      // Generate pie data
      const pieData = pie(data);

      // Create pie slices
      const slices = g.selectAll('.slice')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'slice');

      // Add paths
      slices.append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data[xKey]) as string)
        .style('stroke', 'white')
        .style('stroke-width', 2)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
        .transition()
        .duration(800)
        .attrTween('d', function(d: any) {
          const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
          return function(t: number) {
            return arc(interpolate(t));
          };
        });

      // Add hover effects
      slices.select('path')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2)) brightness(1.1)');
          
          // Add tooltip
          const tooltip = g.append('g').attr('class', 'tooltip');
          tooltip
            .append('rect')
            .attr('x', -40)
            .attr('y', -15)
            .attr('width', 80)
            .attr('height', 30)
            .attr('fill', 'hsl(var(--background))')
            .attr('stroke', 'hsl(var(--border))')
            .attr('rx', 4);
          
          tooltip
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('fill', 'hsl(var(--foreground))')
            .style('font-size', '12px')
            .text(`${d.data[xKey]}: ${d.data[yKey]}`);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
          
          g.select('.tooltip').remove();
        });

      // Add labels
      slices.append('text')
        .attr('transform', d => `translate(${outerArc.centroid(d)})`)
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', 'hsl(var(--muted-foreground))')
        .text(d => {
          const percent = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
          return Number(percent) > 5 ? `${percent}%` : '';
        })
        .transition()
        .duration(800)
        .delay(400)
        .style('opacity', 1);

      // Add legend
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 120}, 30)`);

      const legendItems = legend.selectAll('.legend-item')
        .data(data.slice(0, 8))
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 18})`);

      legendItems.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => colorScale(d[xKey]) as string)
        .attr('rx', 2);

      legendItems.append('text')
        .attr('x', 16)
        .attr('y', 6)
        .attr('dy', '0.35em')
        .style('font-size', '9px')
        .style('fill', 'hsl(var(--muted-foreground))')
        .text(d => String(d[xKey]).substring(0, 10) + (String(d[xKey]).length > 10 ? '...' : ''));
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