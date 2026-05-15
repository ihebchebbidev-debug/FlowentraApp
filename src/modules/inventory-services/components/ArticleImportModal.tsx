import { useTranslation } from 'react-i18next';
import { GenericImportModal } from '@/shared/import';
import { articlesBulkImportApi } from '@/services/api/articlesApi';
import type { ImportConfig } from '@/shared/import';
import { useQueryClient } from '@tanstack/react-query';

interface ArticleImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleImportModal({ open, onOpenChange }: ArticleImportModalProps) {
  const { t, i18n } = useTranslation('inventory-services');
  const queryClient = useQueryClient();
  const isFrench = i18n.language === 'fr';

  // Example data for template download (10 rows)
  const articleExampleData = isFrench ? [
    { name: 'Câble Ethernet Cat6', sku: 'CAB-ETH-001', description: 'Câble réseau haute vitesse', type: 'material', category: 'Câblage', status: 'active', stock: 150, minStock: 20, costPrice: 5.50, sellPrice: 12.00, supplier: 'TechCables', location: 'Entrepôt A' },
    { name: 'Routeur WiFi Pro', sku: 'ROU-WIFI-002', description: 'Routeur professionnel double bande', type: 'material', category: 'Réseau', status: 'active', stock: 25, minStock: 5, costPrice: 89.00, sellPrice: 149.00, supplier: 'NetGear', location: 'Entrepôt B' },
    { name: 'Installation Réseau', sku: 'SRV-NET-001', description: 'Service d\'installation réseau complet', type: 'service', category: 'Services', status: 'active', basePrice: 250.00, duration: 2, supplier: '', location: '' },
    { name: 'Switch 24 Ports', sku: 'SWI-24P-003', description: 'Switch manageable 24 ports Gigabit', type: 'material', category: 'Réseau', status: 'active', stock: 15, minStock: 3, costPrice: 120.00, sellPrice: 199.00, supplier: 'Cisco', location: 'Entrepôt A' },
    { name: 'Maintenance Serveur', sku: 'SRV-MAINT-002', description: 'Service de maintenance préventive', type: 'service', category: 'Services', status: 'active', basePrice: 150.00, duration: 1, supplier: '', location: '' },
    { name: 'Disque SSD 500Go', sku: 'SSD-500-004', description: 'Disque SSD haute performance', type: 'material', category: 'Stockage', status: 'active', stock: 50, minStock: 10, costPrice: 45.00, sellPrice: 79.00, supplier: 'Samsung', location: 'Entrepôt C' },
    { name: 'Rack Serveur 42U', sku: 'RAC-42U-005', description: 'Rack serveur standard 42 unités', type: 'material', category: 'Infrastructure', status: 'active', stock: 5, minStock: 1, costPrice: 450.00, sellPrice: 699.00, supplier: 'APC', location: 'Entrepôt D' },
    { name: 'Audit Sécurité', sku: 'SRV-SEC-003', description: 'Audit de sécurité informatique', type: 'service', category: 'Services', status: 'active', basePrice: 500.00, duration: 4, supplier: '', location: '' },
    { name: 'Onduleur 1500VA', sku: 'UPS-1500-006', description: 'Onduleur protection serveur', type: 'material', category: 'Alimentation', status: 'active', stock: 20, minStock: 5, costPrice: 180.00, sellPrice: 299.00, supplier: 'APC', location: 'Entrepôt A' },
    { name: 'Formation Utilisateur', sku: 'SRV-FORM-004', description: 'Formation bureautique', type: 'service', category: 'Services', status: 'active', basePrice: 100.00, duration: 1.5, supplier: '', location: '' },
  ] : [
    { name: 'Ethernet Cable Cat6', sku: 'CAB-ETH-001', description: 'High-speed network cable', type: 'material', category: 'Cabling', status: 'active', stock: 150, minStock: 20, costPrice: 5.50, sellPrice: 12.00, supplier: 'TechCables', location: 'Warehouse A' },
    { name: 'WiFi Router Pro', sku: 'ROU-WIFI-002', description: 'Professional dual-band router', type: 'material', category: 'Network', status: 'active', stock: 25, minStock: 5, costPrice: 89.00, sellPrice: 149.00, supplier: 'NetGear', location: 'Warehouse B' },
    { name: 'Network Installation', sku: 'SRV-NET-001', description: 'Complete network setup service', type: 'service', category: 'Services', status: 'active', basePrice: 250.00, duration: 2, supplier: '', location: '' },
    { name: '24-Port Switch', sku: 'SWI-24P-003', description: 'Manageable 24-port Gigabit switch', type: 'material', category: 'Network', status: 'active', stock: 15, minStock: 3, costPrice: 120.00, sellPrice: 199.00, supplier: 'Cisco', location: 'Warehouse A' },
    { name: 'Server Maintenance', sku: 'SRV-MAINT-002', description: 'Preventive maintenance service', type: 'service', category: 'Services', status: 'active', basePrice: 150.00, duration: 1, supplier: '', location: '' },
    { name: 'SSD Drive 500GB', sku: 'SSD-500-004', description: 'High performance SSD drive', type: 'material', category: 'Storage', status: 'active', stock: 50, minStock: 10, costPrice: 45.00, sellPrice: 79.00, supplier: 'Samsung', location: 'Warehouse C' },
    { name: 'Server Rack 42U', sku: 'RAC-42U-005', description: 'Standard 42-unit server rack', type: 'material', category: 'Infrastructure', status: 'active', stock: 5, minStock: 1, costPrice: 450.00, sellPrice: 699.00, supplier: 'APC', location: 'Warehouse D' },
    { name: 'Security Audit', sku: 'SRV-SEC-003', description: 'IT security audit service', type: 'service', category: 'Services', status: 'active', basePrice: 500.00, duration: 4, supplier: '', location: '' },
    { name: 'UPS 1500VA', sku: 'UPS-1500-006', description: 'Server protection UPS', type: 'material', category: 'Power', status: 'active', stock: 20, minStock: 5, costPrice: 180.00, sellPrice: 299.00, supplier: 'APC', location: 'Warehouse A' },
    { name: 'User Training', sku: 'SRV-FORM-004', description: 'Office software training', type: 'service', category: 'Services', status: 'active', basePrice: 100.00, duration: 1.5, supplier: '', location: '' },
  ];

  const articleImportConfig: ImportConfig<any> = {
    entityName: isFrench ? 'Articles' : 'Articles',
    templateFilename: isFrench ? 'modele-articles.xlsx' : 'articles-template.xlsx',
    templateSheetName: isFrench ? 'Modèle Articles' : 'Articles Template',
    requiredFields: ['name'],
    duplicateCheckFields: ['name', 'sku'],
    exampleData: articleExampleData,
    fields: [
      { 
        key: 'name', 
        label: isFrench ? 'Nom de l\'Article' : 'Article Name', 
        required: true,
        validate: (value: string) => {
          if (!value || !value.trim()) return isFrench ? 'Le nom de l\'article est requis' : 'Article name is required';
          if (value.length > 200) return isFrench ? 'Le nom doit faire moins de 200 caractères' : 'Name must be less than 200 characters';
          return null;
        }
      },
      { 
        key: 'sku', 
        label: isFrench ? 'Référence' : 'Reference', 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 50) return isFrench ? 'La référence doit faire moins de 50 caractères' : 'Reference must be less than 50 characters';
          return null;
        }
      },
      { 
        key: 'description', 
        label: isFrench ? 'Description' : 'Description', 
        required: false 
      },
      { 
        key: 'type', 
        label: isFrench ? 'Type' : 'Type', 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          const normalized = value.toLowerCase().trim();
          // Accept French values too
          if (!['material', 'service', 'matériel', 'materiel'].includes(normalized) && 
              !normalized.includes('material') && !normalized.includes('service') &&
              !normalized.includes('matériel')) {
            return isFrench ? 'Type invalide. Valeurs autorisées: matériel, service' : 'Invalid type. Allowed values: material, service';
          }
          return null;
        }
      },
      { 
        key: 'category', 
        label: isFrench ? 'Catégorie' : 'Category', 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 100) return isFrench ? 'La catégorie doit faire moins de 100 caractères' : 'Category must be less than 100 characters';
          return null;
        }
      },
      { 
        key: 'status', 
        label: isFrench ? 'Statut' : 'Status', 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          const validStatuses = ['available', 'active', 'low_stock', 'out_of_stock', 'discontinued', 'inactive', 'disponible', 'actif', 'stock_faible', 'rupture', 'arrêté', 'inactif'];
          if (!validStatuses.includes(value.toLowerCase().trim())) {
            return isFrench ? 'Statut invalide. Autorisés: disponible, actif, stock_faible, rupture, arrêté, inactif' : 'Invalid status. Allowed: available, active, low_stock, out_of_stock, discontinued, inactive';
          }
          return null;
        }
      },
      { 
        key: 'stock', 
        label: isFrench ? 'Stock' : 'Stock', 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num < 0) return isFrench ? 'Le stock doit être un nombre positif' : 'Stock must be a positive number';
          return null;
        }
      },
      { 
        key: 'minStock', 
        label: isFrench ? 'Stock Min' : 'Min Stock', 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num < 0) return isFrench ? 'Le stock min doit être un nombre positif' : 'Min stock must be a positive number';
          return null;
        }
      },
      { 
        key: 'costPrice', 
        label: isFrench ? 'Prix d\'Achat' : 'Cost Price', 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num < 0) return isFrench ? 'Le prix doit être un nombre positif' : 'Price must be a positive number';
          return null;
        }
      },
      { 
        key: 'sellPrice', 
        label: isFrench ? 'Prix de Vente' : 'Sell Price', 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num < 0) return isFrench ? 'Le prix doit être un nombre positif' : 'Price must be a positive number';
          return null;
        }
      },
      { 
        key: 'basePrice', 
        label: isFrench ? 'Prix de Base (Services)' : 'Base Price (Services)', 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num < 0) return isFrench ? 'Le prix doit être un nombre positif' : 'Price must be a positive number';
          return null;
        }
      },
      { 
        key: 'duration', 
        label: isFrench ? 'Durée (Heures)' : 'Duration (Hours)', 
        required: false, 
        type: 'number',
        validate: (value: any) => {
          if (value === undefined || value === '') return null;
          const num = Number(value);
          if (isNaN(num) || num < 0) return isFrench ? 'La durée doit être un nombre positif' : 'Duration must be a positive number';
          return null;
        }
      },
      { 
        key: 'supplier', 
        label: isFrench ? 'Fournisseur' : 'Supplier', 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 200) return isFrench ? 'Le fournisseur doit faire moins de 200 caractères' : 'Supplier must be less than 200 characters';
          return null;
        }
      },
      { 
        key: 'location', 
        label: isFrench ? 'Emplacement' : 'Location', 
        required: false,
        validate: (value: string) => {
          if (!value) return null;
          if (value.length > 200) return isFrench ? 'L\'emplacement doit faire moins de 200 caractères' : 'Location must be less than 200 characters';
          return null;
        }
      },
    ],
    transformRow: (data) => ({
      name: data.name || '',
      sku: data.sku,
      description: data.description,
      type: (['material', 'service'].includes(data.type?.toLowerCase?.()?.trim?.()) 
        ? data.type.toLowerCase().trim() 
        : (data.type?.toLowerCase?.()?.includes?.('service') ? 'service' : 'material')) as 'material' | 'service',
      category: data.category,
      status: data.status || 'active',
      stock: data.stock ? Number(data.stock) : 0,
      minStock: data.minStock ? Number(data.minStock) : undefined,
      costPrice: data.costPrice ? Number(data.costPrice) : undefined,
      sellPrice: data.sellPrice ? Number(data.sellPrice) : undefined,
      basePrice: data.basePrice ? Number(data.basePrice) : undefined,
      duration: data.duration ? Number(data.duration) : undefined,
      supplier: data.supplier,
      location: data.location,
    }),
    validateRow: (data) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      if (data.type === 'service') {
        if (!data.basePrice && data.basePrice !== 0) {
          warnings.push('Services typically require a base price');
        }
        if (data.stock && data.stock > 0) {
          warnings.push('Services typically do not have stock');
        }
      }
      
      if (data.type === 'material') {
        if (!data.sellPrice && data.sellPrice !== 0) {
          warnings.push('Materials typically require a sell price');
        }
      }
      
      if (data.minStock && data.stock !== undefined && data.minStock > data.stock) {
        warnings.push('Min stock is greater than current stock');
      }
      
      return { errors, warnings };
    },
  };

  const handleImport = async (items: any[]) => {
    const result = await articlesBulkImportApi.bulkImport({ articles: items });
    return result;
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['articles'] });
  };

  return (
    <GenericImportModal
      open={open}
      onOpenChange={onOpenChange}
      config={articleImportConfig}
      onImport={handleImport}
      onSuccess={handleSuccess}
      translationNamespace="inventory-services"
    />
  );
}
