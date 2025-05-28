'use client';

import React, { useState } from 'react';
import { parseCSV, parseJSON, parseYAMLFile, parseXML, parseXLSX } from '../utils/parsers';
import { getRandomColor } from '../utils/helpers';
import {
    Bar,
    Line,
    Pie,
    Radar,
    Doughnut,
    PolarArea,
    Scatter,
    Bubble
} from 'react-chartjs-2';
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
    Filler,
    Title,
    RadialLinearScale,
    ScatterController,
    BubbleController
} from 'chart.js';
import { ChartData } from 'chart.js';
import { RowData, ChartType } from '../types';

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler,
    Title,
    RadialLinearScale,
    ScatterController,
    BubbleController
);

const ChartViewer = () => {
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [xKey, setXKey] = useState('');
    const [labelKey, setLabelKey] = useState(''); // for Pie chart labels
    const [yKeys, setYKeys] = useState<string[]>([]);
    const [allKeys, setAllKeys] = useState<string[]>([]);
    const [dataRows, setDataRows] = useState<RowData[]>([]);
    const [chartData, setChartData] = useState<ChartData | null>(null);

    const needsYAxisOnly = ['pie', 'doughnut', 'polarArea'];
    const needsXAxisOnly = ['bubble', 'scatter'];
    const isXAxisDisabled = needsYAxisOnly.includes(chartType);
    const isYAxisDisabled = needsXAxisOnly.includes(chartType);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        let rows: RowData[] = [];

        try {
            const text = await file.text();
            switch (ext) {
                case 'csv':
                case 'tsv':
                case 'txt':
                    rows = parseCSV(text, ext === 'tsv' ? '\t' : ',');
                    break;
                case 'json':
                    rows = parseJSON(text);
                    break;
                case 'yaml':
                case 'yml':
                    rows = parseYAMLFile(text);
                    break;
                case 'xml':
                    rows = await parseXML(text);
                    break;
                case 'xls':
                case 'xlsx':
                    rows = await parseXLSX(await file.arrayBuffer());
                    break;
                default:
                    alert('Unsupported file type');
                    return;
            }

            if (rows.length) {
                const keys = Object.keys(rows[0]);
                setDataRows(rows);
                setAllKeys(keys);
                setXKey('');
                setLabelKey('');
                setYKeys([]);
                setChartData(null);
            }
        } catch (err) {
            console.error('Error parsing file:', err);
            alert('Failed to parse file. Please check the format.');
        }
    };

   const generateChartData = (x: string, label: string, y: string[], rows: RowData[]) => {
    if (
        (isXAxisDisabled || x || label) &&
        (isYAxisDisabled || y.length > 0)
    ) {
        // Handle Pie/Doughnut/PolarArea charts
        if (needsYAxisOnly.includes(chartType)) {
            let labels: string[] = [];

            if (label) {
                labels = rows.map((row) => String(row[label] ?? `Item ${rows.indexOf(row) + 1}`));
            } else {
                labels = rows.map((_, idx) => `Item ${idx + 1}`);
            }

            const key = y[0];
            const data = rows.map((row) => Number(row[key]) || 0);

            setChartData({
                labels,
                datasets: [
                    {
                        label: key,
                        data,
                        backgroundColor: labels.map(() => getRandomColor()),
                        borderColor: labels.map(() => 'rgba(0, 0, 0, 0.1)'),
                        borderWidth: 1
                    }
                ]
            });
            return;
        }

        // Handle Scatter and Bubble charts
        if (chartType === 'scatter' || chartType === 'bubble') {
            if (!x || y.length === 0) {
                setChartData(null);
                return;
            }

            const keyX = x;
            const keyY = y[0]; // scatter/bubble only use one y key

            const data = rows.map((row) => {
                const xVal = Number(row[keyX]);
                const yVal = Number(row[keyY]);

                if (chartType === 'scatter') {
                    return { x: xVal, y: yVal };
                } else {
                    // For bubble, you can add a radius 'r' if available, else default to 5
                    const rVal = Number(row['r']) || 5;
                    return { x: xVal, y: yVal, r: rVal };
                }
            });

            setChartData({
                datasets: [
                    {
                        label: keyY,
                        data,
                        backgroundColor: getRandomColor()
                    }
                ]
            });
            return;
        }

        // For all other charts (Bar, Line, Radar)
        const labels = rows.map((row) => String(row[x]));

        const datasets = y.map((key) => ({
            label: key,
            data: rows.map((row) => Number(row[key]) || 0),
            backgroundColor: getRandomColor(),
            borderColor: 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            fill: chartType === 'line' || chartType === 'radar'
        }));

        setChartData({
            labels,
            datasets
        });
    }
};


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
            case 'radar':
                return <Radar data={chartData as ChartData<'radar'>} options={options} />;
            case 'doughnut':
                return <Doughnut data={chartData as ChartData<'doughnut'>} options={options} />;
            case 'polarArea':
                return <PolarArea data={chartData as ChartData<'polarArea'>} options={options} />;
            case 'scatter':
                return <Scatter data={chartData as ChartData<'scatter'>} options={options} />;
            case 'bubble':
                return <Bubble data={chartData as ChartData<'bubble'>} options={options} />;
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <div className="flex flex-col items-center justify-center space-y-4">
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-green-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                    Select File
                </label>
                <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.tsv,.txt,.json,.xml,.yaml,.yml,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileUpload}
                />
            </div>

            {allKeys.length > 0 && (
                <>
                    <div style={{ marginTop: 20 }}>
                        <label className="inline text-lg font-medium text-gray-700">Chart Type: </label>
                        <select
                            value={chartType}
                            onChange={(e) => {
                                const type = e.target.value as ChartType;
                                // Reset keys when chart type changes
                                setChartType(type);
                                setXKey('');
                                setLabelKey('');
                                setYKeys([]);
                                setChartData(null);
                            }}
                            className="mt-2 block px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                            <option value="bar">Bar</option>
                            <option value="line">Line</option>
                            <option value="pie">Pie</option>
                            <option value="radar">Radar</option>
                            <option value="doughnut">Doughnut</option>
                            <option value="polarArea">Polar Area</option>
                            <option value="scatter">Scatter</option>
                            <option value="bubble">Bubble</option>
                        </select>
                    </div>

                    {needsYAxisOnly.includes(chartType) ? (
                        // Pie/Doughnut/PolarArea UI: labelKey + Y key (single)
                        <div className="flex items-center space-x-6 mt-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Label Key (Slice Labels):</label>
                                <select
                                    value={labelKey}
                                    onChange={(e) => {
                                        setLabelKey(e.target.value);
                                        generateChartData(xKey, e.target.value, yKeys, dataRows);
                                    }}
                                    className="w-48 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">-- Select Label Key --</option>
                                    {allKeys.map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Value Key:</label>
                                <select
                                    value={yKeys[0] || ''}
                                    onChange={(e) => {
                                        const selected = e.target.value;
                                        setYKeys(selected ? [selected] : []);
                                        generateChartData(xKey, labelKey, selected ? [selected] : [], dataRows);
                                    }}
                                    className="w-48 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">-- Select Value Key --</option>
                                    {allKeys.map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        // Other charts UI: X key + multi Y keys
                        <div className="flex items-center space-x-4 mt-4">
                            <label className="text-sm font-medium text-gray-700">X Axis:</label>
                            <select
                                value={xKey}
                                onChange={(e) => {
                                    const newX = e.target.value;
                                    setXKey(newX);
                                    generateChartData(newX, labelKey, yKeys, dataRows);
                                }}
                                disabled={isXAxisDisabled}
                                className={`w-40 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                    isXAxisDisabled ? 'bg-gray-200 cursor-not-allowed' : 'border-gray-300'
                                }`}
                            >
                                <option value="">-- Select X Axis --</option>
                                {allKeys.map((key) => (
                                    <option key={key} value={key}>
                                        {key}
                                    </option>
                                ))}
                            </select>

                            <div className="flex items-center space-x-4 mt-4">
                                <label className="text-sm font-medium text-gray-700">Y Axis:</label>
                                <select
                                    multiple={!['pie', 'doughnut', 'polarArea'].includes(chartType)}
                                    value={yKeys}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                                        setYKeys(selected);
                                        generateChartData(xKey, labelKey, selected, dataRows);
                                    }}
                                    disabled={isYAxisDisabled}
                                    className={`w-40 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        isYAxisDisabled ? 'bg-gray-200 cursor-not-allowed' : 'border-gray-300'
                                    }`}
                                >
                                    {allKeys
                                        .filter((key) => key !== xKey)
                                        .map((key) => (
                                            <option key={key} value={key}>
                                                {key}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="mt-5">
                        <button
                            style={{ marginTop: 20 }}
                            onClick={() => generateChartData(xKey, labelKey, yKeys, dataRows)}
                            disabled={
                                (isXAxisDisabled
                                    ? !labelKey || yKeys.length === 0
                                    : !xKey || yKeys.length === 0)
                            }
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Generate Chart
                        </button>
                    </div>

                    <div style={{ height: 400, marginTop: 30 }}>{renderChart()}</div>
                </>
            )}
        </div>
    );
};

export default ChartViewer;
