import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useContactImport } from '../../hooks/useContactImport';
import { DynamicImportTab } from './DynamicImportTab';
import { StructuredImportTab } from './StructuredImportTab';
import { ImportPreviewTable } from './ImportPreviewTable';
import { generateExcelTemplate } from '../../utils/import.utils';

interface ContactImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactImportModal({ open, onOpenChange }: ContactImportModalProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('dynamic');
  const importHook = useContactImport();
  const isFrench = i18n.language === 'fr';

  const handleClose = () => {
    importHook.resetImport();
    onOpenChange(false);
  };

  const handleImportComplete = () => {
    importHook.resetImport();
    onOpenChange(false);
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate(undefined, isFrench);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {isFrench ? 'Importer des Contacts' : 'Import Contacts'}
          </DialogTitle>
          <DialogDescription>
            {isFrench ? 'Choisissez votre méthode d\'import et téléchargez vos données' : 'Choose your import method and upload your contact data'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!importHook.preview ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dynamic" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  {isFrench ? 'Import Dynamique' : 'Dynamic Import'}
                </TabsTrigger>
                <TabsTrigger value="structured" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {isFrench ? 'Import Structuré' : 'Structured Import'}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto">
                <TabsContent value="dynamic" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{isFrench ? 'Import Dynamique' : 'Dynamic Import'}</CardTitle>
                      <CardDescription>
                        {isFrench 
                          ? 'Téléchargez un fichier Excel avec vos propres en-têtes. Vous pourrez les associer aux champs requis.'
                          : 'Upload an Excel file with your own column headers. You\'ll be able to map them to our required fields.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DynamicImportTab importHook={importHook} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="structured" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{isFrench ? 'Import Structuré' : 'Structured Import'}</CardTitle>
                      <CardDescription>
                        {isFrench 
                          ? 'Utilisez notre modèle prédéfini pour une expérience d\'import optimale.'
                          : 'Use our predefined template for a seamless import experience.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StructuredImportTab 
                        importHook={importHook} 
                        onDownloadTemplate={handleDownloadTemplate}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {isFrench ? 'Aperçu de l\'Import' : 'Import Preview'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isFrench 
                      ? 'Vérifiez et validez vos données avant l\'import'
                      : 'Review and validate your data before importing'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={importHook.resetImport}>
                    {isFrench ? 'Recommencer' : 'Start Over'}
                  </Button>
                  <Button onClick={importHook.executeImport} disabled={importHook.isLoading}>
                    {importHook.isLoading 
                      ? (isFrench ? 'Import en cours...' : 'Importing...') 
                      : (isFrench ? 'Importer la Sélection' : 'Import Selected')}
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <ImportPreviewTable 
                  preview={importHook.preview}
                  onToggleRow={importHook.toggleRowSelection}
                  onToggleAll={importHook.toggleAllRowsSelection}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}