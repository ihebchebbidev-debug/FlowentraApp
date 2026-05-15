import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import AddTodoModal from "../components/AddTodoModal";
import { Building2, Mail, Phone, ArrowLeft, MapPin, Calendar, Plus, Upload, FileText, Download, Trash2, User, PlusCircle } from "lucide-react";
import { TasksService, BackendDailyTaskResponse } from "../../../tasks/services/tasks.service";

interface Todo { id: string; title: string; done: boolean; due?: string | null }
interface FileAttachment { id: string; name: string; size: string; uploadedAt: string; type: string }

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  console.log("ClientDetail rendering with id:", id);

  const clientId = id ?? "0";

  useEffect(() => {
    document.title = `Client #${clientId} — Field Customers`;
  }, [clientId]);

  // Mock client data (in a real app, fetch by id)
  const client = useMemo(() => ({
    id: Number(clientId),
    name: clientId === '1' ? 'Acme Corporation' : 'TechFlow Solutions',
    email: clientId === '1' ? 'contact@acme.com' : 'info@techflow.com',
    phone: clientId === '1' ? '+1 555 123 4567' : '+1 555 987 6543',
    address: clientId === '1' ? '100 Corporate Blvd, Boston 02101' : '200 Tech Park, Austin 78701',
    status: "Customer",
    type: "company" as const,
    keyUsers: clientId === '1' ? ['John Doe', 'Sarah Wilson', 'Mark Brown'] : ['Mike Chen', 'Lisa Johnson'],
    tags: clientId === '1' ? ["Enterprise", "Key Account", "Fortune 500"] : ["Startup", "Potential", "SaaS"],
    industry: clientId === '1' ? 'Manufacturing' : 'Technology',
    website: clientId === '1' ? 'www.acme.com' : 'www.techflow.com',
    lastContact: clientId === '1' ? '2024-01-14' : '2024-01-08',
  }), [clientId]);

  // To-Dos state - using backend APIs
  const [todos, setTodos] = useState<BackendDailyTaskResponse[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [todosLoading, setTodosLoading] = useState(false);

  // Files state
  const filesStorageKey = `field_clients_files_${clientId}`;
  const [files, setFiles] = useState<FileAttachment[]>(() => {
    const raw = localStorage.getItem(filesStorageKey);
    return raw ? JSON.parse(raw) : [];
  });

  useEffect(() => {
    localStorage.setItem(filesStorageKey, JSON.stringify(files));
  }, [filesStorageKey, files]);

  // Load todos from backend
  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setTodosLoading(true);
      // For client todos, we'll use userId as clientId for simplicity
      const userTodos = await TasksService.getUserDailyTasks(parseInt(clientId));
      setTodos(userTodos);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setTodosLoading(false);
    }
  };

  const addTodo = async (item: { title: string; due?: string | null }) => {
    try {
      const createDto = {
        userId: parseInt(clientId),
        userName: `Client ${clientId}`,
        title: item.title,
        description: `Todo for client ${client.name}`,
        status: "todo" as const,
        priority: "medium" as const,
        tags: [`client-${clientId}`],
        dueDate: item.due ? item.due : undefined
      };
      
      await TasksService.createDailyTask(createDto);
      await loadTodos(); // Refresh the list
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  };

  const toggleTodo = async (todoId: string) => {
    try {
      const todo = todos.find(t => t.id === todoId);
      if (!todo) return;
      
      const isCompleted = todo.status !== 'done';
      await TasksService.updateDailyTask(Number(todoId), { isCompleted });
      await loadTodos(); // Refresh the list
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const removeTodo = async (todoId: string) => {
    try {
      await TasksService.deleteDailyTask(Number(todoId));
      await loadTodos(); // Refresh the list
    } catch (error) {
      console.error('Failed to remove todo:', error);
    }
  };

  // File functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach((file) => {
      const newFile: FileAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toLocaleDateString(),
        type: file.type || 'unknown'
      };
      setFiles((prev) => [newFile, ...prev]);
    });
    
    // Reset input
    event.target.value = '';
  };

  const removeFile = (fileId: string) => setFiles((prev) => prev.filter(f => f.id !== fileId));

  const _initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <header className="p-4 sm:p-6 border-b border-border bg-background/95">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common:back', 'Back')}
          </Button>
        </div>
        <div className="flex items-start sm:items-center gap-4">
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground break-words line-clamp-2">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className="status-success">{client.status}</Badge>
              {client.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="gradient-primary text-white">New Task</Button>
          </div>
        </div>
      </header>

      <main className="p-3 sm:p-4 lg:p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">{t('field_customers:overview', 'Overview')}</TabsTrigger>
            <TabsTrigger value="todos">{t('field_customers:todos', 'To-Dos')}</TabsTrigger>
            <TabsTrigger value="documents">{t('field_customers:documents', 'Documents')}</TabsTrigger>
            <TabsTrigger value="service_orders">{t('field_customers:service_orders', 'Service Orders')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {t('field_customers:detail.contact_info', 'Contact Information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{t('field_customers:detail.last_contact', 'Last contact')}: {client.lastContact}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Company Details */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {t('field_customers:detail.company_details', 'Company Details')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('field_customers:detail.company_label', 'Company')}</label>
                    <p className="text-sm font-semibold mt-1">{client.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('field_customers:detail.industry', 'Industry')}</label>
                    <p className="text-sm font-semibold mt-1">{client.industry}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('field_customers:detail.website', 'Website')}</label>
                    <p className="text-sm font-semibold mt-1">{client.website}</p>
                  </div>
                  {client.type === 'company' && client.keyUsers && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">{t('field_customers:detail.key_users', 'Key Users')}</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {client.keyUsers.map((user, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {user}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tags & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">{t('field_customers:detail.tags', 'Tags')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                      <PlusCircle className="h-3 w-3 mr-1" />
                      {t('field_customers:detail.add_tag', 'Add Tag')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">{t('field_customers:detail.summary', 'Summary')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{t('field_customers:detail.open_todos', 'Open to-dos')}: {todos.filter(t => t.status !== 'done').length}</p>
                    <p>{t('field_customers:detail.completed_todos', 'Completed to-dos')}: {todos.filter(t => t.status === 'done').length}</p>
                    <p>{t('field_customers:detail.documents_count', 'Documents')}: {files.length}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t('field_customers:detail.customer_since', 'Customer since 2023 • Active account', { year: 2023 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="todos">
            <Card className="shadow-card border-0">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{t('field_customers:todos_section.title', 'To-Dos')}</CardTitle>
                <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> {t('field_customers:todos_section.add_todo', 'Add To-Do')}
                </Button>
              </CardHeader>
              <CardContent>
                {todosLoading ? (
                  <p className="text-muted-foreground">{t('field_customers:todos_section.loading', 'Loading to-dos...')}</p>
                ) : todos.length === 0 ? (
                  <p className="text-muted-foreground">{t('field_customers:todos_section.no_todos', 'No to-dos yet.')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('field_customers:todos_section.table.title', 'Title')}</TableHead>
                        <TableHead>{t('field_customers:todos_section.table.status', 'Status')}</TableHead>
                        <TableHead>{t('field_customers:todos_section.table.due', 'Due')}</TableHead>
                        <TableHead className="text-right">{t('field_customers:todos_section.table.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todos.map((todo) => (
                        <TableRow key={todo.id} className="hover:bg-muted/50">
                          <TableCell>{todo.title}</TableCell>
                          <TableCell>
                            <Badge className={todo.status === 'done' ? 'status-success' : 'status-warning'}>
                              {todo.status === 'done' ? t('field_customers:todos_section.status.done', 'Done') : t('field_customers:todos_section.status.open', 'Open')}
                            </Badge>
                          </TableCell>
                          <TableCell>{todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => toggleTodo(todo.id)}>
                              {todo.status === 'done' ? t('field_customers:todos_section.mark_open', 'Mark Open') : t('field_customers:todos_section.mark_done', 'Mark Done')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => removeTodo(todo.id)}>
                              {t('delete', 'Delete')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <AddTodoModal open={addOpen} onOpenChange={setAddOpen} onAdd={addTodo} />
          </TabsContent>

          <TabsContent value="documents">
            <Card className="shadow-card border-0">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{t('field_customers:documents_section.title', 'Documents')}</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => document.getElementById('file-upload')?.click()} 
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" /> {t('field_customers:documents_section.upload_files', 'Upload Files')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t('field_customers:documents_section.no_documents', 'No documents uploaded yet.')}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('field_customers:documents_section.no_documents_description', 'Upload documents, images, or other files related to this client.')}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('field_customers:documents_section.table.file_name', 'File Name')}</TableHead>
                        <TableHead>{t('field_customers:documents_section.table.type', 'Type')}</TableHead>
                        <TableHead>{t('field_customers:documents_section.table.size', 'Size')}</TableHead>
                        <TableHead>{t('field_customers:documents_section.table.uploaded', 'Uploaded')}</TableHead>
                        <TableHead className="text-right">{t('field_customers:documents_section.table.actions', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id} className="hover:bg-muted/50">
                          <TableCell className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{file.name}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </Badge>
                          </TableCell>
                          <TableCell>{file.size}</TableCell>
                          <TableCell>{file.uploadedAt}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" className="gap-1">
                              <Download className="h-3 w-3" />
                              {t('field_customers:documents_section.download', 'Download')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => removeFile(file.id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t('delete', 'Delete')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service_orders">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle>{t('field_customers:service_orders_section.title', 'Service Orders')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('field_customers:service_orders_section.no_orders', 'No service orders yet.')}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
