import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import AddMaintenanceLogModal from "../components/AddMaintenanceLogModal";
import { Package, MapPin, Calendar, ArrowLeft, Plus, Upload, FileText, Download, Trash2, User, Hash, Wrench } from "lucide-react";
interface MaintenanceLog {
  id: string;
  title: string;
  description: string;
  date?: string | null;
  createdAt: string;
}
interface FileAttachment {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  type: string;
}
export default function InventoryDetail() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    t
  } = useTranslation();
  console.log("InventoryDetail rendering with id:", id);
  const itemId = id ?? "0";
  useEffect(() => {
    document.title = `Item #${itemId} — Field Inventory`;
  }, [itemId]);

  // Mock inventory item data
  const item = useMemo(() => ({
    id: Number(itemId),
    name: itemId === '1' ? 'Hydraulic Pump Model X200' : itemId === '2' ? 'Field Testing Kit Pro' : 'Inventory Item ' + itemId,
    category: itemId === '1' ? 'Equipment' : itemId === '2' ? 'Tools' : 'General',
    status: itemId === '1' ? 'Available' : itemId === '2' ? 'In Use' : 'Available',
    location: itemId === '1' ? 'Warehouse A - Section 12' : itemId === '2' ? 'Field Unit 5' : 'Warehouse B',
    serialNumber: itemId === '1' ? 'HP-X200-001' : itemId === '2' ? 'FTK-PRO-042' : 'ITEM-' + itemId,
    quantity: itemId === '1' ? 3 : itemId === '2' ? 1 : 5,
    lastMaintenance: itemId === '1' ? '2024-01-10' : itemId === '2' ? '2024-01-05' : '2023-12-15',
    assignedTo: itemId === '2' ? 'John Smith' : undefined,
    tags: itemId === '1' ? ["Heavy Equipment", "Critical"] : itemId === '2' ? ["Portable", "Testing"] : ["Standard"],
    manufacturer: itemId === '1' ? 'HydroTech Industries' : itemId === '2' ? 'TestEquip Pro' : 'Generic Corp',
    model: itemId === '1' ? 'X200-Series' : itemId === '2' ? 'FTK-PRO-V2' : 'Standard',
    purchaseDate: '2023-05-15',
    warrantyExpiry: '2025-05-15'
  }), [itemId]);

  // Maintenance Logs state
  const logsStorageKey = `field_inventory_logs_${itemId}`;
  const [logs, setLogs] = useState<MaintenanceLog[]>(() => {
    const raw = localStorage.getItem(logsStorageKey);
    return raw ? JSON.parse(raw) : [];
  });
  const [addLogOpen, setAddLogOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem(logsStorageKey, JSON.stringify(logs));
  }, [logsStorageKey, logs]);

  // Files state
  const filesStorageKey = `field_inventory_files_${itemId}`;
  const [files, setFiles] = useState<FileAttachment[]>(() => {
    const raw = localStorage.getItem(filesStorageKey);
    return raw ? JSON.parse(raw) : [];
  });
  useEffect(() => {
    localStorage.setItem(filesStorageKey, JSON.stringify(files));
  }, [filesStorageKey, files]);
  const addLog = (logData: {
    title: string;
    description: string;
    date?: string | null;
  }) => {
    setLogs(prev => [{
      id: crypto.randomUUID(),
      title: logData.title,
      description: logData.description,
      date: logData.date ?? null,
      createdAt: new Date().toISOString()
    }, ...prev]);
  };
  const removeLog = (logId: string) => setLogs(prev => prev.filter(l => l.id !== logId));

  // File functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;
    Array.from(uploadedFiles).forEach(file => {
      const newFile: FileAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toLocaleDateString(),
        type: file.type || 'unknown'
      };
      setFiles(prev => [newFile, ...prev]);
    });

    // Reset input
    event.target.value = '';
  };
  const removeFile = (fileId: string) => setFiles(prev => prev.filter(f => f.id !== fileId));
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'status-success';
      case 'In Use':
        return 'status-info';
      case 'Maintenance':
        return 'status-warning';
      case 'Out of Stock':
        return 'status-destructive';
      default:
        return 'status-info';
    }
  };
  return <div className="space-y-6">
      <header className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">
        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-primary shadow-medium border-2 border-background">
                <Package className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground mb-1">
                  {item.name}
                </h1>
                <p className="text-sm text-muted-foreground mb-2">
                  Serial: {item.serialNumber}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  <Badge variant="outline">{item.category}</Badge>
                  {item.tags.slice(0, 2).map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                  {item.tags.length > 2 && <Badge variant="outline" className="text-xs">+{item.tags.length - 2}</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between p-6 lg:p-8">
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 hover:bg-background/80">
                <ArrowLeft className="h-4 w-4" />
                {t('common:back', 'Back to Inventory')}
              </Button>
              <div className="h-8 w-px bg-border/50" />
              <div className="flex items-center gap-6">
                
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    {item.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-3">
                    Serial: {item.serialNumber} • {item.location}
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(item.status)} px-3 py-1`}>{item.status}</Badge>
                    <Badge variant="outline" className="px-3 py-1">{item.category}</Badge>
                    {item.tags.map(tag => <Badge key={tag} variant="outline" className="px-3 py-1">{tag}</Badge>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-3 sm:p-4 lg:p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">{t('inventory_field:overview', 'Overview')}</TabsTrigger>
            <TabsTrigger value="maintenance">{t('inventory_field:maintenance', 'Maintenance')}</TabsTrigger>
            <TabsTrigger value="documents">{t('inventory_field:documents', 'Documents')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Item Information */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Item Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Serial: {item.serialNumber}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Last maintenance: {item.lastMaintenance}</span>
                  </div>
                  {item.assignedTo && <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Assigned to: {item.assignedTo}</span>
                    </div>}
                </CardContent>
              </Card>

              {/* Asset Details */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Asset Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                    <p className="text-sm font-semibold mt-1">{item.manufacturer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Model</label>
                    <p className="text-sm font-semibold mt-1">{item.model}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <p className="text-sm font-semibold mt-1">{item.quantity} units</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Purchase Date</label>
                    <p className="text-sm font-semibold mt-1">{item.purchaseDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Warranty Expiry</label>
                    <p className="text-sm font-semibold mt-1">{item.warrantyExpiry}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Maintenance logs: {logs.length}</p>
                    <p>Documents: {files.length}</p>
                    <p>Status: {item.status}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="maintenance">
            <Card className="shadow-card border-0">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Maintenance Logs</CardTitle>
                <Button size="sm" onClick={() => setAddLogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Log
                </Button>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? <p className="text-muted-foreground">No maintenance logs yet.</p> : <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(log => <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{log.title}</TableCell>
                          <TableCell>{log.description}</TableCell>
                          <TableCell>{log.date || new Date(log.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="destructive" onClick={() => removeLog(log.id)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>}
              </CardContent>
            </Card>
            <AddMaintenanceLogModal open={addLogOpen} onOpenChange={setAddLogOpen} onAdd={addLog} />
          </TabsContent>

          <TabsContent value="documents">
            <Card className="shadow-card border-0">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Documents</CardTitle>
                <div className="flex items-center gap-2">
                  <Input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif" />
                  <Button size="sm" onClick={() => document.getElementById('file-upload')?.click()} className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Files
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No documents uploaded yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload manuals, specs, or other files related to this asset.
                    </p>
                  </div> : <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map(file => <TableRow key={file.id} className="hover:bg-muted/50">
                          <TableCell className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{file.name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </Badge>
                          </TableCell>
                          <TableCell>{file.size}</TableCell>
                          <TableCell>{file.uploadedAt}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" className="gap-1">
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => removeFile(file.id)} className="gap-1">
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>;
}