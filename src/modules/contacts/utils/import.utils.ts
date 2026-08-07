import * as XLSX from 'xlsx';
import { ColumnMapping, ImportPreview, ImportedRow } from '../types/import';
import { largeFileProcessor } from './fileProcessing.utils';
import { memoryManager } from './memoryManager.utils';

interface ParseResult {
  headers: string[];
  data: any[];
  metadata: {
    totalRows: number;
    estimatedMemoryMB: number;
    isLargeDataset: boolean;
  };
}

export const parseExcelFile = async (file: File): Promise<ParseResult & { templateDetection?: ReturnType<typeof detectTemplateFile>; sheetName?: string }> => {
  console.log('Starting file parse for:', file.name, 'Size:', file.size);

  // Validate file size first
  const sizeValidation = largeFileProcessor.validateFileSize(file);
  if (!sizeValidation.valid) {
    throw new Error(sizeValidation.message);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        console.log('FileReader loaded, processing...');
        const data = e.target?.result;
        
        if (!data) {
          throw new Error('Failed to read file');
        }

        console.log('Array buffer size:', (data as ArrayBuffer).byteLength);
        
        // Process in chunks for large files
        const uint8Array = new Uint8Array(data as ArrayBuffer);
        console.log('Created Uint8Array, parsing with XLSX...');
        
        const workbook = XLSX.read(uint8Array, { 
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false
        });
        
        console.log('XLSX workbook created, sheets:', workbook.SheetNames);
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        console.log('Got worksheet:', firstSheetName);
        
        // Convert to JSON with streaming for large files
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        }) as any[][];
        
        console.log('Converted to JSON, rows:', jsonData.length);
        
        if (jsonData.length === 0) {
          throw new Error('No data found in the Excel file');
        }

        // Extract headers (first row)
        const headers = jsonData[0].map(header => String(header).trim()).filter(Boolean);
        console.log('Headers found:', headers);
        
        // Extract data rows (skip header)
        let dataRows = jsonData.slice(1).filter(row => 
          row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );
        
        console.log('Data rows after filtering:', dataRows.length);
        
        // Handle large datasets
        const estimatedMemory = largeFileProcessor.estimateMemoryUsage(dataRows);
        const isLargeDataset = largeFileProcessor.shouldUseSampling(dataRows.length);
        
        // Track memory usage
        memoryManager.trackMemoryUsage('excel-data', dataRows);
        
        // If dataset is too large, use sampling for preview
        if (isLargeDataset) {
          console.warn(`Large dataset detected (${dataRows.length} rows). Using sampling for performance.`);
          
          // Keep original data reference for later processing
          const originalDataRows = dataRows;
          
          // Create sample for immediate processing
          dataRows = largeFileProcessor.createSample(dataRows, 5000);
          console.log('Sample created:', dataRows.length, 'rows');
          
          // Store original data for later use
          (dataRows as any).__originalData = originalDataRows;
          (dataRows as any).__isSampled = true;
        }

        // Convert to objects
        const processedData = dataRows.map((row, index) => {
          const obj: any = {};
          headers.forEach((header, headerIndex) => {
            obj[header] = row[headerIndex] || '';
          });
          return obj;
        });

        // Detect if this is our template file
        const templateDetection = detectTemplateFile(file, headers, firstSheetName);
        console.log('Template detection:', templateDetection);

        console.log('Successfully processed Excel file');
        
        resolve({
          headers,
          data: processedData,
          metadata: {
            totalRows: isLargeDataset ? (dataRows as any).__originalData?.length || dataRows.length : dataRows.length,
            estimatedMemoryMB: estimatedMemory,
            isLargeDataset
          },
          templateDetection,
          sheetName: firstSheetName
        });
        
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

export const generateImportPreview = (data: any[], columnMapping: ColumnMapping): ImportPreview => {
  // Handle large datasets efficiently
  const shouldOptimize = memoryManager.shouldOptimizeForMemory();
  const processData = shouldOptimize ? memoryManager.optimizeDataForMemory(data, 1000) : data;
  
  if (shouldOptimize) {
    console.warn(`Optimizing preview for large dataset: ${data.length} → ${processData.length} rows`);
  }

  // First pass: create basic rows
  const initialRows: ImportedRow[] = processData.map((row, index) => {
    const mappedData: any = {};
    let hasRequiredField = false;
    let isEmpty = true;

    // Map data according to column mapping
    Object.entries(columnMapping).forEach(([sourceColumn, targetField]) => {
      if (targetField && row[sourceColumn] !== undefined) {
        const value = String(row[sourceColumn] || '').trim();
        if (value) {
          mappedData[targetField] = value;
          isEmpty = false;
          
          // Check if we have at least one required field (name or company)
          if (targetField === 'fullName' || targetField === 'companyName') {
            hasRequiredField = true;
          }
        }
      }
    });

    // Determine status and errors
    let status: ImportedRow['status'] = 'valid';
    const errors: string[] = [];
    const warnings: string[] = [];

    if (isEmpty) {
      status = 'empty';
      errors.push('Row contains no data');
    } else if (!hasRequiredField) {
      status = 'invalid';
      errors.push('Missing required field: Full Name or Company Name');
    }

    // Basic email validation
    if (mappedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedData.email)) {
      if (status === 'valid') status = 'invalid';
      errors.push('Invalid email format');
    }

    // Phone validation
    if (mappedData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(mappedData.phone.replace(/[\s\-\(\)]/g, ''))) {
      warnings.push('Phone number format may be invalid');
    }
    
    return {
      id: `row-${index}`,
      originalIndex: index,
      data: mappedData,
      status,
      errors,
      warnings,
      selected: status === 'valid',
      duplicateOf: undefined,
      duplicateFields: []
    };
  });

  // Second pass: detect duplicates
  const processedRows = detectAndMarkDuplicates(initialRows);

  const validRows = processedRows.filter(row => row.status === 'valid');
  const invalidRows = processedRows.filter(row => row.status === 'invalid');
  const duplicateRows = processedRows.filter(row => row.status === 'duplicate');
  const emptyRows = processedRows.filter(row => row.status === 'empty');

  return {
    rows: processedRows,
    totalRows: data.length, // Use original data length
    validRows: validRows.length,
    invalidRows: invalidRows.length,
    excludedRows: 0,
    duplicateRows: duplicateRows.length,
    emptyRows: emptyRows.length,
    isLargeDataset: shouldOptimize,
    previewRows: processData.length
  };
};

// Duplicate detection function
const detectAndMarkDuplicates = (rows: ImportedRow[]): ImportedRow[] => {
  const seen = new Map<string, string>(); // key -> first row ID
  
  return rows.map(row => {
    if (row.status === 'empty' || row.status === 'invalid') {
      return row; // Don't check duplicates for invalid/empty rows
    }

    // Create a duplicate key based on email and name/company
    const email = row.data.email?.toLowerCase().trim();
    const name = row.data.fullName?.toLowerCase().trim();
    const company = row.data.companyName?.toLowerCase().trim();
    
    const duplicateKeys: string[] = [];
    const duplicateFields: string[] = [];
    
    if (email) {
      duplicateKeys.push(`email:${email}`);
    }
    if (name) {
      duplicateKeys.push(`name:${name}`);
    }
    if (company) {
      duplicateKeys.push(`company:${company}`);
    }

    // Check for duplicates
    let isDuplicate = false;
    let duplicateOf: string | undefined;

    for (const key of duplicateKeys) {
      if (seen.has(key)) {
        isDuplicate = true;
        duplicateOf = seen.get(key);
        
        if (key.startsWith('email:')) duplicateFields.push('email');
        if (key.startsWith('name:')) duplicateFields.push('fullName');
        if (key.startsWith('company:')) duplicateFields.push('companyName');
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
      // Mark this row as seen for future duplicate detection
      duplicateKeys.forEach(key => seen.set(key, row.id));
      return row;
    }
  });
};

// Template identification constants
export const TEMPLATE_FILENAME = 'contacts-template.xlsx';
export const TEMPLATE_FILENAME_FR = 'modele-contacts.xlsx';
export const TEMPLATE_SHEET_NAME = 'Contacts Template';
export const TEMPLATE_SHEET_NAME_FR = 'Modèle Contacts';
export const TEMPLATE_HEADERS = ['Full Name*', 'Email Address*', 'Phone Number', 'Contact Type (Individual / Company)', 'Position / Title', 'Full Address'];
export const TEMPLATE_HEADERS_FR = ['Nom Complet*', 'Adresse Email*', 'Numéro de Téléphone', 'Type de Contact (Particulier / Entreprise)', 'Poste / Titre', 'Adresse Complète'];
export const TEMPLATE_SIGNATURE = 'LOVABLE_CONTACTS_TEMPLATE_V1';

// Example data for template download (10 rows)
export const CONTACT_EXAMPLE_DATA = [
  ['John Smith', 'john.smith@example.com', '+1 555-123-4567', 'Individual', 'Sales Manager', '123 Business Street, New York, NY 10001'],
  ['Acme Corporation', 'contact@acme.com', '+1 555-987-6543', 'Company', 'Headquarters', '456 Corporate Avenue, Los Angeles, CA 90001'],
  ['Sarah Johnson', 'sarah.j@email.com', '+1 555-456-7890', 'Individual', 'CEO', '789 Executive Lane, Chicago, IL 60601'],
  ['Tech Solutions Inc', 'info@techsolutions.com', '+1 555-321-0987', 'Company', 'IT Services', '321 Tech Park, San Francisco, CA 94102'],
  ['Michael Brown', 'mbrown@company.com', '+1 555-654-3210', 'Individual', 'Project Manager', '654 Oak Street, Boston, MA 02101'],
  ['Global Imports Ltd', 'sales@globalimports.com', '+1 555-789-0123', 'Company', 'Import/Export', '987 Harbor Road, Miami, FL 33101'],
  ['Emily Davis', 'emily.davis@email.com', '+1 555-234-5678', 'Individual', 'Marketing Director', '246 Marketing Blvd, Seattle, WA 98101'],
  ['Premier Services', 'contact@premierservices.com', '+1 555-876-5432', 'Company', 'Consulting', '135 Consultant Way, Denver, CO 80201'],
  ['David Wilson', 'dwilson@mail.com', '+1 555-345-6789', 'Individual', 'Engineer', '468 Tech Drive, Austin, TX 78701'],
  ['Innovation Labs', 'hello@innovationlabs.com', '+1 555-567-8901', 'Company', 'R&D', '579 Research Park, Portland, OR 97201'],
];

export const CONTACT_EXAMPLE_DATA_FR = [
  ['Jean Dupont', 'jean.dupont@example.com', '+33 1 23 45 67 89', 'Particulier', 'Directeur Commercial', '123 Rue du Commerce, 75001 Paris'],
  ['Société ABC', 'contact@abc.fr', '+33 1 98 76 54 32', 'Entreprise', 'Siège Social', '456 Avenue des Entreprises, 69001 Lyon'],
  ['Marie Martin', 'marie.m@email.fr', '+33 1 45 67 89 01', 'Particulier', 'PDG', '789 Boulevard Exécutif, 13001 Marseille'],
  ['Solutions Tech SARL', 'info@solutionstech.fr', '+33 1 32 10 98 76', 'Entreprise', 'Services IT', '321 Parc Technologique, 31000 Toulouse'],
  ['Pierre Bernard', 'pbernard@societe.fr', '+33 1 65 43 21 09', 'Particulier', 'Chef de Projet', '654 Rue du Chêne, 33000 Bordeaux'],
  ['Imports Globaux SA', 'ventes@importsglobaux.fr', '+33 1 78 90 12 34', 'Entreprise', 'Import/Export', '987 Quai du Port, 44000 Nantes'],
  ['Sophie Petit', 'sophie.petit@email.fr', '+33 1 23 45 67 89', 'Particulier', 'Directrice Marketing', '246 Boulevard Marketing, 59000 Lille'],
  ['Services Premium', 'contact@servicespremium.fr', '+33 1 87 65 43 21', 'Entreprise', 'Conseil', '135 Rue du Consultant, 67000 Strasbourg'],
  ['Thomas Moreau', 'tmoreau@mail.fr', '+33 1 34 56 78 90', 'Particulier', 'Ingénieur', '468 Avenue de la Tech, 34000 Montpellier'],
  ['Labs Innovation', 'bonjour@labsinnovation.fr', '+33 1 56 78 90 12', 'Entreprise', 'R&D', '579 Parc de Recherche, 35000 Rennes'],
];

export const generateExcelTemplate = (localizedHeaders?: string[], isFrench?: boolean): void => {
  // Use localized headers if provided, otherwise determine from language
  const headers = localizedHeaders || (isFrench ? TEMPLATE_HEADERS_FR : TEMPLATE_HEADERS);
  const filename = isFrench ? TEMPLATE_FILENAME_FR : TEMPLATE_FILENAME;
  const sheetName = isFrench ? TEMPLATE_SHEET_NAME_FR : TEMPLATE_SHEET_NAME;
  const exampleData = isFrench ? CONTACT_EXAMPLE_DATA_FR : CONTACT_EXAMPLE_DATA;
  
  // Create worksheet with headers and example data
  const dataArray = [headers, ...exampleData];
  const worksheet = XLSX.utils.aoa_to_sheet(dataArray);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const colWidths = [
    { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 35 }, { wch: 22 }, { wch: 40 }
  ];
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, filename);
};

export const detectTemplateFile = (file: File, headers: string[], sheetName?: string): { isTemplate: boolean; confidence: number; reason: string } => {
  let confidence = 0;
  const reasons: string[] = [];
  
  // Check filename (30% weight)
  if (file.name === TEMPLATE_FILENAME || file.name.includes('contacts-template')) {
    confidence += 30;
    reasons.push('filename matches template');
  }
  
  // Check sheet name (20% weight)
  if (sheetName === TEMPLATE_SHEET_NAME) {
    confidence += 20;
    reasons.push('sheet name matches template');
  }
  
  // Check headers exact match (40% weight)
  const headersMatch = TEMPLATE_HEADERS.length === headers.length && 
    TEMPLATE_HEADERS.every((header, index) => header === headers[index]);
  
  if (headersMatch) {
    confidence += 40;
    reasons.push('headers exactly match template');
  } else {
    // Check partial header match (20% weight)
    const matchingHeaders = TEMPLATE_HEADERS.filter(h => headers.includes(h));
    if (matchingHeaders.length >= 4) {
      confidence += 20;
      reasons.push(`${matchingHeaders.length}/${TEMPLATE_HEADERS.length} headers match template`);
    }
  }
  
  // Check file size indicates empty template (10% weight)
  if (file.size < 10000) { // Less than 10KB suggests empty template
    confidence += 10;
    reasons.push('file size suggests empty template');
  }
  
  const isTemplate = confidence >= 60; // 60% confidence threshold
  const reason = isTemplate ? reasons.join(', ') : 'does not match template characteristics';
  
  return {
    isTemplate,
    confidence,
    reason
  };
};

export const validateStructuredImport = (headers: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredHeaders = ['Full Name*', 'Email Address*'];
  
  requiredHeaders.forEach(requiredHeader => {
    if (!headers.includes(requiredHeader)) {
      errors.push(`Missing required column: "${requiredHeader}"`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const createStructuredColumnMapping = (headers: string[]): ColumnMapping => {
  const mapping: ColumnMapping = {};
  
  const fieldMap: Record<string, string> = {
    'Full Name*': 'fullName',
    'Email Address*': 'email',
    'Phone Number': 'phone',
    'Contact Type (Individual / Company)': 'contactType',
    'Position / Title': 'position',
    'Full Address': 'fullAddress'
  };
  
  headers.forEach(header => {
    if (fieldMap[header]) {
      mapping[header] = fieldMap[header];
    }
  });
  
  return mapping;
};
