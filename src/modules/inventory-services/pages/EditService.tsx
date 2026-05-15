import { useState, useEffect } from "react";
import { ArrowLeft, Save, Wrench, Minus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "Automotive",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Appliance Repair",
  "Maintenance",
  "Installation",
  "Diagnostic",
  "Other"
];

const availableSkills = [
  "Basic Mechanics",
  "Advanced Mechanics",
  "Brake Systems",
  "Engine Diagnostics",
  "Electronics",
  "Painting",
  "Body Work",
  "Electrical Systems",
  "HVAC Systems",
  "Plumbing",
  "Welding",
  "Fabrication"
];

const availableEquipment = [
  "Hydraulic Lift",
  "Engine Hoist",
  "Diagnostic Scanner",
  "Paint Booth",
  "Welding Equipment",
  "Air Compressor",
  "Hand Tools",
  "Power Tools",
  "Pressure Washer",
  "Oil Drain Pan",
  "Filter Wrench"
];

const availableMaterials = [
  "Motor Oil",
  "Oil Filter",
  "Brake Pads",
  "Brake Fluid",
  "Coolant",
  "Spark Plugs",
  "Air Filter",
  "Paint",
  "Primer",
  "Gaskets",
  "Seals",
  "Fasteners"
];

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
    description: "Complete oil change including filter replacement",
    equipmentNeeded: ["Hydraulic Lift", "Oil Drain Pan", "Filter Wrench"],
    materialsNeeded: ["Motor Oil", "Oil Filter", "Drain Plug Gasket"],
    notes: "Check oil level and quality before service. Inspect for leaks."
  },
  {
    id: "s2",
    name: "Brake Repair",
    category: "Automotive",
    basePrice: 120.00,
    duration: 1.5,
    status: "active",
    skillsRequired: ["Advanced Mechanics", "Brake Systems"],
    description: "Comprehensive brake system repair and maintenance",
    equipmentNeeded: ["Hydraulic Lift", "Hand Tools"],
    materialsNeeded: ["Brake Pads", "Brake Fluid"],
    notes: "Always test brake system after repairs."
  },
  {
    id: "s3",
    name: "Engine Diagnostic",
    category: "Automotive",
    basePrice: 85.00,
    duration: 1,
    status: "active",
    skillsRequired: ["Diagnostics", "Electronics"],
    description: "Computer diagnostic scan and troubleshooting",
    equipmentNeeded: ["Diagnostic Scanner"],
    materialsNeeded: [],
    notes: "Provide detailed report to customer."
  },
  {
    id: "s4",
    name: "Paint Touch-up",
    category: "Automotive",
    basePrice: 200.00,
    duration: 3,
    status: "active",
    skillsRequired: ["Painting", "Body Work"],
    description: "Professional paint touch-up and color matching",
    equipmentNeeded: ["Paint Booth", "Air Compressor"],
    materialsNeeded: ["Paint", "Primer"],
    notes: "Color matching required before painting."
  }
];

const EditService = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Find the service to edit
  const serviceToEdit = mockServices.find(s => s.id === id);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    groupId: "",
    basePrice: "",
    duration: "",
    status: "active",
    skillsRequired: [] as string[],
    equipmentNeeded: [] as string[],
    materialsNeeded: [] as string[],
    notes: ""
  });

  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const res = await (await import('@/services/api/lookupsApi')).articleGroupsApi.getAll();
        setGroups(res.items || []);
      } catch (error) {
        console.error('Failed to load groups', error);
      }
    };
    loadGroups();
  }, []);

  // Load service data when component mounts
  useEffect(() => {
    if (serviceToEdit) {
      setFormData({
        name: serviceToEdit.name,
        description: serviceToEdit.description || "",
        category: serviceToEdit.category,
        groupId: (serviceToEdit as any).groupId?.toString() || "",
        basePrice: serviceToEdit.basePrice.toString(),
        duration: serviceToEdit.duration.toString(),
        status: serviceToEdit.status,
        skillsRequired: serviceToEdit.skillsRequired || [],
        equipmentNeeded: serviceToEdit.equipmentNeeded || [],
        materialsNeeded: serviceToEdit.materialsNeeded || [],
        notes: serviceToEdit.notes || ""
      });
    }
  }, [serviceToEdit]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = (skill: string) => {
    if (!formData.skillsRequired.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(s => s !== skill)
    }));
  };

  const addEquipment = (equipment: string) => {
    if (!formData.equipmentNeeded.includes(equipment)) {
      setFormData(prev => ({
        ...prev,
        equipmentNeeded: [...prev.equipmentNeeded, equipment]
      }));
    }
  };

  const removeEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentNeeded: prev.equipmentNeeded.filter(e => e !== equipment)
    }));
  };

  const addMaterial = (material: string) => {
    if (!formData.materialsNeeded.includes(material)) {
      setFormData(prev => ({
        ...prev,
        materialsNeeded: [...prev.materialsNeeded, material]
      }));
    }
  };

  const removeMaterial = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materialsNeeded: prev.materialsNeeded.filter(m => m !== material)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Here you would typically update in Supabase
      console.log("Updating service:", formData);
      
      toast({
        title: "Success",
        description: "Service has been updated successfully.",
      });
      
      navigate(`/dashboard/inventory-services/service/${id}`);
    } catch (error) {
      const _err = error as any;
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!serviceToEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Wrench className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-foreground">Service Not Found</h2>
        <p className="text-muted-foreground">The service you're trying to edit doesn't exist.</p>
        <Button asChild>
          <Link to="/dashboard/inventory-services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Link>
        </Button>
      </div>
    );
  }

  const isFormValid = formData.name && formData.category && formData.basePrice && formData.duration;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/dashboard/inventory-services/service/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Service
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Edit Service</h1>
            <p className="text-muted-foreground">Update service information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="additional">Additional</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter service name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group">Group</Label>
                    <Select value={formData.groupId} onValueChange={(value) => handleInputChange("groupId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {groups.map((g: any) => (
                          <SelectItem key={String(g.id)} value={String(g.id)}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Detailed description of the service"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price (TND) *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => handleInputChange("basePrice", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (hours) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      step="0.1"
                      value={formData.duration}
                      onChange={(e) => handleInputChange("duration", e.target.value)}
                      placeholder="0.5"
                      min="0.1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Skills Required */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Skills Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select onValueChange={addSkill}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSkills
                        .filter(skill => !formData.skillsRequired.includes(skill))
                        .map((skill) => (
                          <SelectItem key={skill} value={skill}>
                            {skill}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    {formData.skillsRequired.map((skill) => (
                      <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Equipment Needed */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Equipment Needed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select onValueChange={addEquipment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEquipment
                        .filter(equipment => !formData.equipmentNeeded.includes(equipment))
                        .map((equipment) => (
                          <SelectItem key={equipment} value={equipment}>
                            {equipment}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    {formData.equipmentNeeded.map((equipment) => (
                      <Badge key={equipment} variant="secondary" className="flex items-center gap-1">
                        {equipment}
                        <button
                          type="button"
                          onClick={() => removeEquipment(equipment)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Materials Needed */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Materials Needed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select onValueChange={addMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add material" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaterials
                        .filter(material => !formData.materialsNeeded.includes(material))
                        .map((material) => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    {formData.materialsNeeded.map((material) => (
                      <Badge key={material} variant="secondary" className="flex items-center gap-1">
                        {material}
                        <button
                          type="button"
                          onClick={() => removeMaterial(material)}
                          className="ml-1 hover:text-destructive"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="additional" className="space-y-6">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes & Instructions</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Special instructions, safety notes, or additional information"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
            <Link to={`/dashboard/inventory-services/service/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={!isFormValid} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Update Service
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditService;