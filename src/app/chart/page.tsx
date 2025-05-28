'use client';

import React, { useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { ChartData } from 'chart.js';

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend
);

// Types
type ChartType = 'bar' | 'line' | 'pie';
type RowData = Record<string, string | number>;

const ChartPage = () => {
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [chartData, setChartData] = useState<ChartData<'bar'> | ChartData<'line'> | ChartData<'pie'> | null>(null);
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse<RowData>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: ParseResult<RowData>) => {
                const parsedData = results.data;
                if (!parsedData.length) return;

                const labels = Object.keys(parsedData[0]);
                const firstLabel = labels[0];

                const datasets = labels.slice(1).map((label) => ({
                    label,
                    data: parsedData.map((row) => Number(row[label])),
                    backgroundColor: getRandomColor(),
                }));

                setChartData({
                    labels: parsedData.map((row) => String(row[firstLabel])),
                    datasets,
                });
            },
        });
    };

    const getRandomColor = () =>
        `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
            Math.random() * 255
        )}, ${Math.floor(Math.random() * 255)}, 0.6)`;

    const renderChart = () => {
        if (!chartData) return null;

        const options = { responsive: true, maintainAspectRatio: false };

        switch (chartType) {
            case 'bar':
                return <Bar data={chartData as ChartData<'bar'>} options={options} />;
            case 'line':
                return <Line data={chartData as ChartData<'line'>} options={options} />;
            case 'pie':
                return <Pie data={chartData as ChartData<'pie'>} options={options} />;
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>📊 File Upload & Chart Viewer</h1>

            <input type="file" accept=".csv" onChange={handleFileUpload} />

            <div style={{ marginTop: 20 }}>
                <label>Select Chart Type: </label>
                <select onChange={(e) => setChartType(e.target.value as ChartType)} value={chartType}>
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                </select>
            </div>

            <div style={{ height: '500px', marginTop: 30 }}>{renderChart()}</div>
        </div>
    );
};

export default ChartPage;
