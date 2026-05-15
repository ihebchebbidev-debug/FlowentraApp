import { useState } from "react";
import { Search, Plus, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

// Mock contacts data - in real app this would come from an API
import contactsData from "@/data/mock/contacts.json";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  position?: string;
  type?: string;
  cin?: string;
  matriculeFiscale?: string;
}

interface ContactSelectorProps {
  onContactSelect: (contact: Contact | null) => void;
  selectedContact: Contact | null;
}

export function ContactSelector({ onContactSelect, selectedContact }: ContactSelectorProps) {
  const { t } = useTranslation('offers');
  const [searchTerm, setSearchTerm] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    cin: "",
    matriculeFiscale: ""
  });

  const filteredContacts = contactsData.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectContact = (contact: any) => {
    onContactSelect({
      id: contact.id.toString(),
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address || '',
      company: contact.company,
      position: contact.position || ''
    });
    setShowContacts(false);
    setSearchTerm("");
  };

  const handleCreateNewContact = () => {
    if (!newContact.name) return;
    
    const contact: Contact = {
      id: `new-${Date.now()}`,
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      address: newContact.address,
      company: newContact.company,
      cin: newContact.cin,
      matriculeFiscale: newContact.matriculeFiscale
    };
    
    onContactSelect(contact);
    setIsCreatingNew(false);
    setNewContact({ name: "", email: "", phone: "", address: "", company: "", cin: "", matriculeFiscale: "" });
  };

  if (selectedContact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Selected Contact</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onContactSelect(null)}
          >
            Change Contact
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {selectedContact.company ? (
                  <Building2 className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedContact.name}</h3>
                {selectedContact.company && (
                  <p className="text-sm text-muted-foreground">{selectedContact.company}</p>
                )}
                {selectedContact.email && (
                  <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                )}
                {selectedContact.phone && (
                  <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCreatingNew) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Create New Contact</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreatingNew(false)}
          >
            Cancel
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("contact_name")} *</Label>
            <Input
              id="name"
              value={newContact.name}
              onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={newContact.company}
              onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("contact_email")}</Label>
            <Input
              id="email"
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("contact_phone")}</Label>
            <Input
              id="phone"
              value={newContact.phone}
              onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">{t("contact_address")}</Label>
            <Input
              id="address"
              value={newContact.address}
              onChange={(e) => setNewContact(prev => ({ ...prev, address: e.target.value }))}
              placeholder={t("address_placeholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cin">{t("cin")}</Label>
            <Input
              id="cin"
              value={newContact.cin}
              onChange={(e) => setNewContact(prev => ({ ...prev, cin: e.target.value }))}
              placeholder={t("cin_placeholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="matriculeFiscale">{t("matricule_fiscale")}</Label>
            <Input
              id="matriculeFiscale"
              value={newContact.matriculeFiscale}
              onChange={(e) => setNewContact(prev => ({ ...prev, matriculeFiscale: e.target.value }))}
              placeholder={t("matricule_fiscale_placeholder")}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsCreatingNew(false)}>
            {t("cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={handleCreateNewContact} disabled={!newContact.name}>
            {t("create_contact", { defaultValue: "Create Contact" })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Select or Create Contact</Label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search existing contacts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowContacts(e.target.value.length > 0);
            }}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsCreatingNew(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Contact
        </Button>
      </div>

      {showContacts && searchTerm && (
        <Card className="max-h-64 overflow-y-auto">
          <CardContent className="p-0">
            {filteredContacts.length > 0 ? (
              <div className="divide-y">
                {filteredContacts.slice(0, 10).map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {contact.type === 'company' ? (
                          <Building2 className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{contact.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {contact.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.company}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <p>No contacts found matching "{searchTerm}"</p>
                <Button
                  variant="link"
                  onClick={() => setIsCreatingNew(true)}
                  className="p-0 h-auto"
                >
                  Create new contact instead
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}