import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { contactsApi } from '@/services/contactsApi';
import { 
  ImportPreview, 
  ColumnMapping, 
  ImportedRow, 
  ImportResult 
} from '../types/import';
import { 
  parseExcelFile, 
  generateImportPreview, 
  validateStructuredImport,
  createStructuredColumnMapping 
} from '../utils/import.utils';
import { aiColumnMapper } from '../services/aiColumnMapper.service';

export const useContactImport = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importMode, setImportMode] = useState<'dynamic' | 'structured' | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'edit' | 'mapping' | 'preview'>('upload');
  const [rawData, setRawData] = useState<any[]>([]);
  const [editedData, setEditedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [editedHeaders, setEditedHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string>('');
  const [fileMetadata, setFileMetadata] = useState<any>(null);

  const detectLanguage = useCallback((headers: string[], data: any[][]): 'en' | 'fr' | 'de' => {
    const text = [...headers, ...data.flat()].join(' ').toLowerCase();
    
    // Simple language detection based on common words
    const frenchWords = ['nom', 'prénom', 'email', 'téléphone', 'adresse', 'ville', 'pays'];
    const germanWords = ['name', 'vorname', 'nachname', 'telefon', 'adresse', 'stadt', 'land'];
    
    const frenchMatches = frenchWords.filter(word => text.includes(word)).length;
    const germanMatches = germanWords.filter(word => text.includes(word)).length;
    
    if (frenchMatches > germanMatches && frenchMatches > 0) return 'fr';
    if (germanMatches > frenchMatches && germanMatches > 0) return 'de';
    return 'en';
  }, []);

  const processFile = useCallback(async (file: File, mode: 'dynamic' | 'structured') => {
    console.log('Processing file:', file.name, 'Mode:', mode);
    setIsLoading(true);
    setUploadProgress(0);
    setImportMode(mode);
    setFileName(file.name);

    try {
      // Parse file first
      setAnalysisMessage('📄 Reading Excel file...');
      setUploadProgress(5);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Parsing file...');
      const result = await parseExcelFile(file);
      const { headers: fileHeaders, data, metadata } = result;
      console.log('File parsed successfully. Headers:', fileHeaders.length, 'Data rows:', data.length);
      console.log('File metadata:', metadata);
      
      setFileMetadata(metadata);
      
      setAnalysisMessage(metadata.isLargeDataset ? '📊 Large dataset detected - optimizing...' : '✅ File parsed successfully');
      setUploadProgress(15);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (fileHeaders.length === 0) {
        throw new Error('No headers found in the file');
      }

      if (data.length === 0) {
        throw new Error('No data rows found in the file');
      }

      // Set data first
      setHeaders(fileHeaders);
      setRawData(data);
      setEditedData(data);
      setEditedHeaders(fileHeaders);
      
      // Start AI analysis with granular progress
      setCurrentStep('analyzing');
      setUploadProgress(20);
      setAnalysisMessage('🔍 Examining column headers...');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setUploadProgress(25);
      setAnalysisMessage('📊 Analyzing sample data patterns...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let finalMapping: ColumnMapping = {};
      let predictions: any = null;
      
      try {
        // Language detection
        setUploadProgress(35);
        setAnalysisMessage('🌍 Detecting data language...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const language = detectLanguage(fileHeaders, data);
        console.log('Detected language:', language);
        
        setUploadProgress(45);
        setAnalysisMessage(`🤖 Initializing FlowSolutio AI (${language.toUpperCase()})...`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setUploadProgress(55);
        setAnalysisMessage('🧠 AI processing column semantics...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setUploadProgress(65);
        setAnalysisMessage('🎯 Matching fields to database schema...');
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // Get AI predictions
        setUploadProgress(75);
        setAnalysisMessage('⚡ Generating predictions...');
        
        const aiResult = await aiColumnMapper.predictColumnMapping(fileHeaders, data, language);
        console.log('AI predictions received:', aiResult);
        
        predictions = aiResult;
        
        setUploadProgress(85);
        setAnalysisMessage('🔧 Applying intelligent mappings...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Apply AI predictions
        aiResult.predictions.forEach(prediction => {
          if (prediction.targetField && prediction.confidence > 0.5) {
            finalMapping[prediction.sourceColumn] = prediction.targetField;
          }
        });
        
        // Check if template file for optimized messaging
        const isTemplate = fileMetadata?.templateDetection?.isTemplate;
        const mappingType = isTemplate ? 'template' : (aiResult.aiUsed ? 'AI' : 'smart');
        
        setUploadProgress(95);
        setAnalysisMessage(isTemplate ? '📋 Template mapping optimized!' : 
                          aiResult.aiUsed ? '✨ AI analysis complete!' : '✅ Smart mapping complete!');
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (aiError) {
        console.log('AI analysis failed, using manual mapping:', aiError.message);
        
        setUploadProgress(70);
        setAnalysisMessage('⚠️ AI unavailable, using smart fallback...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fallback to empty mapping
        fileHeaders.forEach(header => {
          finalMapping[header] = null;
        });
        
        setUploadProgress(90);
        setAnalysisMessage('🔧 Preparing manual mapping...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Apply final state in one update
      setAiPredictions(predictions);
      setColumnMapping(finalMapping);
      setUploadProgress(100);
      setAnalysisMessage('🎉 Ready for column mapping!');
      
      // Brief pause to show completion
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setCurrentStep('mapping');
      console.log('Applied column mapping:', finalMapping);

      if (mode === 'structured') {
        const validation = validateStructuredImport(fileHeaders);
        if (!validation.isValid) {
          toast({
            title: "Structure Validation Failed",
            description: validation.errors.join(', '),
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "File processed successfully!",
        description: `Found ${fileHeaders.length} columns${metadata.isLargeDataset ? ` (${metadata.totalRows.toLocaleString()} total rows, optimized for performance)` : ''}`
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process file';
      console.error('ProcessFile error:', error);
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive"
      });
      resetImport();
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setAnalysisMessage('');
    }
  }, [toast, detectLanguage]);

  const proceedFromEditor = useCallback((newData: any[], newHeaders: string[]) => {
    setEditedData(newData);
    setEditedHeaders(newHeaders);
    setCurrentStep('mapping');

    if (importMode === 'structured') {
      // For structured import, create automatic mapping and go to preview
      const mapping = createStructuredColumnMapping(newHeaders);
      setColumnMapping(mapping);
      
      const previewData = generateImportPreview(newData, mapping);
      setPreview(previewData);
      setCurrentStep('preview');
    }
  }, [importMode]);

  const updateColumnMapping = useCallback((mapping: ColumnMapping) => {
    setColumnMapping(mapping);
  }, []);

  const generatePreview = useCallback(() => {
    if (editedData.length > 0 && Object.keys(columnMapping).length > 0) {
      const previewData = generateImportPreview(editedData, columnMapping);
      setPreview(previewData);
      setCurrentStep('preview');
    }
  }, [editedData, columnMapping]);

  const toggleRowSelection = useCallback((rowId: string) => {
    setPreview(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        rows: prev.rows.map(row => 
          row.id === rowId 
            ? { ...row, selected: !row.selected }
            : row
        )
      };
    });
  }, []);

  const toggleAllRowsSelection = useCallback((selected: boolean) => {
    setPreview(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        rows: prev.rows.map(row => 
          row.status === 'valid' 
            ? { ...row, selected }
            : row
        )
      };
    });
  }, []);

  const executeImport = useCallback(async (): Promise<ImportResult> => {
    if (!preview) {
      throw new Error('No preview data available');
    }

    const selectedRows = preview.rows.filter(row => row.selected && row.status === 'valid');
    
    if (selectedRows.length === 0) {
      throw new Error('No valid rows selected for import');
    }

    setIsLoading(true);

    try {
      // Prepare contacts for bulk import
      const contactsToImport = selectedRows.map(row => {
        const fullName = row.data.fullName || row.data.companyName || 'Unknown Contact';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          firstName,
          lastName,
          name: fullName,
          email: row.data.email || '',
          phone: row.data.phone || undefined,
          company: row.data.companyName || undefined,
          position: row.data.position || undefined,
          status: 'active',
          type: row.data.contactType === 'Company' ? 'company' : 'individual',
          address: row.data.fullAddress || undefined,
          favorite: false
        };
      });

      // Use bulk import API
      const result = await contactsApi.bulkImportContacts({
        contacts: contactsToImport,
        skipDuplicates: true,
        updateExisting: false
      });

      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.successCount} contacts${result.failedCount > 0 ? `, ${result.failedCount} failed` : ''}`
      });

      return {
        successCount: result.successCount,
        errorCount: result.failedCount,
        errors: result.errors
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      toast({
        title: "Import Failed",
        description: message,
        variant: "destructive"
      });
      
      return {
        successCount: 0,
        errorCount: selectedRows.length,
        errors: [message]
      };
    } finally {
      setIsLoading(false);
    }
  }, [preview, toast]);

  const resetImport = useCallback(() => {
    setImportMode(null);
    setCurrentStep('upload');
    setRawData([]);
    setEditedData([]);
    setHeaders([]);
    setEditedHeaders([]);
    setColumnMapping({});
    setPreview(null);
    setFileName('');
    setUploadProgress(0);
    setAiPredictions(null);
    setAnalysisMessage('');
    setFileMetadata(null);
  }, []);

  const deleteDuplicateRows = useCallback((duplicateIds: string[]) => {
    if (!preview) return;
    
    const updatedRows = preview.rows.filter(row => !duplicateIds.includes(row.id));
    const validRows = updatedRows.filter(row => row.status === 'valid');
    const invalidRows = updatedRows.filter(row => row.status === 'invalid');
    const duplicateRows = updatedRows.filter(row => row.status === 'duplicate');
    const emptyRows = updatedRows.filter(row => row.status === 'empty');
    
    setPreview({
      ...preview,
      rows: updatedRows,
      totalRows: updatedRows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      duplicateRows: duplicateRows.length,
      emptyRows: emptyRows.length
    });
    
    toast({
      title: "Duplicates removed",
      description: `${duplicateIds.length} duplicate records have been removed.`
    });
  }, [preview, toast]);

  const keepDuplicateRows = useCallback((duplicateIds: string[]) => {
    if (!preview) return;
    
    const updatedRows = preview.rows.map(row => 
      duplicateIds.includes(row.id) 
        ? { ...row, status: 'valid' as const, selected: true }
        : row
    );
    
    const validRows = updatedRows.filter(row => row.status === 'valid');
    const duplicateRows = updatedRows.filter(row => row.status === 'duplicate');
    
    setPreview({
      ...preview,
      rows: updatedRows,
      validRows: validRows.length,
      duplicateRows: duplicateRows.length
    });
    
    toast({
      title: "Duplicates kept",
      description: `${duplicateIds.length} duplicate records will be imported as separate contacts.`
    });
  }, [preview, toast]);

  console.log('Hook state - headers:', editedHeaders.length, 'currentStep:', currentStep, 'isLoading:', isLoading);
  
  return {
    // State
    isLoading,
    uploadProgress,
    importMode,
    currentStep,
    headers: editedHeaders,
    rawData: editedData,
    columnMapping,
    preview,
    fileName,
    aiPredictions,
    analysisMessage,
    fileMetadata,

    // Actions
    processFile,
    proceedFromEditor,
    updateColumnMapping,
    generatePreview,
    toggleRowSelection,
    toggleAllRowsSelection,
    executeImport,
    resetImport,
    deleteDuplicateRows,
    keepDuplicateRows,
    
    // Navigation
    setCurrentStep
  };
};