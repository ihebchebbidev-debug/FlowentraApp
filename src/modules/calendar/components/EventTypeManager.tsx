import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Plus, Trash2, Palette, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventType {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

interface EventTypeManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTypes: EventType[];
  onEventTypesChange: (eventTypes: EventType[]) => void;
}

const DEFAULT_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald  
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#a855f7", // Purple
];

export function EventTypeManager({ 
  open, 
  onOpenChange, 
  eventTypes, 
  onEventTypesChange 
}: EventTypeManagerProps) {
  const [newTypeName, setNewTypeName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);

  const addEventType = () => {
    if (!newTypeName.trim()) return;
    
    const newType: EventType = {
      id: Date.now().toString(),
      name: newTypeName.trim(),
      color: selectedColor,
      isDefault: false
    };
    
    onEventTypesChange([...eventTypes, newType]);
    setNewTypeName("");
    setSelectedColor(DEFAULT_COLORS[0]);
  };

  const removeEventType = (typeId: string) => {
    onEventTypesChange(eventTypes.filter(type => type.id !== typeId && !type.isDefault));
  };

  const updateEventTypeColor = (typeId: string, color: string) => {
    onEventTypesChange(
      eventTypes.map(type => 
        type.id === typeId ? { ...type, color } : type
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Manage Event Types
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Add New Event Type */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <h3 className="text-base font-semibold">Add New Event Type</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="typeName" className="text-sm">Event Type Name</Label>
                  <Input
                    id="typeName"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g., Team Meeting, Client Call..."
                    onKeyPress={(e) => e.key === 'Enter' && addEventType()}
                    className="mt-1"
                  />
                </div>
                <div className="sm:w-auto">
                  <Label className="text-sm">Color</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {DEFAULT_COLORS.slice(0, 8).map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all flex-shrink-0",
                          selectedColor === color 
                            ? "border-foreground scale-110" 
                            : "border-muted hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="sm:self-end">
                  <Button 
                    onClick={addEventType} 
                    disabled={!newTypeName.trim()}
                    className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Event Types */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Existing Event Types</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {eventTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div 
                        className="w-4 h-4 rounded-full border flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-sm truncate block text-foreground">{type.name}</span>
                        {type.isDefault && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Color Selection */}
                      <div className="hidden sm:flex gap-1">
                        {DEFAULT_COLORS.slice(0, 4).map((color) => (
                          <button
                            key={color}
                            onClick={() => updateEventTypeColor(type.id, color)}
                            className={cn(
                              "w-4 h-4 rounded-full border transition-all",
                              type.color === color 
                                ? "border-foreground scale-110" 
                                : "border-muted/50 hover:scale-105"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      {/* Mobile Color Dropdown */}
                      <div className="sm:hidden">
                        <Select 
                          value={type.color} 
                          onValueChange={(color) => updateEventTypeColor(type.id, color)}
                        >
                          <SelectTrigger className="w-12 h-8 p-1">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_COLORS.map((color) => (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-xs text-foreground">{color}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Delete Button */}
                      {!type.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEventType(type.id)}
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0 bg-background">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="bg-primary text-white hover:bg-primary/90 w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
