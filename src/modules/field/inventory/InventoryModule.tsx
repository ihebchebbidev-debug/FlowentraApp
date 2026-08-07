import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Inventory() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>{t('inventory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Empty page — Track tools, equipment, parts, link to jobs, reorder alerts.</p>
        </CardContent>
      </Card>
    </div>
  );
}
