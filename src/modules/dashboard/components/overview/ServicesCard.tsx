import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import servicesData from '@/data/mock/services.json';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/shared/components/Typography';

export default function ServicesCard({ services: _services = 8 }: { services?: number }) {
  const navigate = useNavigate();
  const items = (servicesData as any[]).slice(0, 4);

  const handleServiceClick = (id: string) => {
    navigate(`/dashboard/inventory-services/service/${id}`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <Heading as={CardTitle as any} size="card">Services</Heading>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2">
          {items.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2">
              <button className="text-left min-w-0 truncate" onClick={() => handleServiceClick(s.id)}>
                <Text as="div" className="font-medium truncate">{s.name}</Text>
                <Text as="div" variant="muted-xs">{s.category} • {s.duration}m • {s.basePrice ? `${s.basePrice}` : ''}</Text>
              </button>
              <div>
                <Button size="sm" variant="outline" onClick={() => handleServiceClick(s.id)}>Start Order</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
