import { MapItem } from "./MapView";

// Service Orders - Updated to use contact with geolocation from API
export interface ServiceOrderForMap {
  id: string | number;
  orderNumber: string;
  description?: string;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  contact?: {
    name?: string;
    company?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    hasLocation?: number;
  };
}

export function mapServiceOrdersToMapItems(orders: ServiceOrderForMap[]): MapItem[] {
  return orders
    .filter(order => order.contact?.hasLocation === 1)
    .map(order => ({
      id: String(order.id),
      title: order.orderNumber,
      subtitle: order.description || 'Service Order',
      priority: order.priority || 'medium',
      status: order.status,
      location: {
        latitude: order.contact!.latitude!,
        longitude: order.contact!.longitude!,
        hasLocation: order.contact!.hasLocation!,
        address: order.contact?.address || '',
        city: order.contact?.city || ''
      }
    }));
}

// Dispatches
export interface DispatchJob {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  customer: {
    address: {
      street: string;
      city: string;
      latitude: number;
      longitude: number;
      hasLocation: number;
    };
  };
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export function mapDispatchesToMapItems(dispatches: DispatchJob[]): MapItem[] {
  return dispatches
    .filter(dispatch => dispatch.customer?.address?.hasLocation === 1)
    .map(dispatch => ({
      id: dispatch.id,
      title: dispatch.jobNumber,
      subtitle: dispatch.description,
      priority: dispatch.priority,
      status: dispatch.status,
      location: {
        latitude: dispatch.customer.address.latitude,
        longitude: dispatch.customer.address.longitude,
        hasLocation: dispatch.customer.address.hasLocation,
        address: dispatch.customer.address.street,
        city: dispatch.customer.address.city
      }
    }));
}

// Sales - Updated to use contact with geolocation from API
export interface SaleForMap {
  id: string | number;
  title: string;
  status: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  totalAmount?: number;
  currency?: string;
  // Nested contact object from API
  contact?: {
    name?: string;
    company?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    hasLocation?: number;
  };
  // Direct contact fields (from mapped service)
  contactName?: string;
  contactCompany?: string;
  contactAddress?: string;
  contactLatitude?: number;
  contactLongitude?: number;
  contactHasLocation?: number;
}

export function mapSalesToMapItems(sales: SaleForMap[]): MapItem[] {
  return sales
    .filter(sale => {
      // Check both nested contact and direct fields
      return sale.contact?.hasLocation === 1 || sale.contactHasLocation === 1;
    })
    .map(sale => {
      // Use nested contact if available, otherwise use direct fields
      const lat = sale.contact?.latitude ?? sale.contactLatitude;
      const lng = sale.contact?.longitude ?? sale.contactLongitude;
      const hasLocation = sale.contact?.hasLocation ?? sale.contactHasLocation;
      const address = sale.contact?.address ?? sale.contactAddress ?? '';
      const city = sale.contact?.city ?? '';
      const company = sale.contact?.company ?? sale.contactCompany ?? 'Unknown';
      
      return {
        id: String(sale.id),
        title: sale.title,
        subtitle: `${company} - ${sale.totalAmount || 0} ${sale.currency || 'TND'}`,
        priority: sale.priority || 'medium',
        status: sale.status,
        location: {
          latitude: lat!,
          longitude: lng!,
          hasLocation: hasLocation!,
          address: address,
          city: city
        }
      };
    });
}

// Offers - Map offers with contact geolocation from API
export interface OfferForMap {
  id: string | number;
  title: string;
  status: string;
  totalAmount?: number;
  currency?: string;
  // Contact with geolocation (nested object from API)
  contact?: {
    name?: string;
    company?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    hasLocation?: number;
  };
  // Direct contact fields (from mapped service)
  contactName?: string;
  contactCompany?: string;
  contactAddress?: string;
  contactLatitude?: number;
  contactLongitude?: number;
  contactHasLocation?: number;
}

export function mapOffersToMapItems(offers: OfferForMap[]): MapItem[] {
  return offers
    .filter(offer => {
      // Check both nested contact and direct fields
      const hasLocation = offer.contact?.hasLocation === 1 || offer.contactHasLocation === 1;
      return hasLocation;
    })
    .map(offer => {
      // Prefer nested contact, fallback to direct fields
      const latitude = offer.contact?.latitude ?? offer.contactLatitude;
      const longitude = offer.contact?.longitude ?? offer.contactLongitude;
      const hasLocation = offer.contact?.hasLocation ?? offer.contactHasLocation;
      const address = offer.contact?.address ?? offer.contactAddress ?? '';
      const city = offer.contact?.city ?? '';
      const company = offer.contact?.company ?? offer.contactCompany ?? 'Unknown Company';

      return {
        id: String(offer.id),
        title: offer.title,
        subtitle: `${company} - ${offer.totalAmount || 0} ${offer.currency || 'TND'}`,
        priority: 'medium' as const,
        status: offer.status,
        location: {
          latitude: latitude!,
          longitude: longitude!,
          hasLocation: hasLocation!,
          address: address,
          city: city
        }
      };
    });
}

// Contacts - Map contacts with geolocation
export interface ContactForMap {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  city?: string;
  status?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  hasLocation?: number;
}

export function mapContactsToMapItems(contacts: ContactForMap[]): MapItem[] {
  return contacts
    .filter(contact => contact.hasLocation === 1)
    .map(contact => ({
      id: String(contact.id),
      title: contact.name,
      subtitle: contact.company || contact.position || contact.email || '',
      priority: 'medium' as const,
      status: contact.status || 'active',
      location: {
        latitude: contact.latitude!,
        longitude: contact.longitude!,
        hasLocation: contact.hasLocation!,
        address: contact.address || '',
        city: contact.city || ''
      }
    }));
}
