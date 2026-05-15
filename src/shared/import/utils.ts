 import * as XLSX from 'xlsx';
 import type { ImportConfig, ColumnMapping, ImportPreview, ImportEntity } from './types';
 
 // Parse Excel file to get headers and data
 export const parseExcelFile = async (file: File): Promise<{
   headers: string[];
   data: any[];
   metadata: {
     totalRows: number;
     isLargeDataset: boolean;
   };
 }> => {
   return new Promise((resolve, reject) => {
     const reader = new FileReader();
     
     reader.onload = async (e) => {
       try {
         const data = e.target?.result;
         if (!data) throw new Error('Failed to read file');
         
         const uint8Array = new Uint8Array(data as ArrayBuffer);
         const workbook = XLSX.read(uint8Array, { 
           type: 'array',
           cellDates: true,
           cellNF: false,
           cellText: false
         });
         
         const firstSheetName = workbook.SheetNames[0];
         const worksheet = workbook.Sheets[firstSheetName];
         
         const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
           header: 1,
           defval: '',
           blankrows: false
         }) as any[][];
         
         if (jsonData.length === 0) throw new Error('No data found in the Excel file');
 
         const headers = jsonData[0].map(header => String(header).trim()).filter(Boolean);
         
         let dataRows = jsonData.slice(1).filter(row => 
           row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
         );
         
          const isLargeDataset = false; // No limit - allow all rows
 
         const processedData = dataRows.map((row) => {
           const obj: any = {};
           headers.forEach((header, headerIndex) => {
             obj[header] = row[headerIndex] || '';
           });
           return obj;
         });
 
         resolve({
           headers,
           data: processedData,
           metadata: {
             totalRows: isLargeDataset ? jsonData.length - 1 : dataRows.length,
             isLargeDataset
           }
         });
       } catch (error) {
         reject(error);
       }
     };
 
     reader.onerror = () => reject(new Error('Failed to read the Excel file'));
     reader.readAsArrayBuffer(file);
   });
 };
 
// Generate Excel template for any entity
export const generateExcelTemplate = <T>(
  config: ImportConfig<T>,
  localizedHeaders?: string[],
  exampleData?: Record<string, any>[]
): void => {
  const headers = localizedHeaders || config.fields.map(f => 
    f.required ? `${f.label}*` : f.label
  );
  
  // Create data array with headers as first row
  const dataArray: any[][] = [headers];
  
  // Add example data rows if provided
  if (exampleData && exampleData.length > 0) {
    exampleData.forEach(row => {
      const rowData = config.fields.map(field => row[field.key] ?? '');
      dataArray.push(rowData);
    });
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(dataArray);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, config.templateSheetName);
  
  const colWidths = headers.map(() => ({ wch: 20 }));
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, config.templateFilename);
};
 
 // Generate import preview from parsed data
 export const generateImportPreview = <T>(
   data: any[],
   columnMapping: ColumnMapping,
   config: ImportConfig<T>
 ): ImportPreview<T> => {
   const initialRows: ImportEntity<T>[] = data.map((row, index) => {
     const mappedData: Record<string, any> = {};
     let hasRequiredField = false;
     let isEmpty = true;

     Object.entries(columnMapping).forEach(([sourceColumn, targetField]) => {
       if (targetField && row[sourceColumn] !== undefined) {
         const value = String(row[sourceColumn] || '').trim();
         if (value) {
           mappedData[targetField] = value;
           isEmpty = false;
           
           if (config.requiredFields.includes(targetField)) {
             hasRequiredField = true;
           }
         }
       }
     });

     let status: ImportEntity<T>['status'] = 'valid';
     const errors: string[] = [];
     const warnings: string[] = [];

     if (isEmpty) {
       status = 'empty';
       errors.push('Row contains no data');
     } else if (!hasRequiredField) {
       status = 'invalid';
       const requiredLabels = config.fields
         .filter(f => config.requiredFields.includes(f.key))
         .map(f => f.label);
       errors.push(`Missing required field: ${requiredLabels.join(' or ')}`);
     }

     // Run field validations for ALL fields (both with data and required fields without data)
     config.fields.forEach(field => {
       const value = mappedData[field.key];
       const valueStr = value ? String(value).trim() : '';
       
       // Check if required field is empty (using field.required property)
       // Skip if already reported in requiredFields check above
       if (field.required && !valueStr && !config.requiredFields.includes(field.key)) {
         if (status === 'valid') status = 'invalid';
         errors.push(`${field.label} is required`);
       }
       
       // Run custom validation if field has a value and validate function
       if (field.validate && valueStr) {
         const error = field.validate(valueStr);
         if (error) {
           if (status === 'valid') status = 'invalid';
           // Avoid duplicate error messages
           if (!errors.includes(error)) {
             errors.push(error);
           }
         }
       }
     });

     // Transform to entity type
     const transformedData = config.transformRow(mappedData);

     // Custom validation
     if (config.validateRow && status === 'valid') {
       const validation = config.validateRow(transformedData);
       errors.push(...validation.errors);
       warnings.push(...validation.warnings);
       if (validation.errors.length > 0) status = 'invalid';
     }
     
     return {
       id: `row-${index}`,
       originalIndex: index,
       data: transformedData,
       status,
       errors,
       warnings,
       selected: status === 'valid',
       duplicateOf: undefined,
       duplicateFields: []
     };
   });
 
   // Detect duplicates based on config
   const processedRows = detectDuplicates(initialRows, config);
 
   const validRows = processedRows.filter(row => row.status === 'valid');
   const invalidRows = processedRows.filter(row => row.status === 'invalid');
   const duplicateRows = processedRows.filter(row => row.status === 'duplicate');
   const emptyRows = processedRows.filter(row => row.status === 'empty');
 
   return {
     rows: processedRows,
     totalRows: data.length,
     validRows: validRows.length,
     invalidRows: invalidRows.length,
     excludedRows: 0,
     duplicateRows: duplicateRows.length,
     emptyRows: emptyRows.length,
     isLargeDataset: data.length > 5000,
     previewRows: processedRows.length
   };
 };
 
 // Detect duplicates in import data
 const detectDuplicates = <T>(
   rows: ImportEntity<T>[],
   config: ImportConfig<T>
 ): ImportEntity<T>[] => {
   const seen = new Map<string, string>();
   
   return rows.map(row => {
     if (row.status === 'empty' || row.status === 'invalid') return row;
 
     const duplicateKeys: string[] = [];
     const duplicateFields: string[] = [];
     
     config.duplicateCheckFields.forEach(field => {
       const value = (row.data as any)[field];
       if (value) {
         const key = `${field}:${String(value).toLowerCase().trim()}`;
         duplicateKeys.push(key);
       }
     });
 
     let isDuplicate = false;
     let duplicateOf: string | undefined;
 
     for (const key of duplicateKeys) {
       if (seen.has(key)) {
         isDuplicate = true;
         duplicateOf = seen.get(key);
         const field = key.split(':')[0];
         duplicateFields.push(field);
         break;
       }
     }
 
     if (isDuplicate) {
       return {
         ...row,
         status: 'duplicate' as const,
         duplicateOf,
         duplicateFields,
         selected: false,
         warnings: [...row.warnings, `Duplicate ${duplicateFields.join(', ')} found`]
       };
     } else {
       duplicateKeys.forEach(key => seen.set(key, row.id));
       return row;
     }
   });
 };
 
 // Simple column mapping based on header similarity
 export const autoMapColumns = <T>(
   headers: string[],
   config: ImportConfig<T>
 ): ColumnMapping => {
   const mapping: ColumnMapping = {};
   
   const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
   
   headers.forEach(header => {
     const normalizedHeader = normalize(header);
     
     for (const field of config.fields) {
       const normalizedLabel = normalize(field.label);
       const normalizedKey = normalize(field.key);
       
       if (normalizedHeader === normalizedLabel || 
           normalizedHeader === normalizedKey ||
           normalizedHeader.includes(normalizedLabel) ||
           normalizedLabel.includes(normalizedHeader)) {
         mapping[header] = field.key;
         break;
       }
     }
     
     if (!mapping[header]) {
       mapping[header] = null;
     }
   });
   
   return mapping;
 };