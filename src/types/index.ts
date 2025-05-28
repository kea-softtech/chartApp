// src/types/index.ts

export type RowData = Record<string, string | number>;
export type ChartType = | 'bar'
    | 'line'
    | 'pie'
    | 'radar'
    | 'doughnut'
    | 'polarArea'
    | 'scatter'
    | 'bubble';
import { ChartData } from 'chart.js';

export type SupportedChartData = ChartData<| 'bar'
    | 'line'
    | 'pie'
    | 'radar'
    | 'doughnut'
    | 'polarArea'
    | 'scatter'
    | 'bubble'>;
