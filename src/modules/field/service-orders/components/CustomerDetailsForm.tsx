import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreateServiceOrderData } from "../types";
import CustomerSearch from "./CustomerSearch";
import { MapLocationPicker } from "@/components/shared/MapLocationPicker";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: string;
  status: string;
  type: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  formData: CreateServiceOrderData;
  updateCustomer: (field: string, value: string) => void;
  updateCustomerAddress: (field: string, value: string | number) => void;
}

export default function CustomerDetailsForm({ formData, updateCustomer, updateCustomerAddress }: Props) {
  const { t } = useTranslation('service_orders');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    
    // Auto-populate customer data
    updateCustomer('company', customer.company);
    updateCustomer('contactPerson', customer.name);
    updateCustomer('email', customer.email);
    updateCustomer('phone', customer.phone);
    
    // Auto-populate address if available
    if (customer.address) {
      updateCustomerAddress('street', customer.address);
    }
    
    // Auto-populate geolocation if available
    if (customer.latitude && customer.longitude) {
      updateCustomerAddress('latitude', customer.latitude);
      updateCustomerAddress('longitude', customer.longitude);
      updateCustomerAddress('hasLocation', 1);
    }
  };

  const handleLocationChange = (lat: string, lng: string) => {
    updateCustomerAddress('latitude', lat ? parseFloat(lat) : 0);
    updateCustomerAddress('longitude', lng ? parseFloat(lng) : 0);
    updateCustomerAddress('hasLocation', lat && lng ? 1 : 0);
  };

  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('customer_details')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Search */}
          <CustomerSearch 
            onSelect={handleCustomerSelect}
            selectedCustomer={selectedCustomer}
          />
          
          {selectedCustomer && (
            <div className="text-sm text-muted-foreground">
              {t('customer_selected_info')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Map Picker */}
      <MapLocationPicker
        latitude={formData.customer.address.latitude?.toString() || ''}
        longitude={formData.customer.address.longitude?.toString() || ''}
        onLocationChange={handleLocationChange}
        height="280px"
        showCoordinateInputs={true}
      />
    </div>
  );
}