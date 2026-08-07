import React, { useState, useRef } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useSupportViewModel } from '../viewmodel/supportViewModel';
import { useNavigate } from 'react-router-dom';

const modules = ['Dashboard', 'Sales', 'Inventory', 'Field', 'Settings'];
const categories = ['Bug', 'Feature Request', 'Billing', 'Account', 'Other'];
const urgencies = ['Low', 'Medium', 'High', 'Critical'];

export default function NewTicketForm() {
  const { createTicket, loading } = useSupportViewModel();
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [module, setModule] = useState(modules[0]);
  const [category, setCategory] = useState(categories[0]);
  const [urgency, setUrgency] = useState(urgencies[1]);
  const [errorDetails, setErrorDetails] = useState('');
  const [links, setLinks] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !shortDesc) return;
    
    // Convert File objects to Attachment format
    const formattedAttachments = attachments.map(file => ({
      id: `att-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      mime: file.type,
      file // Keep the original file object for upload if needed
    }));
    
    const ticket = {
      id: `TCK-${Math.floor(Math.random() * 100000)}`,
      subject: title,
      shortDesc,
      module,
      category,
      urgency,
      status: 'Open',
      createdAt: new Date().toISOString().slice(0,10),
      updatedAt: new Date().toISOString().slice(0,10),
      messages: [ { from: "user" as "user" | "support" | "system", text: shortDesc + (errorDetails ? '\n\nDetails:\n' + errorDetails : ''), date: new Date().toISOString().slice(0,10) } ],
      attachments: formattedAttachments,
      links: links.split(',').map(l => l.trim()).filter(Boolean)
    };

    await createTicket(ticket);
    navigate('/dashboard/help/tickets');
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Create Support Request</h2>
        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
          <Input placeholder="Short title" value={title} onChange={e => setTitle(e.target.value)} required />
          <Input placeholder="One-line summary" value={shortDesc} onChange={e => setShortDesc(e.target.value)} required />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="border rounded p-2 bg-background" value={module} onChange={e => setModule(e.target.value)}>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="border rounded p-2 bg-background" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="border rounded p-2 bg-background" value={urgency} onChange={e => setUrgency(e.target.value)}>
              {urgencies.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <textarea className="border rounded p-2 min-h-[120px] bg-background text-foreground" placeholder="Error details, steps to reproduce, logs..." value={errorDetails} onChange={e => setErrorDetails(e.target.value)} />
          <Input placeholder="Related links (comma separated)" value={links} onChange={e => setLinks(e.target.value)} />

          <div className="flex items-center gap-2">
            <input type="file" multiple ref={fileRef} onChange={handleFileChange} className="text-xs text-muted-foreground" />
            <div className="text-xs text-muted-foreground">{attachments.length > 0 ? `${attachments.length} file(s) selected` : 'No files attached'}</div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>Create Request</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/help/tickets')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
