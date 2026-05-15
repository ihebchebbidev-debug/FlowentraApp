import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Edit, Package, Building, Car, AlertTriangle, CheckCircle, DollarSign, Clock, User, Warehouse, Plus, Trash2, Download, Upload, FileText, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TransferModal } from "../../articles/components/TransferModal";

// Mock inventory data - replace with real data from Supabase
const mockInventoryItems = [
  {
    id: "1",
    name: "Screwdriver Set",
    sku: "TOOL-001",
    category: "Tools",
    stock: 25,
    minStock: 10,
    price: 29.99,
    sellPrice: 49.99,
    status: "available",
    lastUsed: "2024-01-15",
    lastUsedBy: "John Smith",
    location: "Main Warehouse",
    locationType: "warehouse",
    supplier: "ToolCorp Industries",
    description: "Professional 10-piece screwdriver set with various head types",
    notes: "Check condition regularly. Replace worn tips as needed.",
    tags: ["Tools", "Manual", "Essential"]
  },
  {
    id: "2", 
    name: "Electrical Wire 2.5mm",
    sku: "WIRE-025",
    category: "Electrical",
    stock: 5,
    minStock: 15,
    price: 1.50,
    sellPrice: 2.25,
    status: "low_stock",
    lastUsed: "2024-01-20",
    lastUsedBy: "Mike Johnson",
    location: "Storage Room B",
    locationType: "warehouse",
    supplier: "ElectroSupply Co.",
    description: "High-quality copper wire for electrical installations",
    notes: "Reorder when stock reaches minimum level.",
    tags: ["Electrical", "Wire", "Copper"]
  },
  {
    id: "3",
    name: "Safety Helmet",
    sku: "SAFE-001",
    category: "Safety",
    stock: 0,
    minStock: 5,
    price: 15.00,
    sellPrice: 25.00,
    status: "out_of_stock",
    lastUsed: "2024-01-10",
    lastUsedBy: "Sarah Davis",
    location: "Main Warehouse",
    locationType: "warehouse",
    supplier: "SafetyFirst Ltd.",
    description: "OSHA compliant hard hat with adjustable suspension",
    notes: "Urgent reorder required - out of stock.",
    tags: ["Safety", "PPE", "Required"]
  },
  {
    id: "4",
    name: "Pipe Wrench 12 inch",
    sku: "PLUMB-003",
    category: "Plumbing",
    stock: 18,
    minStock: 8,
    price: 35.50,
    sellPrice: 55.00,
    status: "available",
    lastUsed: "2024-01-18",
    lastUsedBy: "Tom Wilson",
    location: "Tech Van - Tom Wilson",
    locationType: "vehicle",
    supplier: "PlumbingPro Inc.",
    description: "Heavy-duty pipe wrench for professional plumbing work",
    notes: "Stored in Tom's service vehicle for field work.",
    tags: ["Plumbing", "Mobile", "Heavy-duty"]
  },
  {
    id: "5",
    name: "LED Light Bulb 60W",
    sku: "ELEC-LED-60",
    category: "Electrical",
    stock: 8,
    minStock: 20,
    price: 12.99,
    sellPrice: 19.99,
    status: "low_stock",
    lastUsed: "2024-01-22",
    lastUsedBy: "Lisa Chen",
    location: "Tech Van - Mike Johnson",
    locationType: "vehicle",
    supplier: "BrightLight Solutions",
    description: "Energy-efficient LED bulb with 25,000 hour lifespan",
    notes: "Popular item - consider increasing stock levels.",
    tags: ["Electrical", "LED", "Energy-efficient"]
  }
];

interface MaintenanceLog {
  id: string;
  date: string;
  type: string;
  description: string;
  performedBy: string;
  cost?: number;
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "status-success";
    case "low_stock":
      return "status-warning";
    case "out_of_stock":
      return "status-error";
    default:
      return "status-info";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "available":
      return CheckCircle;
    case "low_stock":
    case "out_of_stock":
      return AlertTriangle;
    default:
      return Package;
  }
};

const getLocationIcon = (locationType: string) => {
  switch (locationType) {
    case "warehouse":
      return Building;
    case "vehicle":
      return Car;
    default:
      return Warehouse;
  }
};

export default function InventoryDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const item = mockInventoryItems.find(i => i.id === id);

  // State for maintenance logs and files
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [transferModal, setTransferModal] = useState<{isOpen: boolean, article?: any}>({isOpen: false});
  const [newLog, setNewLog] = useState({
    type: "",
    description: "",
    cost: ""
  });

  // Load data from localStorage on mount
  useEffect(() => {
    if (item) {
      const savedLogs = localStorage.getItem(`maintenance-logs-${item.id}`);
      const savedFiles = localStorage.getItem(`files-${item.id}`);
      
      if (savedLogs) {
        setMaintenanceLogs(JSON.parse(savedLogs));
      }
      if (savedFiles) {
        setFiles(JSON.parse(savedFiles));
      }
    }
  }, [item]);

  // Save logs to localStorage when updated
  useEffect(() => {
    if (item) {
      localStorage.setItem(`maintenance-logs-${item.id}`, JSON.stringify(maintenanceLogs));
    }
  }, [maintenanceLogs, item]);

  // Save files to localStorage when updated
  useEffect(() => {
    if (item) {
      localStorage.setItem(`files-${item.id}`, JSON.stringify(files));
    }
  }, [files, item]);

  const addLog = () => {
    if (!newLog.type || !newLog.description) return;

    const log: MaintenanceLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      type: newLog.type,
      description: newLog.description,
      performedBy: "Current User", // Replace with actual user
      cost: newLog.cost ? parseFloat(newLog.cost) : undefined
    };

    setMaintenanceLogs([...maintenanceLogs, log]);
    setNewLog({ type: "", description: "", cost: "" });
    setIsAddLogModalOpen(false);
    
    toast({
      title: "Success",
      description: "Maintenance log added successfully.",
    });
  };

  const removeLog = (logId: string) => {
    setMaintenanceLogs(maintenanceLogs.filter(log => log.id !== logId));
    toast({
      title: "Success",
      description: "Maintenance log removed successfully.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      const newFile: FileAttachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(1) + " KB",
        uploadedBy: "Current User", // Replace with actual user
        uploadedAt: new Date().toLocaleDateString()
      };
      setFiles(prev => [...prev, newFile]);
    });

    toast({
      title: "Success",
      description: "Files uploaded successfully.",
    });
  };

  const removeFile = (fileId: string) => {
    setFiles(files.filter(file => file.id !== fileId));
    toast({
      title: "Success",
      description: "File removed successfully.",
    });
  };

  const handleTransferArticle = () => {
    setTransferModal({isOpen: true, article: {
      id: item.id,
      name: item.name,
      sku: item.sku,
      stock: item.stock,
      location: item.location
    }});
  };

  // Set document title (must not be after a conditional return to satisfy hooks rules)
  useEffect(() => {
    document.title = `${item ? item.name : 'Inventory'} - Inventory Details`;
  }, [item]);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Item Not Found</h2>
        <p className="text-muted-foreground">The inventory item you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/dashboard/inventory-services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory & Services
          </Link>
        </Button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(item.status);
  const LocationIcon = getLocationIcon(item.locationType);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">
        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/inventory-services">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleTransferArticle} className="gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                Move
              </Button>
              <Button size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
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
                  SKU: {item.sku} • {item.location}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(item.status)}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {item.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{item.category}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between p-6 lg:p-8">
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-background/80">
                <Link to="/dashboard/inventory-services">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Inventory
                </Link>
              </Button>
              <div className="h-8 w-px bg-border/50" />
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-xl bg-gradient-primary shadow-strong border-4 border-background">
                  <Package className="h-10 w-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    {item.name}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-3">
                    SKU: {item.sku} • <LocationIcon className="inline h-4 w-4 mr-1" />{item.location}
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(item.status)} px-3 py-1`}>
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {item.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">{item.category}</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleTransferArticle} className="gap-2 hover:bg-background/80 border-border/50">
                <ArrowRightLeft className="h-4 w-4" />
                Transfer
              </Button>
              <Button size="sm" className="gap-2 hover:bg-primary/90">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-chart-1" />
              <span className="text-xs font-medium text-muted-foreground">Current Stock</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{item.stock}</p>
            <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-chart-2" />
              <span className="text-xs font-medium text-muted-foreground">Sell Price</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{item.sellPrice} TND</p>
            <p className="text-xs text-muted-foreground">Cost: {item.price} TND</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-chart-3" />
              <span className="text-xs font-medium text-muted-foreground">Last Used</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-foreground">{item.lastUsed}</p>
            <p className="text-xs text-muted-foreground truncate">By: {item.lastUsedBy}</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-0">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-chart-4" />
              <span className="text-xs font-medium text-muted-foreground">Total Value</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{(item.stock * item.sellPrice).toFixed(2)} TND</p>
            <p className="text-xs text-muted-foreground">At sell price</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs sm:text-sm">Maintenance</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Item Information */}
            <Card className="shadow-card border-0">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Item Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm sm:text-base text-foreground mt-1">{item.description}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-sm sm:text-base text-foreground mt-1">{item.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                    <p className="text-sm sm:text-base text-foreground mt-1">{item.supplier}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Cost Price</Label>
                    <p className="text-sm sm:text-base text-foreground mt-1 font-semibold">{item.price} TND</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Sell Price</Label>
                    <p className="text-sm sm:text-base text-foreground mt-1 font-semibold">{item.sellPrice} TND</p>
                  </div>
                </div>

                {item.tags && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                    <p className="text-sm text-foreground mt-1 bg-muted/50 p-3 rounded-md">{item.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Asset Details */}
            <Card className="shadow-card border-0">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Asset Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Current Stock</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-lg font-bold text-foreground">{item.stock}</p>
                      <span className="text-sm text-muted-foreground">units</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Minimum Stock</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-lg font-bold text-foreground">{item.minStock}</p>
                      <span className="text-sm text-muted-foreground">units</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <LocationIcon className="h-4 w-4 text-primary" />
                    <p className="text-sm sm:text-base text-foreground">{item.location}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.locationType}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Last Activity</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Used on {item.lastUsed}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span>by {item.lastUsedBy}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleTransferArticle}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4 sm:space-y-6">
          <Card className="shadow-card border-0">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-lg sm:text-xl">Maintenance History</CardTitle>
                <Dialog open={isAddLogModalOpen} onOpenChange={setIsAddLogModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Log
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-auto">
                    <DialogHeader>
                      <DialogTitle>Add Maintenance Log</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="log-type">Type</Label>
                        <Select value={newLog.type} onValueChange={(value) => setNewLog({...newLog, type: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inspection">Inspection</SelectItem>
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="cleaning">Cleaning</SelectItem>
                            <SelectItem value="calibration">Calibration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="log-description">Description</Label>
                        <Textarea
                          id="log-description"
                          value={newLog.description}
                          onChange={(e) => setNewLog({...newLog, description: e.target.value})}
                          placeholder="Enter maintenance details"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="log-cost">Cost (Optional)</Label>
                        <Input
                          id="log-cost"
                          type="number"
                          step="0.01"
                          value={newLog.cost}
                          onChange={(e) => setNewLog({...newLog, cost: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setIsAddLogModalOpen(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={addLog} disabled={!newLog.type || !newLog.description} className="flex-1">
                          Add Log
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {maintenanceLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[80px]">Date</TableHead>
                        <TableHead className="min-w-[100px]">Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="min-w-[120px]">Performed By</TableHead>
                        <TableHead className="min-w-[80px]">Cost</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">{log.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {log.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate" title={log.description}>
                            {log.description}
                          </TableCell>
                          <TableCell className="text-sm">{log.performedBy}</TableCell>
                          <TableCell className="text-sm">
                            {log.cost ? `${log.cost} TND` : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLog(log.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No maintenance logs yet</p>
                  <p className="text-sm">Add your first maintenance log to track item history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 sm:space-y-6">
          <Card className="shadow-card border-0">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-lg sm:text-xl">Documents & Files</CardTitle>
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button size="sm" asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </label>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {files.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="min-w-[80px]">Size</TableHead>
                        <TableHead className="min-w-[120px]">Uploaded By</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm truncate max-w-[200px]" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{file.size}</TableCell>
                          <TableCell className="text-sm">{file.uploadedBy}</TableCell>
                          <TableCell className="text-sm">{file.uploadedAt}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload manuals, receipts, or other documents related to this item</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transfer Modal */}
      <TransferModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({isOpen: false})}
        article={transferModal.article}
      />
    </div>
  );
}