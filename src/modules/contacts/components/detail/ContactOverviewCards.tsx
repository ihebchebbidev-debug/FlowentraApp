import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Mail, MapPin, Phone, User } from "lucide-react";

export function ContactOverviewCards({ contact, tags, onAddTag }: {
  contact: any;
  tags: string[];
  onAddTag: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-sm">{contact.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-sm">{contact.phone}</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-sm">{contact.address}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm">Last contact: {contact.lastContact}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Company</label>
            <p className="text-sm font-semibold mt-1">{contact.company}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Position</label>
            <p className="text-sm font-semibold mt-1">{contact.position}</p>
          </div>
          {contact.type === 'company' && contact.keyUsers && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Key Users</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {contact.keyUsers.map((user: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {user}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags?.map((tag: any, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {typeof tag === 'string' ? tag : tag.name || tag}
              </Badge>
            ))}
            <button onClick={onAddTag} className="h-6 px-2 text-xs border rounded-md">Add Tag</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
