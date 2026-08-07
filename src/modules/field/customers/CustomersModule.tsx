import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Customers() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle>{t('customers_lite')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Empty page — Customer profiles with job history, contacts, notes, reminders.</p>
        </CardContent>
      </Card>
    </div>
  );
}
