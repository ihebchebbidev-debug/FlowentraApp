import React, { useState } from 'react';
import { TableSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Plus, Edit2, Trash2, Loader2, Star } from 'lucide-react';
import { LookupItem, CreateLookupRequest, UpdateLookupRequest } from '@/services/lookupsApi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LookupTableProps {
  title?: string;
  items: LookupItem[];
  isLoading: boolean;
  onCreate: (data: CreateLookupRequest) => Promise<void>;
  onUpdate: (id: string, data: UpdateLookupRequest) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetDefault?: (id: string) => Promise<void>;
  showTypeFields?: {
    isCompleted?: boolean;
    defaultDuration?: boolean;
    isAvailable?: boolean;
    isPaid?: boolean;
    category?: boolean;
  };
}

export function LookupTable({ 
  title = "Items", 
  items, 
  isLoading, 
  onCreate, 
  onUpdate, 
  onDelete,
  onSetDefault,
  showTypeFields = {}
}: LookupTableProps) {
  const { t } = useTranslation('lookups');
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<CreateLookupRequest>({
    name: '',
    isActive: true,
    sortOrder: 0,
    color: '#3b82f6', // Default blue color
  });

  const resetForm = () => {
    setFormData({
      name: '',
      isActive: true,
      sortOrder: 0,
      color: '#3b82f6',
    });
  };

  const handleCreate = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      await onCreate(formData);
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      console.error('Create error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onUpdate(editingItem.id, formData);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEdit = (item: LookupItem) => {
    setFormData({
      name: item.name,
      isActive: item.isActive,
      sortOrder: item.sortOrder || 0,
      color: item.color || '#3b82f6',
      isCompleted: item.isCompleted,
      defaultDuration: item.defaultDuration,
      isAvailable: item.isAvailable,
      isPaid: item.isPaid,
      category: item.category,
    });
    setEditingItem(item);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!onSetDefault || isSettingDefault) return;
    setIsSettingDefault(id);
    try {
      await onSetDefault(id);
    } catch (error) {
      console.error('Set default error:', error);
    } finally {
      setIsSettingDefault(null);
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={4} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addItem')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createNew')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('enterName')}
                />
              </div>
              



              {showTypeFields.defaultDuration && (
                <div>
                  <Label htmlFor="defaultDuration">{t('defaultDuration')}</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    value={formData.defaultDuration || ''}
                    onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || undefined })}
                    placeholder={t('durationPlaceholder')}
                  />
                </div>
              )}

              {showTypeFields.category && (
                <div>
                  <Label htmlFor="category">{t('category')}</Label>
                  <Input
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder={t('enterCategory')}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">{t('active')}</Label>
              </div>

              {showTypeFields.isCompleted && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isCompleted"
                    checked={formData.isCompleted || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isCompleted: checked })}
                  />
                  <Label htmlFor="isCompleted">{t('completedStatus')}</Label>
                </div>
              )}

              {showTypeFields.isAvailable && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                  />
                  <Label htmlFor="isAvailable">{t('available')}</Label>
                </div>
              )}

              {showTypeFields.isPaid && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPaid"
                    checked={formData.isPaid || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                  />
                  <Label htmlFor="isPaid">{t('paidLeave')}</Label>
                </div>
              )}

              <div>
                <Label htmlFor="sortOrder">{t('sortOrder')}</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">{t('noItemsYet')}</h3>
              <p className="text-muted-foreground max-w-md">
                {t('noItemsDescription')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t('default')}</TableHead>
                <TableHead>{t('name')}</TableHead>
                
                
                
                {showTypeFields.isCompleted && <TableHead>{t('completed')}</TableHead>}
                {showTypeFields.defaultDuration && <TableHead>{t('duration')}</TableHead>}
                {showTypeFields.isPaid && <TableHead>{t('paid')}</TableHead>}
                {showTypeFields.category && <TableHead>{t('category')}</TableHead>}
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleSetDefault(item.id)}
                            disabled={isSettingDefault === item.id || !onSetDefault}
                          >
                            {isSettingDefault === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star 
                                className={`h-4 w-4 ${item.isDefault ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-400'}`}
                              />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {item.isDefault ? t('thisIsDefault') : t('setAsDefault')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  
                  
                  {showTypeFields.isCompleted && (
                    <TableCell>
                      {item.isCompleted !== undefined && (
                        <Badge variant={item.isCompleted ? "default" : "secondary"}>
                          {item.isCompleted ? t('completed') : t('inProgress')}
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {showTypeFields.defaultDuration && (
                    <TableCell>{item.defaultDuration ? `${item.defaultDuration}min` : '-'}</TableCell>
                  )}
                  {showTypeFields.isPaid && (
                    <TableCell>
                      <Badge variant={item.isPaid ? "default" : "outline"}>
                        {item.isPaid ? t('paid') : t('unpaid')}
                      </Badge>
                    </TableCell>
                  )}
                  {showTypeFields.category && <TableCell>{item.category}</TableCell>}
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? t('active') : t('inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editItem')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">{t('name')}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('enterName')}
              />
            </div>
            



            {showTypeFields.defaultDuration && (
              <div>
                <Label htmlFor="edit-defaultDuration">{t('defaultDuration')}</Label>
                <Input
                  id="edit-defaultDuration"
                  type="number"
                  value={formData.defaultDuration || ''}
                  onChange={(e) => setFormData({ ...formData, defaultDuration: parseInt(e.target.value) || undefined })}
                  placeholder={t('durationPlaceholder')}
                />
              </div>
            )}

            {showTypeFields.category && (
              <div>
                <Label htmlFor="edit-category">{t('category')}</Label>
                <Input
                  id="edit-category"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder={t('enterCategory')}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">{t('active')}</Label>
            </div>

            {showTypeFields.isCompleted && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isCompleted"
                  checked={formData.isCompleted || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isCompleted: checked })}
                />
                <Label htmlFor="edit-isCompleted">{t('completedStatus')}</Label>
              </div>
            )}

            {showTypeFields.isAvailable && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isAvailable"
                  checked={formData.isAvailable || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                />
                <Label htmlFor="edit-isAvailable">{t('available')}</Label>
              </div>
            )}

            {showTypeFields.isPaid && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isPaid"
                  checked={formData.isPaid || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                />
                <Label htmlFor="edit-isPaid">{t('paidLeave')}</Label>
              </div>
            )}

            <div>
              <Label htmlFor="edit-sortOrder">{t('sortOrder')}</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>

            <Button onClick={handleUpdate} className="w-full" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('update')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}