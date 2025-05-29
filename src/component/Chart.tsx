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
    const margin = { top: 30, right: 70, bottom: 50, left: 100 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    d3.select(chartRef.current).html(""); // Clear previous chart

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xAxis = data[0][xKey];
    const yAxis = data[0][yKey];
    const xIsNumber = !isNaN(+xAxis);
    const yIsNumber = !isNaN(+yAxis);

    if (xIsNumber && !yIsNumber) {
      const y = d3
        .scaleBand()
        .domain(data.map((d) => d[yKey]))
        .range([0, height])
        .padding(0.1);

      const x = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => +d[xKey])!])
        .nice()
        .range([0, width]);

      svg.append("g").call(d3.axisLeft(y));
      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

      svg
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("y", (d) => y(d[yKey])!)
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", (d) => x(+d[xKey]))
        .attr("fill", "steelblue");
    }
    else {
      const x = d3
        .scaleBand()
        .domain(data.map((d) => d[xKey]))
        .range([0, width])
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => +d[yKey])!])
        .nice()
        .range([height, 0]);

      svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

      svg.append("g").call(d3.axisLeft(y));

      svg
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d) => x(d[xKey])!)
        .attr("y", (d) => y(+d[yKey]))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(+d[yKey]))
        .attr("fill", "steelblue");
    }
  };
  const drawLineChart = () => {
    if (!xKey || !yKey || data.length === 0) return;

    const margin = { top: 30, right: 70, bottom: 50, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .html("")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xVals = Array.from(new Set(data.map(d => d[xKey])));
    const yVals = Array.from(new Set(data.map(d => d[yKey])));

    const x = d3
      .scalePoint()
      .domain(xVals)
      .range([0, width])
      .padding(0.5);

    const y = d3
      .scalePoint()
      .domain(yVals)
      .range([height, 0])
      .padding(0.5);


    const lineData = data.map(d => ({ x: d[xKey], y: d[yKey] }));

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g").call(d3.axisLeft(y));

    const line = d3.line<any>()
      .x((d) => x(d.x)!)
      .y((d) => y(d.y)!)
      .curve(d3.curveStep);

    svg.append("path")
      .datum(lineData)
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
        const limited = parsed.slice(0, 10);
        setData(limited);
        const cols = Object.keys(limited[0]);
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
        <strong style={{ marginRight: '10px' }}>Chart Type:</strong>{" "}
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

      <div>

        {columns.length > 0 && (
          <div className="displayData" >
            <label>
              <strong>X (Label):</strong>{" "}
              <select value={xKey} onChange={(e) => setXKey(e.target.value)}>
                {columns.map((col) => (
                  <option key={col} value={col} disabled={col === yKey}>
                    {col} {col === yKey ? " (already used in Y)" : ""}
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
                  <option key={col} value={col} disabled={col === xKey}>
                    {col} {col === xKey ? " (already used in X)" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <div className="displayData">
          {data.length === 10 && (
            <div style={{ color: "gray", marginTop: "8px" }}>
              Showing first 10 records only.
            </div>
          )}
        </div>
        <div className="displayData" ref={chartRef}></div>
      </div>
    </div>
  );
};

export default Chart;
