import { Card, CardContent } from "@/components/ui/card";
import { Building2, Wrench } from "lucide-react";
import { Group } from "../types";

type Props = {
  group: Group;
  onChange: (g: Group) => void;
  getTotals: (g: Group) => { categories: number };
};

export function GroupSelector({ group, onChange, getTotals }: Props) {
  return (
    <div className="p-3 sm:p-4 border-b border-border">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {(['crm','field'] as Group[]).map((g, index) => {
          const isSelected = group === g;
          const color = index === 0 ? 'chart-1' : 'chart-2';
          const Icon = g === 'crm' ? Building2 : Wrench;
          const totals = getTotals(g);
          return (
            <Card
              key={g}
              className={`shadow-card hover-lift gradient-card group cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'border-2 border-primary bg-primary/5' : 'border-0'
              }`}
              onClick={() => onChange(g)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                      isSelected ? 'bg-primary/20' : `bg-${color}/10 group-hover:bg-${color}/20`
                    }`}>
                      <Icon className={`h-4 w-4 transition-all ${
                        isSelected ? 'text-primary' : `text-${color}`
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium truncate">{g === 'crm' ? 'CRM' : 'Field'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{totals.categories}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
