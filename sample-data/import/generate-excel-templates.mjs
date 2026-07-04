/**
 * Generates + validates import test files (20 contacts, 20 articles).
 * Run: node sample-data/import/generate-excel-templates.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\+]?[1-9][\d]{0,15}$/;
const ARTICLE_TYPES = new Set(['material', 'service']);
const ARTICLE_STATUSES = new Set([
  'available', 'active', 'low_stock', 'out_of_stock', 'discontinued', 'inactive',
]);
const INSTALLATION_STATUSES = new Set([
  'active', 'inactive', 'maintenance', 'decommissioned', 'pending', 'installed', 'retired',
]);
const SERIAL_RE = /^[a-zA-Z0-9\-_]+$/;

function validatePhone(phone) {
  if (!phone) return true;
  return PHONE_RE.test(String(phone).replace(/[\s\-().]/g, ''));
}

function validateContactStructured(row) {
  const errors = [];
  if (!row.fullName?.trim()) errors.push('missing fullName');
  if (!row.email?.trim()) errors.push('missing email');
  else if (!EMAIL_RE.test(row.email.trim())) errors.push('invalid email');
  if (row.phone && !validatePhone(row.phone)) errors.push('invalid phone');
  if (row.contactType && !['Individual', 'Company'].includes(row.contactType)) {
    errors.push('invalid contactType');
  }
  return errors;
}

function validateArticle(row) {
  const errors = [];
  if (!row.name?.trim()) errors.push('missing name');
  if (row.name && row.name.length > 200) errors.push('name too long');
  if (row.sku && row.sku.length > 50) errors.push('sku too long');
  const type = (row.type || 'material').toLowerCase().trim();
  if (!ARTICLE_TYPES.has(type)) errors.push(`invalid type: ${type}`);
  if (row.status && !ARTICLE_STATUSES.has(String(row.status).toLowerCase().trim())) {
    errors.push(`invalid status: ${row.status}`);
  }
  if (type === 'material') {
    if (row.stock !== '' && row.stock != null && (isNaN(Number(row.stock)) || Number(row.stock) < 0)) {
      errors.push('invalid stock');
    }
    if (row.costPrice !== '' && row.costPrice != null && (isNaN(Number(row.costPrice)) || Number(row.costPrice) < 0)) {
      errors.push('invalid costPrice');
    }
    if (row.sellPrice !== '' && row.sellPrice != null && (isNaN(Number(row.sellPrice)) || Number(row.sellPrice) < 0)) {
      errors.push('invalid sellPrice');
    }
  }
  if (type === 'service') {
    if (row.basePrice !== '' && row.basePrice != null && (isNaN(Number(row.basePrice)) || Number(row.basePrice) < 0)) {
      errors.push('invalid basePrice');
    }
    if (row.duration !== '' && row.duration != null && (isNaN(Number(row.duration)) || Number(row.duration) < 0)) {
      errors.push('invalid duration');
    }
  }
  return errors;
}

function validateInstallation(row) {
  const errors = [];
  if (!row.name?.trim()) errors.push('missing name');
  if (row.name && row.name.length > 255) errors.push('name too long');
  if (row.serialNumber) {
    if (row.serialNumber.length > 100) errors.push('serial too long');
    if (!SERIAL_RE.test(row.serialNumber.trim())) errors.push('invalid serial format');
  }
  if (row.status && !INSTALLATION_STATUSES.has(String(row.status).toLowerCase().trim())) {
    errors.push(`invalid status: ${row.status}`);
  }
  if (row.contactId !== '' && row.contactId != null) {
    const n = Number(String(row.contactId).replace(/\s/g, ''));
    if (!Number.isInteger(n) || n < 0) errors.push('invalid contactId');
  }
  return errors;
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const v of values) {
    const key = String(v).toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate ${label}: ${v}`);
    seen.add(key);
  }
}

const STRUCTURED_HEADERS = [
  'Full Name*',
  'Email Address*',
  'Phone Number',
  'Contact Type (Individual / Company)',
  'Position / Title',
  'Full Address',
];

const CONTACTS = [
  { fullName: 'Ahmed Ben Salah', email: 'import.contact.01@test.flowentra.local', phone: '+21671234501', contactType: 'Individual', position: 'Directeur Technique', fullAddress: '12 Avenue Habib Bourguiba, Tunis 1000' },
  { fullName: 'Fatma Trabelsi', email: 'import.contact.02@test.flowentra.local', phone: '+21671234502', contactType: 'Individual', position: 'Responsable Achats', fullAddress: '45 Rue de la Liberte, Sfax 3000' },
  { fullName: 'Karim Mejri', email: 'import.contact.03@test.flowentra.local', phone: '+21671234503', contactType: 'Individual', position: 'Technicien HVAC', fullAddress: '8 Impasse des Oliviers, Ariana 2080' },
  { fullName: 'Leila Mansouri', email: 'import.contact.04@test.flowentra.local', phone: '+21671234504', contactType: 'Individual', position: 'Directrice Commerciale', fullAddress: 'Avenue Mohamed V, Hammamet 8050' },
  { fullName: 'Youssef Ammar', email: 'import.contact.05@test.flowentra.local', phone: '+21671234505', contactType: 'Individual', position: 'Chef de Chantier', fullAddress: 'Rue Ibn Khaldoun, Nabeul 8000' },
  { fullName: 'Nadia Khelifi', email: 'import.contact.06@test.flowentra.local', phone: '+21671234506', contactType: 'Individual', position: 'Consultante', fullAddress: 'Les Berges du Lac, Tunis' },
  { fullName: 'Mohamed Dridi', email: 'import.contact.07@test.flowentra.local', phone: '+21671234507', contactType: 'Individual', position: 'Gerant', fullAddress: 'Route de Bizerte, Menzel Bourguiba' },
  { fullName: 'Ines Bouazizi', email: 'import.contact.08@test.flowentra.local', phone: '+21671234508', contactType: 'Individual', position: 'Assistante', fullAddress: 'Centre Ville, Sousse 4000' },
  { fullName: 'Rami Gharbi', email: 'import.contact.09@test.flowentra.local', phone: '+21671234509', contactType: 'Individual', position: 'Ingenieur Frigoriste', fullAddress: 'Zone Industrielle, Ben Arous' },
  { fullName: 'Salma Jebali', email: 'import.contact.10@test.flowentra.local', phone: '+21671234510', contactType: 'Individual', position: 'Comptable', fullAddress: 'Rue du Pacha, Tunis 1002' },
  { fullName: 'TechSolutions Tunisia', email: 'import.contact.11@test.flowentra.local', phone: '+21671234511', contactType: 'Company', position: 'Siege Social', fullAddress: 'Parc Technologique El Ghazala, Ariana' },
  { fullName: 'Climat Plus SARL', email: 'import.contact.12@test.flowentra.local', phone: '+21671234512', contactType: 'Company', position: 'Direction Generale', fullAddress: 'Route de La Marsa, Tunis' },
  { fullName: 'Electro Services TN', email: 'import.contact.13@test.flowentra.local', phone: '+21671234513', contactType: 'Company', position: 'Service Commercial', fullAddress: 'Zone Industrielle, Ben Arous' },
  { fullName: 'Hedi Bouzid', email: 'import.contact.14@test.flowentra.local', phone: '+21671234514', contactType: 'Individual', position: 'Electricien', fullAddress: 'Cite Ennasr, Tunis' },
  { fullName: 'Amira Sassi', email: 'import.contact.15@test.flowentra.local', phone: '+21671234515', contactType: 'Individual', position: 'Planificatrice', fullAddress: 'Avenue Farhat Hached, Sfax' },
  { fullName: 'Bureau Central Froid', email: 'import.contact.16@test.flowentra.local', phone: '+21671234516', contactType: 'Company', position: 'Achats', fullAddress: 'Route de Gabes, Sfax 3000' },
  { fullName: 'Omar Chebbi', email: 'import.contact.17@test.flowentra.local', phone: '+21671234517', contactType: 'Individual', position: 'Technicien', fullAddress: 'Medina, Kairouan' },
  { fullName: 'Sonia Belhaj', email: 'import.contact.18@test.flowentra.local', phone: '+21671234518', contactType: 'Individual', position: 'Responsable SAV', fullAddress: 'Avenue 7 Novembre, Monastir' },
  { fullName: 'Frigorifique Nord', email: 'import.contact.19@test.flowentra.local', phone: '+21671234519', contactType: 'Company', position: 'Direction', fullAddress: 'Route de Bizerte, Tunis Nord' },
  { fullName: 'Walid Ferchichi', email: 'import.contact.20@test.flowentra.local', phone: '+21671234520', contactType: 'Individual', position: 'Project Manager', fullAddress: 'Les Jardins de Carthage, Tunis' },
];

const ARTICLE_HEADERS = [
  'Article Name',
  'Reference',
  'Description',
  'Type',
  'Category',
  'Status',
  'Stock',
  'Min Stock',
  'Cost Price',
  'Sell Price',
  'Base Price (Services)',
  'Duration (Hours)',
  'Supplier',
  'Location',
];

const ARTICLES = [
  { name: 'Ethernet Cable Cat6 305m', sku: 'IMP-MAT-001', description: 'High-speed network cable roll', type: 'material', category: 'Cabling', status: 'active', stock: 150, minStock: 20, costPrice: 85, sellPrice: 149, basePrice: '', duration: '', supplier: 'TechCables', location: 'Warehouse A' },
  { name: 'Copper Pipe 22mm', sku: 'IMP-MAT-002', description: 'Plumbing copper pipe per meter', type: 'material', category: 'Plumbing', status: 'active', stock: 500, minStock: 50, costPrice: 4.5, sellPrice: 8.9, basePrice: '', duration: '', supplier: 'Plomberie Pro', location: 'Warehouse B' },
  { name: 'HVAC Filter HEPA', sku: 'IMP-MAT-003', description: 'Replacement HEPA filter unit', type: 'material', category: 'HVAC', status: 'active', stock: 80, minStock: 15, costPrice: 22, sellPrice: 45, basePrice: '', duration: '', supplier: 'ClimaParts', location: 'Warehouse A' },
  { name: 'Circuit Breaker 32A', sku: 'IMP-MAT-004', description: 'Modular circuit breaker', type: 'material', category: 'Electrical', status: 'active', stock: 120, minStock: 25, costPrice: 8.5, sellPrice: 16, basePrice: '', duration: '', supplier: 'ElectroDist', location: 'Warehouse C' },
  { name: 'Refrigerant R410A 11kg', sku: 'IMP-MAT-005', description: 'Refrigerant gas cylinder', type: 'material', category: 'HVAC', status: 'active', stock: 30, minStock: 5, costPrice: 95, sellPrice: 165, basePrice: '', duration: '', supplier: 'FrigoSupply', location: 'Warehouse D' },
  { name: 'WiFi Router Pro', sku: 'IMP-MAT-006', description: 'Dual-band business router', type: 'material', category: 'Network', status: 'active', stock: 25, minStock: 5, costPrice: 89, sellPrice: 149, basePrice: '', duration: '', supplier: 'NetGear', location: 'Warehouse A' },
  { name: 'Disque SSD 500Go', sku: 'IMP-MAT-007', description: 'High performance SSD drive', type: 'material', category: 'Storage', status: 'active', stock: 50, minStock: 10, costPrice: 45, sellPrice: 79, basePrice: '', duration: '', supplier: 'Samsung', location: 'Warehouse C' },
  { name: 'Onduleur 1500VA', sku: 'IMP-MAT-008', description: 'Server protection UPS', type: 'material', category: 'Power', status: 'active', stock: 20, minStock: 5, costPrice: 180, sellPrice: 299, basePrice: '', duration: '', supplier: 'APC', location: 'Warehouse A' },
  { name: 'Rack Serveur 42U', sku: 'IMP-MAT-009', description: 'Standard 42-unit server rack', type: 'material', category: 'Infrastructure', status: 'active', stock: 5, minStock: 1, costPrice: 450, sellPrice: 699, basePrice: '', duration: '', supplier: 'APC', location: 'Warehouse D' },
  { name: 'Switch 24 Ports', sku: 'IMP-MAT-010', description: 'Manageable Gigabit switch', type: 'material', category: 'Network', status: 'active', stock: 15, minStock: 3, costPrice: 120, sellPrice: 199, basePrice: '', duration: '', supplier: 'Cisco', location: 'Warehouse A' },
  { name: 'Cable HDMI 3m', sku: 'IMP-MAT-011', description: 'HDMI 2.1 cable', type: 'material', category: 'Cabling', status: 'active', stock: 200, minStock: 30, costPrice: 6, sellPrice: 14, basePrice: '', duration: '', supplier: 'TechCables', location: 'Warehouse B' },
  { name: 'Thermostat Digital', sku: 'IMP-MAT-012', description: 'Programmable room thermostat', type: 'material', category: 'HVAC', status: 'active', stock: 40, minStock: 8, costPrice: 35, sellPrice: 65, basePrice: '', duration: '', supplier: 'ClimaParts', location: 'Warehouse A' },
  { name: 'HVAC Installation', sku: 'IMP-SRV-001', description: 'Complete split AC installation', type: 'service', category: 'Services', status: 'active', stock: '', minStock: '', costPrice: '', sellPrice: '', basePrice: 350, duration: 4, supplier: '', location: '' },
  { name: 'Preventive Maintenance', sku: 'IMP-SRV-002', description: 'Quarterly maintenance visit', type: 'service', category: 'Services', status: 'active', stock: '', minStock: '', costPrice: '', sellPrice: '', basePrice: 180, duration: 2, supplier: '', location: '' },
  { name: 'Emergency Repair', sku: 'IMP-SRV-003', description: 'Urgent breakdown call-out', type: 'service', category: 'Services', status: 'active', stock: '', minStock: '', costPrice: '', sellPrice: '', basePrice: 120, duration: 2, supplier: '', location: '' },
  { name: 'Network Audit', sku: 'IMP-SRV-004', description: 'On-site network infrastructure audit', type: 'service', category: 'Services', status: 'active', stock: '', minStock: '', costPrice: '', sellPrice: '', basePrice: 450, duration: 6, supplier: '', location: '' },
  { name: 'Electrical Inspection', sku: 'IMP-SRV-005', description: 'Electrical safety inspection', type: 'service', category: 'Services', status: 'active', stock: '', minStock: '', costPrice: '', sellPrice: '', basePrice: 200, duration: 3, supplier: '', location: '' },
  { name: 'Plumbing Diagnostic', sku: 'IMP-SRV-006', description: 'Plumbing fault diagnosis', type: 'service', category: 'Services', status: 'active', stock: '', minStock: '', costPrice: '', sellPrice: '', basePrice: 90, duration: 1, supplier: '', location: '' },
  { name: 'User Training Session', sku: 'IMP-SRV-007', description: 'End-user software training', type: 'service', category: 'Services', status: 'active', stock: '', minStock: '', costPrice: '', sellPrice: '', basePrice: 100, duration: 2, supplier: '', location: '' },
  { name: 'Commissioning Handover', sku: 'IMP-SRV-008', description: 'System commissioning and client handover', type: 'service', category: 'Services', status: 'active', stock: '', minStock: '', costPrice: '', sellPrice: '', basePrice: 280, duration: 3, supplier: '', location: '' },
];

// Headers match InstallationsList GenericImportModal field labels (English) for auto-mapping.
const INSTALLATION_HEADERS = [
  'Name',
  'Contact ID',
  'Model',
  'Manufacturer',
  'Serial Number',
  'Category',
  'Type',
  'Status',
  'Site Address',
  'Installation Type',
  'Notes',
  'Matricule / Licence Plate',
];

const INSTALLATIONS = [
  { name: 'Rooftop PV Array Block A', contactId: '', model: 'PV-485W-72', manufacturer: 'Jinko Solar', serialNumber: 'IMP-INS-001', category: 'Solar', type: 'Photovoltaic', status: 'active', siteAddress: '12 Avenue Habib Bourguiba, Tunis 1000', installationType: 'Rooftop', notes: '20 panels — import test row 1', matricule: '' },
  { name: 'Hybrid Inverter Site 1', contactId: '', model: 'HYB-8K', manufacturer: 'Huawei', serialNumber: 'IMP-INS-002', category: 'Solar', type: 'Inverter', status: 'active', siteAddress: '45 Rue de la Liberte, Sfax 3000', installationType: 'Technical Room', notes: '8kW hybrid inverter', matricule: '' },
  { name: 'LFP Battery Bank 10kWh', contactId: '', model: 'LFP-10', manufacturer: 'Pylontech', serialNumber: 'IMP-INS-003', category: 'Storage', type: 'Battery', status: 'active', siteAddress: '8 Impasse des Oliviers, Ariana 2080', installationType: 'Indoor', notes: 'Wall-mounted battery stack', matricule: '' },
  { name: 'Split AC Office Unit', contactId: '', model: 'FTXM35N', manufacturer: 'Daikin', serialNumber: 'IMP-INS-004', category: 'HVAC', type: 'Split', status: 'active', siteAddress: 'Avenue Mohamed V, Hammamet 8050', installationType: 'Wall Mount', notes: 'Annual service contract', matricule: '' },
  { name: 'VRF Outdoor Unit', contactId: '', model: 'REYQ-T', manufacturer: 'Daikin', serialNumber: 'IMP-INS-005', category: 'HVAC', type: 'VRF', status: 'active', siteAddress: 'Rue Ibn Khaldoun, Nabeul 8000', installationType: 'Outdoor', notes: 'Commercial building', matricule: '' },
  { name: 'Fire Detection Panel', contactId: '', model: 'FC720', manufacturer: 'Siemens', serialNumber: 'IMP-INS-006', category: 'Security', type: 'Detection', status: 'active', siteAddress: 'Les Berges du Lac, Tunis', installationType: 'Building', notes: 'Weekly test required', matricule: '' },
  { name: 'Diesel Generator 80kVA', contactId: '', model: 'DE-80', manufacturer: 'Caterpillar', serialNumber: 'IMP-INS-007', category: 'Electrical', type: 'Diesel', status: 'active', siteAddress: 'Route de Bizerte, Menzel Bourguiba', installationType: 'Outdoor Shelter', notes: 'Monthly load test', matricule: 'GEN-80-007' },
  { name: 'Pool Heat Pump', contactId: '', model: 'HP-300', manufacturer: 'Zodiac', serialNumber: 'IMP-INS-008', category: 'Pool', type: 'Heat-Pump', status: 'active', siteAddress: 'Centre Ville, Sousse 4000', installationType: 'Outdoor', notes: 'Seasonal commissioning', matricule: '' },
  { name: 'Air Handling Unit Hospital Wing', contactId: '', model: 'AHU-3000', manufacturer: 'Carrier', serialNumber: 'IMP-INS-009', category: 'HVAC', type: 'Central', status: 'maintenance', siteAddress: 'Zone Industrielle, Ben Arous', installationType: 'Technical Room', notes: 'Filter replacement due', matricule: '' },
  { name: 'Elevator Passenger Bank B', contactId: '', model: 'ELV-6P', manufacturer: 'Otis', serialNumber: 'IMP-INS-010', category: 'Transport', type: 'Electric', status: 'active', siteAddress: 'Rue du Pacha, Tunis 1002', installationType: 'Shaft', notes: '6-person capacity', matricule: '' },
  { name: 'Solar Water Heater 300L', contactId: '', model: 'SWH-300', manufacturer: 'Ariston', serialNumber: 'IMP-INS-011', category: 'Solar', type: 'Thermal', status: 'active', siteAddress: 'Parc Technologique El Ghazala, Ariana', installationType: 'Rooftop', notes: 'Residential villa', matricule: '' },
  { name: 'Compressed Air Screw Unit', contactId: '', model: 'GA-37', manufacturer: 'Atlas Copco', serialNumber: 'IMP-INS-012', category: 'Industrial', type: 'Compressor', status: 'active', siteAddress: 'Route de La Marsa, Tunis', installationType: 'Technical Room', notes: 'Oil change every 2000h', matricule: '' },
  { name: 'BMS Controller Main', contactId: '', model: 'Desigo CC', manufacturer: 'Siemens', serialNumber: 'IMP-INS-013', category: 'Automation', type: 'BMS', status: 'active', siteAddress: 'Zone Industrielle, Ben Arous', installationType: 'Control Room', notes: 'Integrated HVAC + lighting', matricule: '' },
  { name: 'EV Charger Type 2', contactId: '', model: 'EVC-22', manufacturer: 'ABB', serialNumber: 'IMP-INS-014', category: 'Electrical', type: 'EV-Charger', status: 'active', siteAddress: 'Cite Ennasr, Tunis', installationType: 'Parking', notes: '22kW three-phase', matricule: '' },
  { name: 'Cold Room Compressor', contactId: '', model: 'CR-40', manufacturer: 'Bitzer', serialNumber: 'IMP-INS-015', category: 'Refrigeration', type: 'Compressor', status: 'active', siteAddress: 'Avenue Farhat Hached, Sfax', installationType: 'Cold Room', notes: 'Restaurant cold storage', matricule: '' },
  { name: 'CCTV NVR Rack Install', contactId: '', model: 'NVR-32', manufacturer: 'Hikvision', serialNumber: 'IMP-INS-016', category: 'Security', type: 'CCTV', status: 'active', siteAddress: 'Route de Gabes, Sfax 3000', installationType: 'Server Room', notes: '32-channel NVR', matricule: '' },
  { name: 'Water Treatment RO Plant', contactId: '', model: 'RO-500', manufacturer: 'Veolia', serialNumber: 'IMP-INS-017', category: 'Water', type: 'Reverse-Osmosis', status: 'active', siteAddress: 'Medina, Kairouan', installationType: 'Plant Room', notes: '500 L/h capacity', matricule: '' },
  { name: 'Legacy Chiller Decommissioned', contactId: '', model: 'CH-200', manufacturer: 'Trane', serialNumber: 'IMP-INS-018', category: 'HVAC', type: 'Chiller', status: 'decommissioned', siteAddress: 'Avenue 7 Novembre, Monastir', installationType: 'Roof', notes: 'Awaiting removal', matricule: '' },
  { name: 'Pending Solar Extension', contactId: '', model: 'PV-500W', manufacturer: 'Longi', serialNumber: 'IMP-INS-019', category: 'Solar', type: 'Photovoltaic', status: 'pending', siteAddress: 'Route de Bizerte, Tunis Nord', installationType: 'Rooftop', notes: 'Phase 2 extension', matricule: '' },
  { name: 'Installed Heat Recovery Unit', contactId: '', model: 'HRU-150', manufacturer: 'Aldes', serialNumber: 'IMP-INS-020', category: 'Ventilation', type: 'Heat-Recovery', status: 'installed', siteAddress: 'Les Jardins de Carthage, Tunis', installationType: 'Ceiling', notes: 'Commissioned Q2 2026', matricule: '' },
];

if (CONTACTS.length !== 20) throw new Error(`Expected 20 contacts, got ${CONTACTS.length}`);
if (ARTICLES.length !== 20) throw new Error(`Expected 20 articles, got ${ARTICLES.length}`);
if (INSTALLATIONS.length !== 20) throw new Error(`Expected 20 installations, got ${INSTALLATIONS.length}`);

CONTACTS.forEach((row, i) => {
  const errs = validateContactStructured(row);
  if (errs.length) throw new Error(`Contact row ${i + 1} (${row.fullName}): ${errs.join(', ')}`);
});
assertUnique(CONTACTS.map((c) => c.email), 'contact email');

ARTICLES.forEach((row, i) => {
  const errs = validateArticle(row);
  if (errs.length) throw new Error(`Article row ${i + 1} (${row.name}): ${errs.join(', ')}`);
});
assertUnique(ARTICLES.map((a) => a.sku), 'article sku');
assertUnique(ARTICLES.map((a) => a.name), 'article name');

INSTALLATIONS.forEach((row, i) => {
  const errs = validateInstallation(row);
  if (errs.length) throw new Error(`Installation row ${i + 1} (${row.name}): ${errs.join(', ')}`);
});
assertUnique(INSTALLATIONS.map((i) => i.serialNumber), 'installation serial');
assertUnique(INSTALLATIONS.map((i) => i.name), 'installation name');

console.log('Validation passed: 20 contacts + 20 articles + 20 installations');

function writeXlsx(filename, sheetName, rows, colWidths) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  if (colWidths) ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, path.join(OUT, filename));
  console.log('Created', filename);
}

function writeCsvUtf8Bom(filename, lines) {
  fs.writeFileSync(path.join(OUT, filename), '\uFEFF' + lines.join('\r\n'), 'utf8');
  console.log('Created', filename);
}

function csvEscape(val) {
  const s = val == null ? '' : String(val);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const structuredRows = [
  STRUCTURED_HEADERS,
  ...CONTACTS.map((c) => [c.fullName, c.email, c.phone, c.contactType, c.position, c.fullAddress]),
];

writeXlsx('contacts-import-test.xlsx', 'Contacts Template', structuredRows, [28, 32, 16, 36, 22, 48].map((w) => ({ wch: w })));
writeCsvUtf8Bom('contacts-import-test.csv', structuredRows.map((row) => row.map(csvEscape).join(',')));

const articleRows = [
  ARTICLE_HEADERS,
  ...ARTICLES.map((a) => [a.name, a.sku, a.description, a.type, a.category, a.status, a.stock, a.minStock, a.costPrice, a.sellPrice, a.basePrice, a.duration, a.supplier, a.location]),
];

writeXlsx('articles-import-test.xlsx', 'Articles Template', articleRows, [28, 14, 40, 10, 14, 10, 8, 10, 12, 12, 18, 14, 16, 16].map((w) => ({ wch: w })));
writeCsvUtf8Bom('articles-import-test.csv', articleRows.map((row) => row.map(csvEscape).join(',')));

const installationRows = [
  INSTALLATION_HEADERS,
  ...INSTALLATIONS.map((i) => [
    i.name, i.contactId, i.model, i.manufacturer, i.serialNumber, i.category, i.type,
    i.status, i.siteAddress, i.installationType, i.notes, i.matricule,
  ]),
];

writeXlsx('installations-import-test.xlsx', 'Installations Template', installationRows, [32, 12, 14, 16, 16, 14, 14, 12, 36, 18, 32, 18].map((w) => ({ wch: w })));
writeCsvUtf8Bom('installations-import-test.csv', installationRows.map((row) => row.map(csvEscape).join(',')));

console.log('\nDone — sample-data/import/');
console.log('  contacts-import-test.xlsx   → /dashboard/contacts (Structured Import tab)');
console.log('  articles-import-test.xlsx   → /dashboard/inventory-services → Import');
console.log('  installations-import-test.xlsx → /dashboard/field/installations → Import');
