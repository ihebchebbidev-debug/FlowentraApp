import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConnectionLog {
  id: string;
  name: string;
  email: string;
  role: string;
  time: string;
  ip: string;
  status: 'Active' | 'Inactive';
  avatar?: string;
}

const connectionLogs: ConnectionLog[] = [
  {
    id: '1',
    name: 'Hend Kharez',
    email: 'hend@gmail.com',
    role: 'user',
    time: '20.1.2024, 12:30:00',
    ip: 'N/A',
    status: 'Active'
  },
  {
    id: '2',
    name: 'Hend Kharez',
    email: 'hend@gmail.com',
    role: 'admin',
    time: '20.1.2024, 10:15:00',
    ip: 'N/A',
    status: 'Active'
  },
  {
    id: '3',
    name: 'Hend Kharez',
    email: 'hend@gmail.com',
    role: 'user',
    time: '19.1.2024, 17:45:00',
    ip: 'N/A',
    status: 'Active'
  }
];

export function ConnectionLogs() {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const { t } = useTranslation('settings');

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 rounded-lg bg-chart-1/10">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-chart-1" />
            </div>
            {t('connectionLogs.title')}
          </CardTitle>
          <CardDescription>{t('connectionLogs.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('connectionLogs.table.user')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('connectionLogs.table.role')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('connectionLogs.table.time')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('connectionLogs.table.ip')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">{t('connectionLogs.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {connectionLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(log.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground text-sm">{log.name}</div>
                          <div className="text-xs text-muted-foreground">{log.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={getRoleBadgeVariant(log.role)} className="capitalize">
                        {log.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground">{log.time}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{log.ip}</td>
                    <td className="py-4 px-4">
                      <Badge variant={log.status === 'Active' ? 'default' : 'secondary'} className="bg-success/10 text-success hover:bg-success/20">
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
