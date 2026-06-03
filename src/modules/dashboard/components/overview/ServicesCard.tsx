import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/shared/components/Typography';
import { useArticles } from '@/modules/articles/hooks/useArticles';

export default function ServicesCard({ services: _services = 8 }: { services?: number }) {
  const navigate = useNavigate();
  // Real, tenant-scoped services (articles of type "service").
  const { articles, isLoading } = useArticles({ type: 'service' });
  const items = (articles as any[]).slice(0, 4);

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
          {!isLoading && items.length === 0 && (
            <Text as="div" variant="muted-xs" className="py-2">No services yet</Text>
          )}
          {items.map(s => {
            const price = s.basePrice ?? s.sellPrice;
            return (
              <div key={s.id} className="flex items-center justify-between py-2">
                <button className="text-left min-w-0 truncate" onClick={() => handleServiceClick(s.id)}>
                  <Text as="div" className="font-medium truncate">{s.name}</Text>
                  <Text as="div" variant="muted-xs">
                    {[s.category, s.duration != null ? `${s.duration}m` : null, price != null ? `${price}` : null].filter(Boolean).join(' • ')}
                  </Text>
                </button>
                <div>
                  <Button size="sm" variant="outline" onClick={() => handleServiceClick(s.id)}>Start Order</Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
