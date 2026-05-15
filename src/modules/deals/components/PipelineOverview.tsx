import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

type Stage = { name: string; count: number };

export function PipelineOverview({ stages }: { stages: Stage[] }) {
  const { t } = useTranslation('deals');
  return (
    <Card className="shadow-card border-0 gradient-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground">{t('pipeline.title')}</CardTitle>
        <CardDescription>{t('pipeline.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stages.map((stage, index) => (
            <div key={index} className="text-center group cursor-pointer">
              <div className={`h-20 bg-chart-${index + 1} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-medium`}>
                {stage.count}
              </div>
              <p className="text-[13px] font-semibold text-foreground mt-2">{t(`stages.${stage.name}`)}</p>
              <p className="text-[11px] text-muted-foreground">{t('pipeline.deals')}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
