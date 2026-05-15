import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Grid, List } from "lucide-react";

export function WorkflowCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendrier des interventions</h1>
          <p className="text-muted-foreground">Planifiez et visualisez les interventions</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="rounded-r-none"
            >
              Mois
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="rounded-none"
            >
              Semaine
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="rounded-l-none"
            >
              Jour
            </Button>
          </div>
          
          <Button variant="outline" size="sm">
            <Grid className="h-4 w-4 mr-2" />
            Vue tableau
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Planifier intervention
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="capitalize">{formatDate(currentDate)}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">Calendrier en cours de développement</h3>
            <p>Le calendrier des interventions sera bientôt disponible</p>
            <div className="flex gap-2 justify-center mt-4">
              <Badge variant="outline">Drag & Drop</Badge>
              <Badge variant="outline">Vue chronologique</Badge>
              <Badge variant="outline">Planification intelligente</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}