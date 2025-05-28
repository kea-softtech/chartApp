// import Papa from 'papaparse';
// import * as XLSX from 'xlsx';
// import * as yaml from 'js-yaml'; // Import the entire js-yaml module
// import { parseStringPromise } from 'xml2js';
// import { RowData } from '@/types';

// export const parseCSV = (text: string, delimiter: string): RowData[] => {
//   const result = Papa.parse(text, { delimiter, header: true });
//   return result.data as RowData[];  // Explicitly cast to RowData[]
// };

// export const parseJSON = (text: string): RowData[] => {
//   return JSON.parse(text) as RowData[];  // Explicitly cast to RowData[]
// };

// export const parseYAMLFile = (text: string): RowData[] => {
//   const parsed = yaml.load(text);
//   if (Array.isArray(parsed)) return parsed as RowData[];
//   if (typeof parsed === 'object' && parsed !== null) return [parsed as RowData];
//   return [];
// };

// export const parseXML = async (text: string): Promise<RowData[]> => {
//   const result = await parseStringPromise(text);
//   // Depending on XML structure, you might need to transform it to RowData[] 
//   // For now, we assume it's directly mappable
//   return result as RowData[];  // Explicitly cast to RowData[]
// };

// export const parseXLSX = async (arrayBuffer: ArrayBuffer): Promise<RowData[]> => {
//   const workbook = XLSX.read(arrayBuffer, { type: 'array' });
//   const sheetName = workbook.SheetNames[0];
//   const sheet = workbook.Sheets[sheetName];
//   return XLSX.utils.sheet_to_json(sheet) as RowData[];  // Explicitly cast to RowData[]
// };


import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as yaml from 'js-yaml';
import { parseStringPromise } from 'xml2js';
import { RowData } from '@/types';


type XMLParsedObject = {
  [key: string]: {
    [childKey: string]: Array<Record<string, unknown>>;
  };
};
export const parseCSV = (text: string, delimiter: string): RowData[] => {
  const result = Papa.parse(text, { delimiter, header: true });
  return result.data as RowData[];
};

export const parseJSON = (text: string): RowData[] => {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed as RowData[];
  if (typeof parsed === 'object' && parsed !== null) return Object.values(parsed) as RowData[];
  return [];
};

export const parseYAMLFile = (text: string): RowData[] => {
  const parsed = yaml.load(text);
  if (Array.isArray(parsed)) return parsed as RowData[];
  if (typeof parsed === 'object' && parsed !== null) return [parsed as RowData];
  return [];
};


export const parseXML = async (text: string): Promise<RowData[]> => {
  const result = await parseStringPromise(text) as XMLParsedObject;

  const rootKeys = Object.keys(result);
  if (rootKeys.length === 0) return [];

  const rootKey = rootKeys[0];
  const rawGroup = result[rootKey];

  const childKey = Object.keys(rawGroup).find(
    (key) => Array.isArray(rawGroup[key])
  );

  if (!childKey) return [];

  const rawItems = rawGroup[childKey] as Array<Record<string, unknown>>;

  const rows: RowData[] = rawItems.map((item) => {
    const row: RowData = {};
    for (const key in item) {
      const val = item[key];
      if (Array.isArray(val)) {
        const firstVal = val[0];
        if (typeof firstVal === 'string' || typeof firstVal === 'number') {
          row[key] = firstVal;
        } else {
          row[key] = String(firstVal); // fallback if object or something else
        }
      } else if (typeof val === 'string' || typeof val === 'number') {
        row[key] = val;
      } else {
        row[key] = String(val); // fallback if object or null
      }
    }
    return row;
  });

  return rows;
};


export const parseXLSX = async (arrayBuffer: ArrayBuffer): Promise<RowData[]> => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet) as RowData[];
};
