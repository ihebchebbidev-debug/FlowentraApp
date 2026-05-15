import { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileText, AlertCircle, Download, FileSpreadsheet, ArrowLeft, ArrowRight, Check, Eye, Pencil } from 'lucide-react';
import type { BulkImportRequest, CreateContactRequest } from '@/types/contacts';
import * as XLSX from 'xlsx';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: BulkImportRequest) => Promise<void>;
  isLoading?: boolean;
}

type Step = 'upload' | 'preview';

interface ParsedContact extends CreateContactRequest {
  _selected: boolean;
  _rowIndex: number;
  _hasError: boolean;
  _errorMessage?: string;
}

const STATUS_OPTIONS = ['active', 'inactive', 'lead', 'customer', 'partner', 'prospect'];
const TYPE_OPTIONS = ['individual', 'company'];

export function BulkImportDialog({ open, onOpenChange, onImport, isLoading }: BulkImportDialogProps) {
  const { t } = useTranslation('contacts');
  const [csvData, setCsvData] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setFileName(file.name);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv') {
        const text = await file.text();
        setCsvData(text);
      } else if (['xlsx', 'xls'].includes(extension || '')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvContent = XLSX.utils.sheet_to_csv(firstSheet);
        setCsvData(csvContent);
      } else {
        setParseError(t('bulkImport.errors.unsupported_format'));
      }
    } catch (error) {
      setParseError(t('bulkImport.errors.file_read_error'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = (format: 'csv' | 'xlsx') => {
    // Localized headers - empty template with headers only
    const headers = [
      t('bulkImport.templateHeaders.firstName'),
      t('bulkImport.templateHeaders.lastName'),
      t('bulkImport.templateHeaders.email'),
      t('bulkImport.templateHeaders.phone'),
      t('bulkImport.templateHeaders.company'),
      t('bulkImport.templateHeaders.position'),
      t('bulkImport.templateHeaders.status'),
      t('bulkImport.templateHeaders.type'),
      t('bulkImport.templateHeaders.address'),
      t('bulkImport.templateHeaders.cin'),
      t('bulkImport.templateHeaders.matriculeFiscale'),
      t('bulkImport.templateHeaders.notes'),
      t('bulkImport.templateHeaders.favorite')
    ];

    if (format === 'csv') {
      const csvContent = headers.join(',');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'contacts_import_template.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
      
      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // firstName
        { wch: 15 }, // lastName
        { wch: 25 }, // email
        { wch: 15 }, // phone
        { wch: 20 }, // company
        { wch: 15 }, // position
        { wch: 10 }, // status
        { wch: 12 }, // type
        { wch: 30 }, // address
        { wch: 15 }, // cin
        { wch: 20 }, // matriculeFiscale
        { wch: 25 }, // notes
        { wch: 10 },  // favorite
      ];
      
      XLSX.writeFile(wb, 'contacts_import_template.xlsx');
    }
  };

  const parseAndPreview = () => {
    try {
      setParseError(null);
      
      const lines = csvData.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setParseError(t('bulkImport.errors.min_rows'));
        return;
      }

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const nameIndex = headers.indexOf('name');
      const firstNameIndex = headers.indexOf('firstname');
      const lastNameIndex = headers.indexOf('lastname');
      const emailIndex = headers.indexOf('email');

      if (emailIndex === -1) {
        setParseError(t('bulkImport.errors.email_required'));
        return;
      }
      if (nameIndex === -1 && firstNameIndex === -1) {
        setParseError(t('bulkImport.errors.name_required'));
        return;
      }

      const phoneIndex = headers.indexOf('phone');
      const companyIndex = headers.indexOf('company');
      const positionIndex = headers.indexOf('position');
      const statusIndex = headers.indexOf('status');
      const typeIndex = headers.indexOf('type');
      const addressIndex = headers.indexOf('address');
      const notesIndex = headers.indexOf('notes');
      const favoriteIndex = headers.indexOf('favorite');
      const cinIndex = headers.indexOf('cin');
      const matriculeFiscaleIndex = headers.indexOf('matriculefiscale');

      const contacts: ParsedContact[] = lines.slice(1).map((line, index) => {
        const values = parseCSVLine(line);
        
        let hasError = false;
        let errorMessages: string[] = [];

        if (values.length < 2) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.invalid_line', { line: index + 2 }));
        }

        let firstName = '';
        let lastName = '';
        if (firstNameIndex >= 0) {
          firstName = values[firstNameIndex] || '';
        }
        if (lastNameIndex >= 0) {
          lastName = values[lastNameIndex] || '';
        }
        if (nameIndex >= 0 && !firstName && !lastName) {
          const nameParts = (values[nameIndex] || '').split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        const email = values[emailIndex] || '';
        if (!email) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.missing_email'));
        } else {
          // Email format validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
            hasError = true;
            errorMessages.push(t('bulkImport.errors.invalid_email_format', 'Invalid email format'));
          }
        }

        // Phone format validation
        const phone = phoneIndex >= 0 ? values[phoneIndex] || '' : '';
        if (phone) {
          const phoneClean = phone.replace(/[\s\-\(\)\.]/g, '');
          const phoneRegex = /^\+?[0-9]{8,15}$/;
          if (!phoneRegex.test(phoneClean)) {
            hasError = true;
            errorMessages.push(t('bulkImport.errors.invalid_phone_format', 'Invalid phone format. Use 8-15 digits, optionally starting with +'));
          }
        }

        const contactType = typeIndex >= 0 && values[typeIndex]?.toLowerCase() === 'company' ? 'company' : 'individual';
        
        // Backend requires firstName and lastName for ALL contacts
        if (!firstName) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.missing_firstname'));
        }
        if (!lastName) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.missing_lastname'));
        }
        
        // Validate firstName max length (backend typically 100 chars)
        if (firstName && firstName.length > 100) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.firstname_too_long', 'First name must be less than 100 characters'));
        }
        
        // Validate lastName max length
        if (lastName && lastName.length > 100) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.lastname_too_long', 'Last name must be less than 100 characters'));
        }
        
        // Validate status
        const status = statusIndex >= 0 && values[statusIndex] ? values[statusIndex].toLowerCase() : 'active';
        if (statusIndex >= 0 && values[statusIndex] && !STATUS_OPTIONS.includes(status)) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.invalid_status', 'Invalid status. Allowed: active, inactive, lead, customer, partner, prospect'));
        }
        
        // Validate type
        const typeValue = typeIndex >= 0 ? values[typeIndex]?.toLowerCase() : '';
        if (typeValue && !TYPE_OPTIONS.includes(typeValue)) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.invalid_type', 'Invalid type. Allowed: individual, company'));
        }

        const favoriteValue = favoriteIndex >= 0 ? values[favoriteIndex]?.toLowerCase() : 'false';

        return {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          company: companyIndex >= 0 ? values[companyIndex] || '' : '',
          position: positionIndex >= 0 ? values[positionIndex] || '' : '',
          status: STATUS_OPTIONS.includes(status) ? status : 'active',
          type: contactType as any,
          address: addressIndex >= 0 ? values[addressIndex] || '' : '',
          cin: cinIndex >= 0 ? values[cinIndex] || '' : '',
          matriculeFiscale: matriculeFiscaleIndex >= 0 ? values[matriculeFiscaleIndex] || '' : '',
          favorite: favoriteValue === 'true' || favoriteValue === '1' || favoriteValue === 'yes',
          _selected: !hasError,
          _rowIndex: index + 2,
          _hasError: hasError,
          _errorMessage: errorMessages.join('; '),
        };
      });

      setParsedContacts(contacts);
      setStep('preview');
    } catch (error: any) {
      setParseError(error.message || t('bulkImport.errors.parse_failed'));
    }
  };

  const updateContact = (index: number, field: keyof ParsedContact, value: any) => {
    setParsedContacts(prev => prev.map((c, i) => {
      if (i !== index) return c;
      
      const updated = { ...c, [field]: value };
      
      // Update name if firstName or lastName changes
      if (field === 'firstName' || field === 'lastName') {
        updated.name = `${updated.firstName} ${updated.lastName}`.trim();
      }
      
      // Re-validate after edit - backend requires firstName and lastName for ALL contacts
      let hasError = false;
      let errorMessages: string[] = [];
      
      if (!updated.email) {
        hasError = true;
        errorMessages.push(t('bulkImport.errors.missing_email'));
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updated.email.trim())) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.invalid_email_format', 'Invalid email format'));
        }
      }
      
      if (updated.phone) {
        const phoneClean = updated.phone.replace(/[\s\-\(\)\.]/g, '');
        const phoneRegex = /^\+?[0-9]{8,15}$/;
        if (!phoneRegex.test(phoneClean)) {
          hasError = true;
          errorMessages.push(t('bulkImport.errors.invalid_phone_format', 'Invalid phone format'));
        }
      }
      
      if (!updated.firstName) {
        hasError = true;
        errorMessages.push(t('bulkImport.errors.missing_firstname'));
      }
      if (!updated.lastName) {
        hasError = true;
        errorMessages.push(t('bulkImport.errors.missing_lastname'));
      }
      
      updated._hasError = hasError;
      updated._errorMessage = errorMessages.join('; ');
      if (!hasError && !updated._selected) {
        updated._selected = true;
      }
      
      return updated;
    }));
  };

  const parseBackendError = (error: any): string => {
    // Try to parse validation errors from backend response
    if (error.message) {
      try {
        // Check if it contains a JSON error response
        const jsonMatch = error.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const errorObj = JSON.parse(jsonMatch[0]);
          if (errorObj.errors) {
            const errorMessages: string[] = [];
            Object.entries(errorObj.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                // Extract row number from field name like "Contacts[2].LastName"
                const rowMatch = field.match(/Contacts\[(\d+)\]/);
                const rowNum = rowMatch ? parseInt(rowMatch[1]) + 1 : null;
                const fieldName = field.replace(/Contacts\[\d+\]\./, '');
                messages.forEach((msg: string) => {
                  if (rowNum) {
                    errorMessages.push(`${t('bulkImport.errors.row')} ${rowNum}: ${fieldName} - ${msg}`);
                  } else {
                    errorMessages.push(`${fieldName}: ${msg}`);
                  }
                });
              }
            });
            if (errorMessages.length > 0) {
              return errorMessages.join('\n');
            }
          }
          if (errorObj.title) {
            return errorObj.title;
          }
        }
      } catch {
        // If parsing fails, return original message
      }
      return error.message;
    }
    return t('bulkImport.errors.parse_failed');
  };

  const handleImport = async () => {
    try {
      setParseError(null);
      
      const selectedContacts = parsedContacts
        .filter(c => c._selected && !c._hasError)
        .map(({ _selected, _rowIndex, _hasError, _errorMessage, ...contact }) => ({
          ...contact,
          phone: contact.phone || undefined,
          company: contact.company || undefined,
          position: contact.position || undefined,
          address: contact.address || undefined,
          cin: contact.cin || undefined,
          matriculeFiscale: contact.matriculeFiscale || undefined,
        }));

      if (selectedContacts.length === 0) {
        setParseError(t('bulkImport.errors.no_contacts_selected'));
        return;
      }

      await onImport({
        contacts: selectedContacts,
        skipDuplicates,
        updateExisting,
      });

      resetDialog();
    } catch (error: any) {
      setParseError(parseBackendError(error));
    }
  };

  const resetDialog = () => {
    setCsvData('');
    setSkipDuplicates(true);
    setUpdateExisting(false);
    setFileName(null);
    setStep('upload');
    setParsedContacts([]);
    setParseError(null);
    setEditingIndex(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const toggleContactSelection = (index: number) => {
    setParsedContacts(prev => 
      prev.map((c, i) => i === index ? { ...c, _selected: !c._selected } : c)
    );
  };

  const toggleAllSelection = (selected: boolean) => {
    setParsedContacts(prev => 
      prev.map(c => ({ ...c, _selected: c._hasError ? false : selected }))
    );
  };

  const selectedCount = useMemo(() => 
    parsedContacts.filter(c => c._selected && !c._hasError).length, 
    [parsedContacts]
  );

  const validCount = useMemo(() => 
    parsedContacts.filter(c => !c._hasError).length, 
    [parsedContacts]
  );

  const errorCount = useMemo(() => 
    parsedContacts.filter(c => c._hasError).length, 
    [parsedContacts]
  );

  const sampleCsv = `firstName,lastName,email,phone,company,position,status,type,address,cin,matriculeFiscale,notes,favorite
John,Doe,john@example.com,+1234567890,Tech Corp,CEO,active,individual,"123 Main St",12345678,1234567ABC,Important client,false
Jane,Smith,jane@example.com,+9876543210,ABC Inc,Manager,lead,individual,"456 Oak Ave",87654321,9876543XYZ,Met at conference,true
Acme,Corp,info@acme.com,+1122334455,Acme Corporation,Sales,customer,company,"789 Blvd",,ACME123456,B2B partner,false`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            {step === 'upload' ? (
              <>
                <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('bulkImport.title')}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('bulkImport.preview_title')}
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {step === 'upload' ? t('bulkImport.description') : t('bulkImport.preview_description')}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="space-y-4 overflow-y-auto flex-1">
            {/* Download Template Section */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => downloadTemplate('csv')}
                className="flex-1 text-xs sm:text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('bulkImport.download_csv')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadTemplate('xlsx')}
                className="flex-1 text-xs sm:text-sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {t('bulkImport.download_excel')}
              </Button>
            </div>

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileSpreadsheet className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs sm:text-sm font-medium">{t('bulkImport.upload_title')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('bulkImport.upload_formats')}</p>
                {fileName && (
                  <p className="text-xs sm:text-sm text-primary mt-2 font-medium">{fileName}</p>
                )}
              </label>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2 text-xs sm:text-sm">{t('bulkImport.format_title')}</div>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>{t('bulkImport.format_required')}: <code className="text-xs">firstName</code>, <code className="text-xs">lastName</code>, <code className="text-xs">email</code></li>
                  <li>{t('bulkImport.format_optional')}: <code className="text-xs">phone</code>, <code className="text-xs">company</code>, <code className="text-xs">position</code>, <code className="text-xs">status</code>, <code className="text-xs">type</code>, <code className="text-xs">address</code>, <code className="text-xs">notes</code>, <code className="text-xs">favorite</code></li>
                  <li>{t('bulkImport.format_status')}: active, inactive, lead, customer, partner, prospect</li>
                  <li>{t('bulkImport.format_type')}: individual, company</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="csv-data" className="text-xs sm:text-sm">{t('bulkImport.csv_data')}</Label>
              <Textarea
                id="csv-data"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder={sampleCsv}
                rows={5}
                className="font-mono text-xs mt-1"
              />
            </div>

            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">{parseError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="skip-duplicates"
                  checked={skipDuplicates}
                  onCheckedChange={setSkipDuplicates}
                />
                <Label htmlFor="skip-duplicates" className="cursor-pointer text-xs sm:text-sm">
                  {t('bulkImport.skip_duplicates')}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="update-existing"
                  checked={updateExisting}
                  onCheckedChange={setUpdateExisting}
                />
                <Label htmlFor="update-existing" className="cursor-pointer text-xs sm:text-sm">
                  {t('bulkImport.update_existing')}
                </Label>
              </div>
            </div>

            <details className="text-xs sm:text-sm">
              <summary className="cursor-pointer font-medium">{t('bulkImport.show_sample')}</summary>
              <pre className="mt-2 p-2 sm:p-3 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap">
                {sampleCsv}
              </pre>
            </details>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            {/* Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {t('bulkImport.total_rows')}: {parsedContacts.length}
              </Badge>
              <Badge variant="default" className="text-xs bg-success">
                {t('bulkImport.valid')}: {validCount}
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {t('bulkImport.errors_count')}: {errorCount}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {t('bulkImport.selected')}: {selectedCount}
              </Badge>
            </div>

            {/* Select All & Edit hint */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedCount === validCount && validCount > 0}
                  onCheckedChange={(checked) => toggleAllSelection(!!checked)}
                />
                <Label htmlFor="select-all" className="cursor-pointer text-xs sm:text-sm">
                  {t('bulkImport.select_all')}
                </Label>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                {t('bulkImport.click_to_edit')}
              </span>
            </div>

            {/* Preview Table */}
            <ScrollArea className="flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-xs p-2">#</TableHead>
                    <TableHead className="text-xs p-2 min-w-[120px]">{t('bulkImport.columns.name')}</TableHead>
                    <TableHead className="text-xs p-2 min-w-[150px]">{t('bulkImport.columns.email')}</TableHead>
                    <TableHead className="text-xs p-2 min-w-[100px] hidden sm:table-cell">{t('bulkImport.columns.phone')}</TableHead>
                    <TableHead className="text-xs p-2 min-w-[120px] hidden md:table-cell">{t('bulkImport.columns.company')}</TableHead>
                    <TableHead className="text-xs p-2 min-w-[80px]">{t('bulkImport.columns.type')}</TableHead>
                    <TableHead className="text-xs p-2 min-w-[80px]">{t('bulkImport.columns.status_col')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedContacts.map((contact, index) => (
                    <TableRow 
                      key={index} 
                      className={contact._hasError ? 'bg-destructive/10' : contact._selected ? 'bg-primary/5' : ''}
                    >
                      <TableCell className="p-2">
                        <Checkbox
                          checked={contact._selected}
                          onCheckedChange={() => toggleContactSelection(index)}
                          disabled={contact._hasError}
                        />
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {editingIndex === index ? (
                          <div className="flex flex-col gap-1">
                            <Input
                              value={contact.firstName}
                              onChange={(e) => updateContact(index, 'firstName', e.target.value)}
                              placeholder={t('bulkImport.placeholders.firstName')}
                              className="h-7 text-xs"
                            />
                            <Input
                              value={contact.lastName}
                              onChange={(e) => updateContact(index, 'lastName', e.target.value)}
                              placeholder={t('bulkImport.placeholders.lastName')}
                              className="h-7 text-xs"
                            />
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                            onClick={() => setEditingIndex(index)}
                          >
                            <div className="font-medium">{contact.name || '-'}</div>
                            {contact._hasError && (
                              <span className="text-destructive text-xs">{contact._errorMessage}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs p-2">
                        {editingIndex === index ? (
                          <Input
                            value={contact.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                            placeholder={t('bulkImport.placeholders.email')}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                            onClick={() => setEditingIndex(index)}
                          >
                            {contact.email || '-'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs p-2 hidden sm:table-cell">
                        {editingIndex === index ? (
                          <Input
                            value={contact.phone || ''}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                            placeholder={t('bulkImport.placeholders.phone')}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                            onClick={() => setEditingIndex(index)}
                          >
                            {contact.phone || '-'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs p-2 hidden md:table-cell">
                        {editingIndex === index ? (
                          <Input
                            value={contact.company || ''}
                            onChange={(e) => updateContact(index, 'company', e.target.value)}
                            placeholder={t('bulkImport.placeholders.company')}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                            onClick={() => setEditingIndex(index)}
                          >
                            {contact.company || '-'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        {editingIndex === index ? (
                          <Select
                            value={contact.type as string}
                            onValueChange={(value) => updateContact(index, 'type', value)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPE_OPTIONS.map(type => (
                                <SelectItem key={type} value={type} className="text-xs">
                                  {t(`bulkImport.type_options.${type}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div 
                            className="cursor-pointer"
                            onClick={() => setEditingIndex(index)}
                          >
                            <Badge variant="outline" className="text-xs">
                              {t(`bulkImport.type_options.${contact.type}`)}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-2">
                        {editingIndex === index ? (
                          <Select
                            value={contact.status as string}
                            onValueChange={(value) => updateContact(index, 'status', value)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(status => (
                                <SelectItem key={status} value={status} className="text-xs">
                                  {t(`bulkImport.status_options.${status}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div 
                            className="cursor-pointer"
                            onClick={() => setEditingIndex(index)}
                          >
                            {contact._hasError ? (
                              <Badge variant="destructive" className="text-xs">{t('bulkImport.error')}</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {t(`bulkImport.status_options.${contact.status}`)}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {parseError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">{parseError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 mt-4 pt-4 border-t">
          {step === 'upload' ? (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
                {t('bulkImport.cancel')}
              </Button>
              <Button onClick={parseAndPreview} disabled={!csvData.trim()} className="w-full sm:w-auto">
                <ArrowRight className="mr-2 h-4 w-4" />
                {t('bulkImport.preview_button')}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => { setStep('upload'); setEditingIndex(null); }} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('bulkImport.back')}
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isLoading || selectedCount === 0} 
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {t('bulkImport.import_selected', { count: selectedCount })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
