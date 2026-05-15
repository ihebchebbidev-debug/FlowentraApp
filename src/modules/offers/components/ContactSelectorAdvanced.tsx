import { useState } from "react";
import { Search, Plus, User, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type?: string;
}

interface ContactSelectorAdvancedProps {
  onContactSelect: (contact: Contact) => void;
  selectedContact: Contact | null;
}

export function ContactSelectorAdvanced({ onContactSelect, selectedContact }: ContactSelectorAdvancedProps) {
  const { t } = useTranslation('offers');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showContacts, setShowContacts] = useState(true);

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
      address: contact.company, // Using company as address for now
      company: contact.company
    });
    setShowContacts(false);
    setSearchTerm("");
  };

  const handleCreateNewContact = () => {
    // Navigate to contact creation form
    navigate('/dashboard/contacts/add');
  };

  if (selectedContact && selectedContact.name) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Selected Contact</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onContactSelect({ id: "", name: "", email: "", phone: "", address: "" });
              setShowContacts(true);
            }}
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select contact</h3>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowContacts(true);
            }}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleCreateNewContact}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {showContacts && (
        <Card className="max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {filteredContacts.length > 0 ? (
              <div className="divide-y">
                {filteredContacts.slice(0, 10).map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium break-words line-clamp-2">{contact.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {contact.status}
                          </Badge>
                        </div>
                        {contact.company && (
                          <p className="text-sm text-muted-foreground break-words line-clamp-1">{contact.company}</p>
                        )}
                        {contact.email && (
                          <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <div className="mb-4">
                  <User className="h-12 w-12 mx-auto opacity-50" />
                </div>
                <p className="mb-2">No contacts found matching "{searchTerm}"</p>
                <Button
                  variant="link"
                  onClick={handleCreateNewContact}
                  className="p-0 h-auto gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create new contact
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}