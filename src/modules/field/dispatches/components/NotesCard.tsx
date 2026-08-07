import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus,
  FileText, 
  AlertTriangle,
  Info,
  Users,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Paperclip
} from "lucide-react";
import type { JobNote, CreateJobNoteData } from "../types";

interface NotesCardProps {
  notes: JobNote[];
  dispatchId: string;
}

export function NotesCard({ notes, dispatchId }: NotesCardProps) {
  const { t } = useTranslation("notes");
  const { t: tCommon } = useTranslation("common");
  const { t: tJobDetail } = useTranslation("job-detail");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateJobNoteData>({
    dispatchId,
    content: "",
    category: "general",
  });

  const getCategoryColor = (category: JobNote["category"]) => {
    const colors = {
      general: "bg-primary/10 text-primary",
      issue: "bg-destructive/10 text-destructive",
      work_performed: "bg-success/10 text-success",
      customer_interaction: "bg-primary/10 text-primary",
      internal: "bg-muted text-muted-foreground"
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const getPriorityColor = (priority?: JobNote["priority"]) => {
    if (!priority) return "";
    const colors = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-warning/10 text-warning",
      high: "bg-destructive/10 text-destructive"
    };
    return colors[priority] || "bg-muted text-muted-foreground";
  };

  const getCategoryIcon = (category: JobNote["category"]) => {
    switch (category) {
      case "issue":
        return <AlertTriangle className="h-4 w-4" />;
      case "work_performed":
        return <FileText className="h-4 w-4" />;
      case "customer_interaction":
        return <Users className="h-4 w-4" />;
      case "internal":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;
    
    // Here you would save the note
    console.log("Creating note:", formData);
    setIsDialogOpen(false);
    // Reset form
    setFormData({
      dispatchId,
      content: "",
      category: "general",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t("title")}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("add_note")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("add_note")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category">{t("note_category")}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: JobNote["category"]) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{t("categories.general")}</SelectItem>
                      <SelectItem value="issue">{t("categories.issue")}</SelectItem>
                      <SelectItem value="work_performed">{t("categories.work_performed")}</SelectItem>
                      <SelectItem value="customer_interaction">{t("categories.customer_interaction")}</SelectItem>
                      <SelectItem value="internal">{t("categories.internal")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.category === "issue" && (
                  <div>
                    <Label htmlFor="priority">{t("priority")}</Label>
                    <Select
                      value={formData.priority || ""}
                      onValueChange={(value: JobNote["priority"]) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_priority")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">{tJobDetail("priorities.low")}</SelectItem>
                        <SelectItem value="medium">{tJobDetail("priorities.medium")}</SelectItem>
                        <SelectItem value="high">{tJobDetail("priorities.high")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="content">{t("note_content")}</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder={t("note_description_placeholder")}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={!formData.content.trim()}>
                    {t("save_note")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              {t("no_notes")}
            </p>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("add_note")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Badge className={getCategoryColor(note.category)}>
                      {getCategoryIcon(note.category)}
                      <span className="ml-1">{t(`categories.${note.category}`)}</span>
                    </Badge>
                    {note.priority && (
                      <Badge className={getPriorityColor(note.priority)}>
                        {tJobDetail(`priorities.${note.priority}`)}
                      </Badge>
                    )}
                    {note.resolved && (
                      <Badge className="bg-success/10 text-success">
                        {t("resolved")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                </div>

                {note.attachments && note.attachments.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                    <span>{note.attachments.length} {t("attachments_count")}</span>
                    <Button variant="link" size="sm" className="p-0 h-auto">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span>{t("created_by")}: {note.createdByName}</span>
                  </div>
                  <div>
                    {t("created_at")}: {format(note.createdAt, "dd/MM/yyyy HH:mm")}
                  </div>
                </div>

                {note.resolved && note.resolvedAt && (
                  <div className="text-sm text-success bg-success/5 p-2 rounded">
                    {t("resolved_on")} {format(note.resolvedAt, "dd/MM/yyyy HH:mm")}
                    {note.resolvedBy && ` by ${note.resolvedBy}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}