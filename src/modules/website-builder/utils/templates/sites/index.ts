/**
 * Site Templates — Split into individual files for maintainability.
 * Each template is in its own file, re-exported here as a single array.
 */
import { SiteTemplate } from '../index';

import { carRepairTemplate } from './carRepair';
import { restaurantTemplate } from './restaurant';
import { portfolioTemplate } from './portfolio';
import { medicalClinicTemplate } from './medicalClinic';
import { realEstateTemplate } from './realEstate';
import { fitnessGymTemplate } from './fitnessGym';
import { beautySalonTemplate } from './beautySalon';
import { lawFirmTemplate } from './lawFirm';
import { photographyTemplate } from './photography';
import { ecommerceTemplate } from './ecommerce';
import { fashionBoutiqueTemplate } from './fashionBoutique';
import { saasStartupTemplate } from './saasStartup';
import { educationTemplate } from './education';
import { cleaningServiceTemplate } from './cleaningService';
import { weddingPlannerTemplate } from './weddingPlanner';
import { consultingTemplate } from './consulting';
import { nonprofitTemplate } from './nonprofit';
import { cafeBakeryTemplate } from './cafeBakery';
import { creativeAgencyTemplate } from './creativeAgency';
import { petCareTemplate } from './petCare';
import { travelAgencyTemplate } from './travelAgency';
import { dentalOfficeTemplate } from './dentalOffice';
import { churchMinistryTemplate } from './churchMinistry';
import { internationalBusinessTemplate } from './internationalBusiness';
import { paintBodyShopTemplate } from './paintBodyShop';
import { premiumEcommerceTemplate } from './premiumEcommerce';
import { comingSoonTemplate } from './comingSoon';
import { personalTemplate } from './personal';
// Wave 2 additions
import { docsTemplate } from './docs';
import { eventConferenceTemplate } from './eventConference';
import { realEstateLuxuryTemplate } from './realEstateLuxury';
import { darkCreativeTemplate } from './darkCreative';
import { ecoBrandTemplate } from './ecoBrand';
import { therapistTemplate } from './therapist';
// Contact page templates
import { contactPageCorporateTemplate } from './contactPageCorporate';
import { contactPageCreativeTemplate } from './contactPageCreative';
import { contactPageMinimalTemplate } from './contactPageMinimal';
// New e-commerce templates powered by the storeRules engine
import { digitalDownloadsTemplate } from './digitalDownloads';
import { subscriptionBoxTemplate } from './subscriptionBox';

export const SITE_TEMPLATES: SiteTemplate[] = [
  carRepairTemplate,
  restaurantTemplate,
  portfolioTemplate,
  medicalClinicTemplate,
  realEstateTemplate,
  fitnessGymTemplate,
  beautySalonTemplate,
  lawFirmTemplate,
  photographyTemplate,
  ecommerceTemplate,
  fashionBoutiqueTemplate,
  saasStartupTemplate,
  educationTemplate,
  cleaningServiceTemplate,
  weddingPlannerTemplate,
  consultingTemplate,
  nonprofitTemplate,
  cafeBakeryTemplate,
  creativeAgencyTemplate,
  petCareTemplate,
  travelAgencyTemplate,
  dentalOfficeTemplate,
  churchMinistryTemplate,
  internationalBusinessTemplate,
  paintBodyShopTemplate,
  premiumEcommerceTemplate,
  comingSoonTemplate,
  personalTemplate,
  // Wave 2 additions
  docsTemplate,
  eventConferenceTemplate,
  realEstateLuxuryTemplate,
  darkCreativeTemplate,
  ecoBrandTemplate,
  therapistTemplate,
  // Contact page templates
  contactPageCorporateTemplate,
  contactPageCreativeTemplate,
  contactPageMinimalTemplate,
  // New e-commerce templates
  digitalDownloadsTemplate,
  subscriptionBoxTemplate,
];
export function getTemplateCategories(): string[] {
  return [...new Set(SITE_TEMPLATES.map(t => t.category))];
}

export function getTemplateById(id: string): SiteTemplate | undefined {
  return SITE_TEMPLATES.find(t => t.id === id);
}

export type { SiteTemplate };
