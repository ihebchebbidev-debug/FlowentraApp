import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LeadsCard({ newLeads = 0, hotLeads = 0 }: { newLeads?: number; hotLeads?: number }) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">Leads</div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">New {newLeads}</Badge>
            <Badge variant="destructive">Hot {hotLeads}</Badge>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">Unassigned leads: {newLeads}</div>
      </CardContent>
    </Card>
  );
}
