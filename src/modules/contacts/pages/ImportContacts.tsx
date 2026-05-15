import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet, ArrowLeft, Users } from 'lucide-react';
import { useContactImport } from '../hooks/useContactImport';
import { DynamicImportTab } from '../components/import/DynamicImportTab';
import { StructuredImportTab } from '../components/import/StructuredImportTab';
import { ImportPreviewTable } from '../components/import/ImportPreviewTable';
import { ExcelVisualizer } from '../components/import/ExcelVisualizer';
import { generateExcelTemplate } from '../utils/import.utils';

export default function ImportContacts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dynamic');
  const importHook = useContactImport();

  const handleBack = () => {
    navigate('/dashboard/contacts');
  };

  const handleImportComplete = () => {
    importHook.resetImport();
    navigate('/dashboard/contacts');
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate();
  };

  const getStepTitle = () => {
    switch (importHook.currentStep) {
      case 'upload': return 'Import Contacts';
      case 'analyzing': return 'AI Analysis';
      case 'edit': return 'Edit Data';
      case 'mapping': return 'Map Columns';
      case 'preview': return 'Preview & Import';
      default: return 'Import Contacts';
    }
  };

  const getStepDescription = () => {
    switch (importHook.currentStep) {
      case 'upload': return 'Choose your import method and upload your contact data';
      case 'analyzing': return 'FlowSolutio AI is analyzing your data and predicting column mappings';
      case 'edit': return 'Review and edit your data in the spreadsheet editor';
      case 'mapping': return 'Map your columns to the required contact fields';
      case 'preview': return 'Review and validate your data before importing';
      default: return 'Choose your import method and upload your contact data';
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'upload', label: 'Upload' },
      { key: 'analyzing', label: 'AI Analysis' },
      { key: 'mapping', label: 'Map' },
      { key: 'preview', label: 'Preview' }
    ];

    const currentIndex = steps.findIndex(step => step.key === importHook.currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentIndex
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            <span className={`ml-2 text-sm ${
              index <= currentIndex ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-8 h-px mx-3 ${
                index < currentIndex ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contacts
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 shadow-soft">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  {getStepTitle()}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {getStepDescription()}
                </p>
              </div>
            </div>
            
            {importHook.currentStep === 'preview' && (
              <Button variant="outline" onClick={importHook.resetImport}>
                Start Over
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderStepIndicator()}
        
        {importHook.currentStep === 'upload' && (
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex justify-center">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="dynamic" className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="hidden sm:inline">Dynamic Import</span>
                    <span className="sm:hidden">Dynamic</span>
                  </TabsTrigger>
                  <TabsTrigger value="structured" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Structured Import</span>
                    <span className="sm:hidden">Structured</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dynamic" className="space-y-6">
                <Card className="shadow-card border-0">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl sm:text-2xl">Dynamic Import</CardTitle>
                    <CardDescription className="text-base">
                      Upload an Excel file with your own column headers. You'll be able to map them to our required fields.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <DynamicImportTab importHook={importHook} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="structured" className="space-y-6">
                <Card className="shadow-card border-0">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl sm:text-2xl">Structured Import</CardTitle>
                    <CardDescription className="text-base">
                      Use our predefined template for a seamless import experience.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <StructuredImportTab 
                      importHook={importHook} 
                      onDownloadTemplate={handleDownloadTemplate}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {importHook.currentStep === 'analyzing' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">FlowSolutio AI Analysis</h3>
                <p className="text-muted-foreground font-medium">{importHook.analysisMessage}</p>
                <p className="text-sm text-muted-foreground/70">Processing your Excel data intelligently</p>
              </div>
              
              <div className="w-full max-w-md">
                <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out shadow-sm" 
                    style={{ width: `${importHook.uploadProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-muted-foreground">{importHook.uploadProgress}% Complete</p>
                  <p className="text-xs text-muted-foreground/60">AI Processing</p>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 max-w-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-muted-foreground">Real-time AI Processing</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  🤖 Intelligent column detection • 🧠 Semantic analysis • 🎯 Smart field matching
                </p>
              </div>
            </div>
          </div>
        )}

        {importHook.currentStep === 'edit' && (
          <div className="max-w-7xl mx-auto">
            <ExcelVisualizer
              data={importHook.rawData}
              headers={importHook.headers}
              onDataChange={importHook.proceedFromEditor}
              onContinue={() => {}}
              onBack={() => importHook.setCurrentStep('upload')}
              fileName={importHook.fileName}
            />
          </div>
        )}

        {importHook.currentStep === 'mapping' && (
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-card border-0">
              <CardContent className="p-6 sm:p-8">
                <DynamicImportTab importHook={importHook} />
              </CardContent>
            </Card>
          </div>
        )}

        {importHook.currentStep === 'preview' && (
          <div className="space-y-6">
            {/* Preview Header */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-3">
                      <Users className="h-6 w-6 text-primary" />
                      Import Preview
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Review and validate your data before importing. File: <strong>{importHook.fileName}</strong>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => importHook.setCurrentStep('mapping')}>
                      Back to Mapping
                    </Button>
                    <Button 
                      onClick={async () => {
                        await importHook.executeImport();
                        handleImportComplete();
                      }} 
                      disabled={importHook.isLoading}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {importHook.isLoading ? 'Importing...' : 'Import Selected'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Preview Table */}
            <Card className="shadow-card border-0">
              <CardContent className="p-0">
                <div className="h-[600px] sm:h-[700px] lg:h-[800px]">
                  <ImportPreviewTable 
                    preview={importHook.preview!}
                    onToggleRow={importHook.toggleRowSelection}
                    onToggleAll={importHook.toggleAllRowsSelection}
                    onDeleteDuplicates={importHook.deleteDuplicateRows}
                    onKeepDuplicates={importHook.keepDuplicateRows}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}