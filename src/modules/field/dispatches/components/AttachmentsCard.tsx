import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Upload, 
  Camera, 
  FileText, 
  Image, 
  File,
  Download,
  Eye,
  Trash2
} from "lucide-react";
import type { JobAttachment, CreateAttachmentData } from "../types";

interface AttachmentsCardProps {
  attachments: JobAttachment[];
  dispatchId: string;
}

export function AttachmentsCard({ attachments, dispatchId }: AttachmentsCardProps) {
  const { t } = useTranslation("attachments");
  const { t: tCommon } = useTranslation("common");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAttachmentData>({
    dispatchId,
    file: null as any,
    category: "photo",
    description: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getCategoryColor = (category: JobAttachment["category"]) => {
    const colors = {
      photo: "bg-primary/10 text-primary",
      document: "bg-success/10 text-success",
      diagnostic: "bg-secondary text-secondary-foreground",
      completion: "bg-warning/10 text-warning",
      other: "bg-muted text-muted-foreground"
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (fileType === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      setFormData({ ...formData, file: files[0] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;
    
    // Here you would upload the file and save the attachment
    console.log("Creating attachment:", formData);
    setIsDialogOpen(false);
    // Reset form
    setFormData({
      dispatchId,
      file: null as any,
      category: "photo",
      description: "",
    });
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {t("title")}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {t("take_photo")}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t("upload_files")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("upload_files")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>{t("category")}</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: JobAttachment["category"]) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">{t("categories.photo")}</SelectItem>
                        <SelectItem value="document">{t("categories.document")}</SelectItem>
                        <SelectItem value="diagnostic">{t("categories.diagnostic")}</SelectItem>
                        <SelectItem value="completion">{t("categories.completion")}</SelectItem>
                        <SelectItem value="other">{t("categories.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder={t("file_description_placeholder")}
                    />
                  </div>

                  <div>
                    <Label>File</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("drag_drop")}
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        {t("max_file_size")}<br />
                        {t("supported_formats")}
                      </p>
                      
                      {formData.file ? (
                        <div className="bg-muted rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 justify-center">
                            {getFileIcon(formData.file.type)}
                            <span className="text-sm font-medium">{formData.file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(formData.file.size / (1024 * 1024))})
                            </span>
                          </div>
                        </div>
                      ) : null}

                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1" disabled={!formData.file}>
                      {t("upload")}
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
        </div>
      </CardHeader>
      <CardContent>
        {/* Hidden camera input */}
        <Input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {attachments.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {t("no_attachments")}
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                {t("take_photo")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {t("upload_files")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(attachment.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.fileSize)}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getCategoryColor(attachment.category)} text-xs`}>
                    {t(`categories.${attachment.category}`)}
                  </Badge>
                </div>

                {attachment.description && (
                  <p className="text-sm text-muted-foreground">{attachment.description}</p>
                )}

                <div className="text-xs text-muted-foreground">
                  {t("uploaded_at")} {format(attachment.uploadedAt, "dd/MM/yyyy HH:mm")}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-2 flex-1">
                    <Eye className="h-4 w-4" />
                    {t("view")}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 flex-1">
                    <Download className="h-4 w-4" />
                    {t("download")}
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}