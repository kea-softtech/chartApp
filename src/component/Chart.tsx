"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import './chart.css'
type CSVRow = Record<string, string>;

const Chart = () => {
  const [data, setData] = useState<CSVRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [xKey, setXKey] = useState<string>("");
  const [yKey, setYKey] = useState<string>("");
  const [chartType, setChartType] = useState<"Bar" | "Line">("Bar");
  const chartRef = useRef<HTMLDivElement>(null);

  // ✅ FIXED useEffect: handles both chart types safely
  useEffect(() => {
    if (!xKey || data.length === 0) return;

    d3.select(chartRef.current).select("svg").remove();

    if (chartType === "Bar") {
      drawBarChart();
    } else if (chartType === "Line" && yKey) {
      drawLineChart();
    }
  }, [xKey, yKey, chartType, data]);

  const drawBarChart = () => {
    const margin = { top: 30, right: 70, bottom: 50, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d[xKey] as string))
      .range([0, width])
      .padding(0.2);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    const y = d3
      .scaleLinear()
      .domain([
        0,
        yKey
          ? d3.max(data, (d) => +d[yKey]!) || 0
          : d3.max(Object.values(data.reduce((acc, d) => {
            acc[d[xKey]] = (acc[d[xKey]] || 0) + 1;
            return acc;
          }, {} as Record<string, number>))) || 10,
      ])
      .range([height, 0]);

    svg.append("g").call(d3.axisLeft(y));

    if (yKey) {
      svg
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d) => x(d[xKey] as string)!)
        .attr("y", (d) => y(+d[yKey]!))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(+d[yKey]!))
        .attr("fill", "#69b3a2");
    } else {
      // If no yKey, count occurrences of xKey values
      const counts = d3.rollups(
        data,
        (v) => v.length,
        (d) => d[xKey]
      );
      svg
        .selectAll("rect")
        .data(counts)
        .enter()
        .append("rect")
        .attr("x", (d) => x(d[0])!)
        .attr("y", (d) => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d[1]))
        .attr("fill", "#69b3a2");
    }
  };

  const drawLineChart = () => {
    if (!yKey || !xKey || data.length === 0) return;

    const margin = { top: 30, right: 70, bottom: 50, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .html("") // Clear previous chart
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const sampleX = data[0][xKey];
    const isDate = !isNaN(Date.parse(sampleX));

    let parsedData;

    if (isDate) {
      // x is a date
      parsedData = data
        .map((d) => ({
          x: new Date(d[xKey]!),
          y: +d[yKey]!,
        }))
        .filter((d) => !isNaN(d.x.getTime()) && !isNaN(d.y))
        .sort((a, b) => a.x.getTime() - b.x.getTime());
    } else {
      // x is a number
      parsedData = data
        .map((d) => ({
          x: +d[xKey]!,
          y: +d[yKey]!,
        }))
        .filter((d) => !isNaN(d.x) && !isNaN(d.y))
        .sort((a, b) => a.x - b.x);
    }

    if (parsedData.length === 0) return;

    const x = isDate
      ? d3.scaleUtc()
        .domain(d3.extent(parsedData, (d) => d.x) as [Date, Date])
        .range([0, width])
      : d3.scaleLinear()
        .domain(d3.extent(parsedData, (d) => d.x) as [number, number])
        .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, (d) => d.y)!])
      .nice()
      .range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));
    svg.append("g").call(d3.axisLeft(y));

    const line = d3
      .line<any>().curve(d3.curveStep)
      .x((d) => x(d.x))
      .y((d) => y(d.y));


    svg
      .append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target?.result;
      if (typeof text === "string") {
        const parsed = d3.csvParse(text);
        setData(parsed);
        const cols = Object.keys(parsed[0]);
        setColumns(cols);
        setXKey(cols[0]);
        setYKey(cols[1] || "");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="background">
      <label className="displayData">
        <strong style={{ marginRight:'10px' }}>Chart Type:</strong>{" "}
        <select
          className='select-box'
          value={chartType}
          onChange={(e) => setChartType(e.target.value as "Bar" | "Line")}
        >
          <option value="Bar">Bar Chart</option>
          <option value="Line">Line Chart</option>
        </select>
        <input
          style={{ marginLeft: "10px" }}
          type="file"
          accept=".csv"
          onChange={handleFileUpload} />

      </label>

      <div  >
        {columns.length > 0 && (
          <div className="displayData" >
            <label>
              <strong>X (Label):</strong>{" "}
              <select value={xKey} onChange={(e) => setXKey(e.target.value)}>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </label>
            &nbsp;&nbsp;
            <label>
              <strong>Y (Value):</strong>{" "}
              <select value={yKey} onChange={(e) => setYKey(e.target.value)}>
                <option value="">None</option>
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="displayData" ref={chartRef}></div>
      </div>
    </div>
  );
};

export default Chart;
