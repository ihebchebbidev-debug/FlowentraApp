import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, X } from "lucide-react";
import { CreateJobData, Job } from "../entities/jobs/types";
import { Article } from "@/modules/inventory-services/types";
import { Installation } from "@/modules/field/installations/types";
import { useLookups } from '@/shared/contexts/LookupsContext';
// Mock data - replace with actual data fetching
const mockArticles: Article[] = [
  { 
    id: "1", 
    name: "Réparation moteur", 
    type: "service", 
    category: "Mécanique", 
    status: "active", 
    basePrice: 150, 
    duration: 120,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    modifiedBy: "admin"
  },
  { 
    id: "2", 
    name: "Huile moteur 5W30", 
    type: "material", 
    category: "Lubrifiant", 
    status: "active", 
    stock: 50, 
    costPrice: 25, 
    sellPrice: 35, 
    supplier: "Total",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    modifiedBy: "admin"
  },
  { 
    id: "3", 
    name: "Diagnostic électronique", 
    type: "service", 
    category: "Électronique", 
    status: "active", 
    basePrice: 80, 
    duration: 60,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    modifiedBy: "admin"
  },
  { 
    id: "4", 
    name: "Filtre à air", 
    type: "material", 
    category: "Filtration", 
    status: "active", 
    stock: 30, 
    costPrice: 15, 
    sellPrice: 25, 
    supplier: "Bosch",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "admin",
    modifiedBy: "admin"
  }
];

const mockInstallations: Installation[] = [
  {
    id: "inst-1",
    name: "Véhicule principal - BMW X5 2020",
    model: "BMW X5",
    description: "Véhicule principal du client",
    location: "Garage client",
    manufacturer: "BMW",
    hasWarranty: true,
    type: "external",
    customer: {
      id: "cust-1",
      company: "Tech Solutions Inc.",
      contactPerson: "Jean Dupont",
      phone: "+1 (555) 987-6543",
      email: "jean@techsolutions.com",
      address: {
        street: "123 Main St",
        city: "Montreal",
        state: "QC",
        zipCode: "H1A 1A1",
        country: "Canada"
      }
    },
    relatedServiceOrders: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "user-1",
    modifiedBy: "user-1"
  }
];

export default function JobDetail() {
  const { serviceOrderId, jobId } = useParams<{ serviceOrderId: string; jobId?: string }>();
  const navigate = useNavigate();
  const isEdit = !!jobId;
  const { priorities: lookupPriorities, getDefaultPriority } = useLookups();

  const [formData, setFormData] = useState<Partial<CreateJobData>>({
    serviceOrderId: serviceOrderId || "",
    title: "",
    description: "",
    priority: "medium",
    requiredSkills: [],
    estimatedDuration: 60,
    estimatedCost: 0,
    workType: "maintenance",
    workLocation: "",
    installationId: mockInstallations[0]?.id,
    specialInstructions: "",
    notes: ""
  });

  // Auto-select priority: default one or single option
  useEffect(() => {
    if (lookupPriorities.length > 0 && (!formData.priority || formData.priority === 'medium')) {
      const defaultPriority = getDefaultPriority();
      if (defaultPriority) {
        setFormData(prev => ({ ...prev, priority: defaultPriority.id as CreateJobData['priority'] }));
      } else if (lookupPriorities.length === 1) {
        setFormData(prev => ({ ...prev, priority: lookupPriorities[0].id as CreateJobData['priority'] }));
      }
    }
  }, [lookupPriorities, getDefaultPriority]);

  const [selectedArticles, setSelectedArticles] = useState<Article[]>([]);
  const [articleSearch, setArticleSearch] = useState("");
  const [showArticleSearch, setShowArticleSearch] = useState(false);

  const filteredArticles = mockArticles.filter(article =>
    article.name.toLowerCase().includes(articleSearch.toLowerCase()) &&
    !selectedArticles.find(selected => selected.id === article.id)
  );

  const handleAddArticle = (article: Article) => {
    setSelectedArticles([...selectedArticles, article]);
    setArticleSearch("");
    setShowArticleSearch(false);
  };

  const handleRemoveArticle = (articleId: string) => {
    setSelectedArticles(selectedArticles.filter(a => a.id !== articleId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Job data:", formData);
    console.log("Selected articles:", selectedArticles);
    // TODO: Save job data
    navigate(`/dashboard/field/service-orders/${serviceOrderId}`);
  };

  const selectedInstallation = mockInstallations.find(inst => inst.id === formData.installationId);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          onClick={() => navigate(`/dashboard/field/service-orders/${serviceOrderId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'ordre de service
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Statut: En attente</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {isEdit ? `Modifier le job ${jobId}` : "Créer un nouveau job"}
        </h1>
        <p className="text-muted-foreground">
          Ordre de service: {serviceOrderId}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre du job *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Réparation moteur BMW"
                  required
                />
              </div>

              <div>
                <Label htmlFor="priority">Priorité *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Job['priority']) => setFormData({...formData, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="workType">Type de travail *</Label>
                <Select
                  value={formData.workType}
                  onValueChange={(value: Job['workType']) => setFormData({...formData, workType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Réparation</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="upgrade">Mise à niveau</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estimatedDuration">Durée estimée (minutes) *</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value)})}
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Décrivez le travail à effectuer..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="workLocation">Lieu de travail *</Label>
              <Input
                id="workLocation"
                value={formData.workLocation}
                onChange={(e) => setFormData({...formData, workLocation: e.target.value})}
                placeholder="Ex: Atelier, Chez le client, Sur site"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Installation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="installation">Installation concernée *</Label>
              <Select
                value={formData.installationId}
                onValueChange={(value) => setFormData({...formData, installationId: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockInstallations.map((installation) => (
                    <SelectItem key={installation.id} value={installation.id}>
                      {installation.name} - {installation.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedInstallation && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Client:</strong> {selectedInstallation.customer.company}
                </p>
                <p className="text-sm">
                  <strong>Localisation:</strong> {selectedInstallation.location}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Articles requis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setShowArticleSearch(!showArticleSearch)}
              >
                <Search className="h-4 w-4" />
                Ajouter des articles (services ou matériaux)
              </Button>

              {showArticleSearch && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg">
                  <div className="p-2">
                    <Input
                      placeholder="Rechercher un article..."
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        type="button"
                        className="w-full p-2 text-left hover:bg-muted flex items-center justify-between"
                        onClick={() => handleAddArticle(article)}
                      >
                        <div>
                          <p className="font-medium">{article.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {article.type === 'service' ? 'Service' : 'Matériau'} - {article.category}
                          </p>
                        </div>
                        <Badge variant="outline">{article.type}</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedArticles.length > 0 && (
              <div className="space-y-2">
                <Label>Articles sélectionnés:</Label>
                {selectedArticles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{article.type}</Badge>
                      <span>{article.name}</span>
                      <span className="text-sm text-muted-foreground">({article.category})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveArticle(article.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions et notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="specialInstructions">Instructions spéciales</Label>
              <Textarea
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                placeholder="Instructions particulières pour ce job..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notes additionnelles..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/field/service-orders/${serviceOrderId}`)}
          >
            Annuler
          </Button>
          <Button type="submit">
            {isEdit ? "Modifier le job" : "Créer le job"}
          </Button>
        </div>
      </form>
    </div>
  );
}