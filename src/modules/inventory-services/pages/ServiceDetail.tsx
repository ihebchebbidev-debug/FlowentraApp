import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Edit, Clock, DollarSign, Wrench, CheckCircle, AlertTriangle, Calendar, Settings, TrendingUp, Award, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { articleGroupsApi, LookupItem } from '@/services/api/lookupsApi';

// Mock service data - replace with real data from Supabase
const mockServices = [
  {
    id: "s1",
    name: "Oil Change Service",
    category: "Automotive",
    basePrice: 45.00,
    duration: 0.5,
    status: "active",
    skillsRequired: ["Basic Mechanics"],
    description: "Complete oil change including filter replacement and multi-point inspection",
    equipmentNeeded: ["Hydraulic Lift", "Oil Drain Pan", "Filter Wrench"],
    materialsNeeded: ["Motor Oil", "Oil Filter", "Drain Plug Gasket"],
    notes: "Check oil level and quality before service. Inspect for leaks and wear patterns.",
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    totalBookings: 145,
    avgRating: 4.8,
    estimatedRevenue: 6525.00,
    lastPerformed: "2024-01-20"
  },
  {
    id: "s2",
    name: "Brake Inspection & Repair",
    category: "Automotive",
    basePrice: 95.00,
    duration: 1,
    status: "active",
    skillsRequired: ["Advanced Mechanics", "Brake Systems"],
    description: "Comprehensive brake system inspection including pads, rotors, and fluid check",
    equipmentNeeded: ["Hydraulic Lift", "Brake Tools", "Measuring Equipment"],
    materialsNeeded: ["Brake Pads", "Brake Fluid", "Cleaning Solvent"],
    notes: "Always test drive after service. Check brake pedal feel and stopping distance.",
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
    totalBookings: 87,
    avgRating: 4.9,
    estimatedRevenue: 8265.00,
    lastPerformed: "2024-01-21"
  },
  {
    id: "s3",
    name: "Air Conditioning Service",
    category: "HVAC",
    basePrice: 120.00,
    duration: 1.5,
    status: "active",
    skillsRequired: ["HVAC Technician", "Refrigeration"],
    description: "Complete AC system diagnosis, cleaning, and refrigerant recharge",
    equipmentNeeded: ["AC Manifold Gauges", "Vacuum Pump", "Refrigerant Recovery Machine"],
    materialsNeeded: ["R-134a Refrigerant", "AC Oil", "System Cleaner"],
    notes: "Check for leaks using UV dye. Verify proper cooling temperatures.",
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-22'),
    totalBookings: 62,
    avgRating: 4.7,
    estimatedRevenue: 7440.00,
    lastPerformed: "2024-01-23"
  },
  {
    id: "s4",
    name: "Electrical Diagnostic",
    category: "Electrical",
    basePrice: 80.00,
    duration: 0.75,
    status: "active",
    skillsRequired: ["Electrical Systems", "Diagnostics"],
    description: "Comprehensive electrical system diagnosis and repair",
    equipmentNeeded: ["Multimeter", "Oscilloscope", "Wiring Diagrams"],
    materialsNeeded: ["Electrical Connectors", "Wire", "Fuses"],
    notes: "Document all findings. Provide detailed repair estimates.",
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-20'),
    totalBookings: 34,
    avgRating: 4.6,
    estimatedRevenue: 2720.00,
    lastPerformed: "2024-01-19"
  }
];

// Mock booking/sales data
const mockBookings = [
  {
    id: "b1",
    customerName: "John Smith",
    scheduledDate: "2024-01-22",
    status: "completed",
      actualDuration: 0.58,
    soldPrice: 45.00,
    technician: "Mike Johnson",
    rating: 5,
    notes: "Excellent service, very thorough"
  },
  {
    id: "b2", 
    customerName: "Sarah Johnson",
    scheduledDate: "2024-01-25",
    status: "completed",
      actualDuration: 0.53,
    soldPrice: 45.00,
    technician: "Tom Wilson",
    rating: 5,
    notes: "Professional and quick service"
  },
  {
    id: "b3",
    customerName: "Mike Davis",
    scheduledDate: "2024-01-20",
    status: "completed",
      actualDuration: 0.47,
    soldPrice: 45.00,
    technician: "Lisa Chen",
    rating: 4,
    notes: "Quick and professional"
  },
  {
    id: "b4",
    customerName: "Emily Brown",
    scheduledDate: "2024-01-18",
    status: "completed",
      actualDuration: 0.50,
    soldPrice: 50.00,
    technician: "Mike Johnson",
    rating: 5,
    notes: "Outstanding work, highly recommend"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "status-success";
    case "inactive":
      return "status-error";
    default:
      return "status-info";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return CheckCircle;
    case "inactive":
      return AlertTriangle;
    default:
      return Wrench;
  }
};

  const _getBookingStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "status-success";
    case "scheduled":
      return "status-info";
    case "cancelled":
      return "status-error";
    default:
      return "status-warning";
  }
};

export default function ServiceDetail() {
  const { t } = useTranslation('inventory-services');
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [priceAdjustment, setPriceAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [groups, setGroups] = useState<LookupItem[]>([]);
  
  const service = mockServices.find(s => s.id === id);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await articleGroupsApi.getAll();
        setGroups(res.items || []);
      } catch (error) {
        console.error('Failed to load groups', error);
      }
    };
    loadGroups();
  }, []);

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Wrench className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Service Not Found</h2>
        <p className="text-muted-foreground">The service you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/dashboard/inventory-services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory & Services
          </Link>
        </Button>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(service.status);
  const isActive = service.status === "active";
  const _avgDuration = service.duration;
  const completedBookings = mockBookings.filter(b => b.status === "completed").length;

  const handlePriceAdjustment = () => {
    const adjustment = parseFloat(priceAdjustment);
    if (!adjustment || adjustment <= 0) {
      toast({
        title: t('toast.invalid_price'),
        description: t('toast.invalid_price_desc'),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t('toast.price_updated'),
      description: t('toast.price_updated_desc', { price: adjustment }),
    });

    setPriceAdjustment("");
    setAdjustmentReason("");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header with same beautiful structure as inventory */}
      <div className="p-4 sm:p-6 border-b border-border bg-background">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background/95 rounded-lg p-4">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/inventory-services">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Services
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 shadow-soft">
                  <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                {service.name}
              </h1>
                  <p className="text-muted-foreground mt-1">Service ID: {service.id} • {service.category} {(service as any).groupId ? `• ${groups.find(g => Number(g.id) === Number((service as any).groupId))?.name || ''}` : ''}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Adjust Price
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adjust Service Price</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Current Price: {service.basePrice} TND</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">New Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="Enter new price"
                      value={priceAdjustment}
                      onChange={(e) => setPriceAdjustment(e.target.value)}
                      min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Reason for price change..."
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <Button onClick={handlePriceAdjustment} className="w-full">
                    Update Price
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button onClick={() => navigate(`/dashboard/inventory-services/service/${service.id}/edit`)} className="flex-1 sm:flex-none">
              <Edit className="h-4 w-4 mr-2" />
              Edit Service
            </Button>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base Price</p>
                  <p className="text-xl font-bold">{service.basePrice} TND</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-success/10' : 'bg-warning/10'}`}>
                  <StatusIcon className={`h-5 w-5 ${isActive ? 'text-success' : 'text-warning'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-xl font-bold">{Number(service.duration) % 1 !== 0 ? Number(service.duration).toFixed(1) : service.duration} {t('hours')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10">
                  <TrendingUp className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">{service.estimatedRevenue?.toFixed(0)} TND</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-border px-4 sm:px-6">
            <TabsList className="grid w-full sm:w-fit grid-cols-3 h-auto">
              <TabsTrigger value="overview" className="gap-2 text-xs sm:text-sm py-2 sm:py-3">
                <Wrench className="h-3 w-3 sm:h-4 sm:w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="bookings" className="gap-2 text-xs sm:text-sm py-2 sm:py-3">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                Recent Sales
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-2 text-xs sm:text-sm py-2 sm:py-3">
                <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                Performance
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Service Details */}
              <Card className="lg:col-span-2 shadow-card border-0">
                <CardHeader>
                  <CardTitle>Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Description</h4>
                    <p className="text-muted-foreground">{service.description}</p>
                  </div>
                  
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Category</h4>
                      <p className="text-muted-foreground">{service.category}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Duration</h4>
                        <p className="text-muted-foreground">{Number(service.duration) % 1 !== 0 ? Number(service.duration).toFixed(1) : service.duration} {t('hours')}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Skills Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.skillsRequired.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {service.equipmentNeeded && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Equipment Needed</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.equipmentNeeded.map((equipment, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Settings className="h-3 w-3 mr-1" />
                            {equipment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {service.materialsNeeded && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Materials Needed</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.materialsNeeded.map((material, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Notes</h4>
                    <p className="text-muted-foreground">{service.notes}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing & Quick Stats */}
              <div className="space-y-6">
                <Card className="shadow-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Pricing Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span className="font-semibold">{service.basePrice} TND</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hourly Rate:</span>
                      <span className="font-semibold">{service.duration ? (service.basePrice / service.duration).toFixed(2) : '—'} TND/h</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Est. Revenue:</span>
                      <div className="text-right">
                        <span className="font-semibold text-success">{service.estimatedRevenue?.toFixed(0)} TND</span>
                        <span className="text-xs text-muted-foreground ml-1">total</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Service Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Bookings:</span>
                        <span className="font-semibold">{service.totalBookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Rating:</span>
                        <span className="font-semibold">{service.avgRating}/5.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Performed:</span>
                        <span className="font-semibold">{service.lastPerformed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="flex-1 p-4 sm:p-6 space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBookings.filter(b => b.status === "completed").map((sale) => (
                    <div key={sale.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-success/10">
                            <User className="h-4 w-4 text-success" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{sale.customerName}</h4>
                            <p className="text-sm text-muted-foreground">{sale.scheduledDate}</p>
                          </div>
                        </div>
                        <Badge className="status-success">
                          {sale.soldPrice} TND
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{sale.actualDuration}m</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Technician:</span>
                          <span className="font-medium">{sale.technician}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Award key={i} className={`h-3 w-3 ${i < sale.rating ? 'text-warning fill-current' : 'text-muted-foreground'}`} />
                          ))}
                          <span className="text-sm text-muted-foreground ml-1">({sale.rating}/5)</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Sold: {sale.soldPrice} TND
                        </div>
                      </div>
                      
                      {sale.notes && (
                        <div className="mt-3 text-sm text-muted-foreground border-t pt-2">
                          "{sale.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="flex-1 p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success mb-2">
                    {((completedBookings / mockBookings.length) * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {completedBookings} of {mockBookings.length} bookings completed
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle>Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {service.avgRating}/5.0
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {completedBookings} reviews
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle>Revenue Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent mb-2">
                    {service.estimatedRevenue?.toFixed(0)} TND
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total from all bookings
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}