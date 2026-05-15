import { useState } from "react";
import { Search, Plus, User, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

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
}

interface ContactSelectorAdvancedProps {
  onContactSelect: (contact: Contact) => void;
  selectedContact: Contact | null;
}

export function ContactSelectorAdvanced({ onContactSelect, selectedContact }: ContactSelectorAdvancedProps) {
  const { t } = useTranslation('contacts');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showContacts, setShowContacts] = useState(true);

  const filteredContacts = contactsData.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.company ?? '').toLowerCase().includes(searchTerm.toLowerCase())
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
  };

  const handleAddNewContact = () => {
    navigate('/dashboard/contacts/add', { 
      state: { returnTo: '/dashboard/sales/add' }
    });
  };

  if (selectedContact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('selector.title')}</h3>
          <Button 
            variant="outline" 
            onClick={() => {
              onContactSelect(null as any);
              setShowContacts(true);
            }}
            size="sm"
          >
            {t('selector.change')}
          </Button>
        </div>
        
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">{selectedContact.name}</h4>
                  {selectedContact.email && (
                    <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                  )}
                  {selectedContact.phone && (
                    <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                  )}
                  {selectedContact.company && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span className="text-sm text-muted-foreground">{selectedContact.company}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {t('selector.selected')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('selector.title')}</h3>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('contacts.search_placeholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowContacts(true);
            }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleAddNewContact} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          {t('contacts.add')}
        </Button>
      </div>

      {showContacts && (
        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2 bg-muted/20">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('selector.no_contacts')}</p>
              {searchTerm && (
                <p className="text-sm">{t('selector.try_different_search')}</p>
              )}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <Card 
                key={contact.id}
                className="border cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => handleSelectContact(contact)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{contact.name}</h4>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                        {contact.company && (
                          <div className="flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">{contact.company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}