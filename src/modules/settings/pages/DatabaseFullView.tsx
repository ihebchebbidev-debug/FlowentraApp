import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  Table, 
  Key, 
  Link, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Search,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';

// Permission check wrapper component
function DatabaseFullViewWrapper() {
  const navigate = useNavigate();
  const { toast: showToast } = useToast();
  const { isMainAdmin, hasPermission, isLoading } = usePermissions();
  
  // Check if user has permission to view database
  const canViewDatabase = isMainAdmin || hasPermission('settings', 'read');

  useEffect(() => {
    if (isLoading) return;
    
    if (!canViewDatabase) {
      showToast({
        title: "Access Denied",
        description: "You don't have permission to view database schema.",
        variant: "destructive"
      });
      navigate('/dashboard/settings', { replace: true });
    }
  }, [canViewDatabase, isLoading, navigate, showToast]);

  if (isLoading || !canViewDatabase) {
    return null;
  }

  return <DatabaseFlowContent />;
}

// Define migration file structure
interface MigrationField {
  type: string;
  required?: boolean;
  foreignKey?: string;
  enum?: string[];
  default?: any;
  items?: string;
  precision?: number;
  scale?: number;
  unique?: boolean;
}

interface MigrationTable {
  name: string;
  primaryKey: string;
  fields: Record<string, MigrationField>;
  indexes?: string[];
}

interface MigrationFile {
  module: string;
  version: string;
  description: string;
  tables: MigrationTable[];
}

// Custom node component for tables
const TableNode = ({ data }: { data: any }) => {
  const { table, isHighlighted } = data;
  
  return (
    <div className={`
      bg-card border-2 rounded-lg shadow-lg min-w-64 max-w-80
      ${isHighlighted ? 'border-primary shadow-glow' : 'border-border'}
      transition-all duration-200
    `}>
      {/* Header */}
      <div className="bg-primary text-white p-3 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4" />
          <h3 className="font-semibold text-sm truncate">{table.name}</h3>
        </div>
        {table.module && (
          <Badge variant="secondary" className="mt-1 text-xs bg-white/20 text-white">
            {table.module}
          </Badge>
        )}
      </div>
      
      {/* Fields */}
      <div className="p-2 max-h-80 overflow-y-auto">
        {Object.entries(table.fields).map(([fieldName, field]: [string, any]) => (
          <div key={fieldName} className="flex items-center justify-between py-1.5 px-2 hover:bg-muted/50 rounded text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {fieldName === table.primaryKey && <Key className="h-3 w-3 text-amber-500 flex-shrink-0" />}
              {field.foreignKey && <Link className="h-3 w-3 text-blue-500 flex-shrink-0" />}
              <span className="font-medium truncate">{fieldName}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-muted-foreground">{field.type}</span>
              {field.required && <span className="text-red-500 text-[10px]">*</span>}
              {field.unique && <span className="text-purple-500 text-[10px]">U</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
};

// Load all migration data from current modules - updated with location data
const getMigrationData = (): MigrationFile[] => {
  const migrations: MigrationFile[] = [
    // Field Module - Updated with location tracking
    {
      module: "field",
      version: "001",
      description: "Field Service Management Tables - Updated with location tracking",
      tables: [
        {
          name: "FIELD.service_orders",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            orderNumber: { type: "string", required: true },
            title: { type: "string", required: true },
            description: { type: "text", required: false },
            salesOrderId: { type: "string", required: true, foreignKey: "CRM.sales.id" },
            offerId: { type: "string", required: true, foreignKey: "CRM.offers.id" },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            status: { type: "string", required: true, enum: ["open", "ready_for_planning", "planned", "partially_completed", "technically_completed", "invoiced", "closed"] },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            promisedDate: { type: "datetime", required: false },
            contractAmount: { type: "decimal", required: true },
            actualCost: { type: "decimal", required: false, default: 0 },
            profitMargin: { type: "decimal", required: false, default: 0 },
            serviceLocation: { type: "json", required: true },
            longitude: { type: "decimal", required: false, precision: 11, scale: 8 },
            latitude: { type: "decimal", required: false, precision: 10, scale: 8 },
            hasLocation: { type: "boolean", default: false },
            skills: { type: "array", items: "string" },
            notes: { type: "text", required: false },
            internalNotes: { type: "text", required: false },
            tags: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          }
        },
        {
          name: "FIELD.dispatches",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            dispatchNumber: { type: "string", required: true },
            jobId: { type: "string", required: true, foreignKey: "FIELD.jobs.id" },
            technicianId: { type: "string", required: true, foreignKey: "FIELD.technicians.id" },
            status: { type: "string", required: true, enum: ["planned", "started", "technically_completed", "reviewed", "closed"] },
            scheduledStartAt: { type: "datetime", required: true },
            scheduledEndAt: { type: "datetime", required: true },
            actualStartAt: { type: "datetime", required: false },
            actualEndAt: { type: "datetime", required: false },
            estimatedDuration: { type: "integer", required: true },
            actualDuration: { type: "integer", required: false },
            workNotes: { type: "text", required: false },
            materialsUsed: { type: "array", items: "json" },
            timeBooked: { type: "decimal", required: false },
            filesUploaded: { type: "array", items: "string" },
            longitude: { type: "decimal", required: false, precision: 11, scale: 8 },
            latitude: { type: "decimal", required: false, precision: 10, scale: 8 },
            hasLocation: { type: "boolean", default: false },
            location: { type: "json", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          }
        },
        {
          name: "FIELD.technician_locations",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            technicianId: { type: "string", required: true, foreignKey: "FIELD.technicians.id" },
            latitude: { type: "decimal", required: true, precision: 10, scale: 8 },
            longitude: { type: "decimal", required: true, precision: 11, scale: 8 },
            address: { type: "string", required: false },
            accuracy: { type: "decimal", required: false },
            speed: { type: "decimal", required: false },
            heading: { type: "decimal", required: false },
            timestamp: { type: "datetime", required: true },
            batteryLevel: { type: "integer", required: false },
            isOnline: { type: "boolean", default: true }
          }
        }
      ]
    },
    // Sales Module - Updated with location data
    {
      module: "sales",
      version: "001", 
      description: "CRM Sales Management Tables - Updated with location tracking",
      tables: [
        {
          name: "CRM.offers",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            contactName: { type: "string", required: true },
            contactCompany: { type: "string", required: false },
            contactLocation: { type: "json", required: false },
            amount: { type: "decimal", required: true },
            currency: { type: "string", required: true, foreignKey: "LU.currencies.id" },
            status: { type: "string", required: true, enum: ["draft", "sent", "accepted", "declined", "expired"] },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            description: { type: "text", required: false },
            notes: { type: "text", required: false },
            validUntil: { type: "datetime", required: false },
            shareLink: { type: "string", required: false },
            assignedTo: { type: "string", required: false, foreignKey: "SYS.users.id" },
            convertedToSaleId: { type: "string", required: false, foreignKey: "CRM.sales.id" },
            isRecurring: { type: "boolean", default: false },
            recurringInterval: { type: "string", required: false },
            tags: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          }
        },
        {
          name: "CRM.sales",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            offerId: { type: "string", required: false, foreignKey: "CRM.offers.id" },
            contactName: { type: "string", required: true },
            contactCompany: { type: "string", required: false },
            contactLocation: { type: "json", required: false },
            amount: { type: "decimal", required: true },
            currency: { type: "string", required: true, foreignKey: "LU.currencies.id" },
            status: { type: "string", required: true, enum: ["pending", "confirmed", "invoiced", "paid", "cancelled"] },
            stage: { type: "string", required: true, enum: ["prospecting", "qualification", "proposal", "negotiation", "closed"] },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            description: { type: "text", required: false },
            notes: { type: "text", required: false },
            estimatedCloseDate: { type: "datetime", required: false },
            actualCloseDate: { type: "datetime", required: false },
            probability: { type: "integer", default: 0 },
            assignedTo: { type: "string", required: false, foreignKey: "SYS.users.id" },
            source: { type: "string", required: false },
            materialsFulfillment: { type: "string", required: false },
            serviceOrdersStatus: { type: "string", required: false },
            lostReason: { type: "text", required: false },
            tags: { type: "array", items: "string" },
            lastActivity: { type: "datetime", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          }
        }
      ]
    },
    // System module
    {
      module: "system",
      version: "001",
      description: "System Configuration and User Management Tables",
      tables: [
        {
          name: "SYS.users",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            firstName: { type: "string", required: false },
            lastName: { type: "string", required: false },
            email: { type: "string", required: true, unique: true },
            phone: { type: "string", required: false },
            avatar: { type: "string", required: false },
            roleId: { type: "string", required: true, foreignKey: "SYS.roles.id" },
            department: { type: "string", required: false },
            position: { type: "string", required: false },
            status: { type: "string", required: true, enum: ["active", "inactive", "suspended"] },
            lastLogin: { type: "datetime", required: false },
            preferences: { type: "json", required: false },
            timezone: { type: "string", required: false },
            language: { type: "string", default: "en" },
            isEmailVerified: { type: "boolean", default: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["email", "roleId", "department", "status"]
        },
        {
          name: "SYS.roles",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true, unique: true },
            description: { type: "text", required: false },
            permissions: { type: "json", required: true },
            level: { type: "integer", required: true },
            isSystem: { type: "boolean", default: false },
            isActive: { type: "boolean", default: true },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["name", "level"]
        },
        {
          name: "SYS.system_logs",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            timestamp: { type: "datetime", required: true },
            level: { type: "string", required: true, foreignKey: "LU.log_levels.id" },
            message: { type: "text", required: true },
            module: { type: "string", required: true },
            action: { type: "string", required: false },
            userId: { type: "string", required: false, foreignKey: "SYS.users.id" },
            userEmail: { type: "string", required: false },
            ipAddress: { type: "string", required: false },
            userAgent: { type: "string", required: false },
            details: { type: "json", required: false },
            stackTrace: { type: "text", required: false }
          },
          indexes: ["timestamp", "level", "module", "userId"]
        },
        {
          name: "SYS.system_settings",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            key: { type: "string", required: true, unique: true },
            value: { type: "json", required: true },
            category: { type: "string", required: true },
            description: { type: "text", required: false },
            dataType: { type: "string", required: true, enum: ["string", "number", "boolean", "json", "array"] },
            isPublic: { type: "boolean", default: false },
            isSystem: { type: "boolean", default: false },
            updatedAt: { type: "datetime", required: true },
            updatedBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["key", "category"]
        },
        {
          name: "SYS.audit_trail",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            tableName: { type: "string", required: true },
            recordId: { type: "string", required: true },
            action: { type: "string", required: true, enum: ["insert", "update", "delete"] },
            oldValues: { type: "json", required: false },
            newValues: { type: "json", required: false },
            changedFields: { type: "array", items: "string" },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            userEmail: { type: "string", required: true },
            timestamp: { type: "datetime", required: true },
            ipAddress: { type: "string", required: false },
            userAgent: { type: "string", required: false }
          },
          indexes: ["tableName", "recordId", "action", "userId", "timestamp"]
        },
        {
          name: "SYS.notifications",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            title: { type: "string", required: true },
            message: { type: "text", required: true },
            type: { type: "string", required: true, enum: ["info", "success", "warning", "error"] },
            category: { type: "string", required: false },
            isRead: { type: "boolean", default: false },
            readAt: { type: "datetime", required: false },
            relatedType: { type: "string", required: false },
            relatedId: { type: "string", required: false },
            actionUrl: { type: "string", required: false },
            createdAt: { type: "datetime", required: true },
            expiresAt: { type: "datetime", required: false }
          },
          indexes: ["userId", "isRead", "createdAt", "type"]
        }
      ]
    },
    // Contacts module
    {
      module: "contacts",
      version: "001",
      description: "CRM Contact Management Tables",
      tables: [
        {
          name: "CRM.contacts",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            email: { type: "string", required: true },
            phone: { type: "string", required: false },
            company: { type: "string", required: false },
            position: { type: "string", required: false },
            status: { type: "string", required: true, enum: ["active", "inactive", "prospect", "customer"] },
            type: { type: "string", required: true, enum: ["individual", "company"] },
            tags: { type: "array", items: "string" },
            address: { type: "string", required: false },
            lastContact: { type: "datetime", required: false },
            notes: { type: "text", required: false },
            avatar: { type: "string", required: false },
            favorite: { type: "boolean", default: false },
            roleId: { type: "string", required: false, foreignKey: "SYS.roles.id" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["email", "status", "type", "company"]
        },
        {
          name: "CRM.contact_notes",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            content: { type: "text", required: true },
            createdAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          }
        },
        {
          name: "CRM.contact_offers",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            title: { type: "string", required: true },
            amount: { type: "decimal", required: true },
            status: { type: "string", required: true, enum: ["draft", "sent", "accepted", "rejected"] },
            validUntil: { type: "datetime", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          }
        },
        {
          name: "CRM.contact_projects",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            name: { type: "string", required: true },
            description: { type: "text", required: false },
            status: { type: "string", required: true, enum: ["active", "completed", "on-hold", "cancelled"] },
            type: { type: "string", required: true, enum: ["service", "sales", "internal", "custom"] },
            startDate: { type: "datetime", required: false },
            endDate: { type: "datetime", required: false },
            ownerId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            ownerName: { type: "string", required: true },
            teamMembers: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            completedAt: { type: "datetime", required: false }
          }
        },
        {
          name: "CRM.contact_project_columns",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            projectId: { type: "string", required: true, foreignKey: "CRM.contact_projects.id" },
            title: { type: "string", required: true },
            color: { type: "string", required: true },
            position: { type: "integer", required: true },
            isDefault: { type: "boolean", default: false },
            createdAt: { type: "datetime", required: true }
          }
        },
        {
          name: "CRM.contact_tasks",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
            description: { type: "text", required: false },
            status: { type: "string", required: true },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            assigneeId: { type: "string", required: false, foreignKey: "SYS.users.id" },
            assigneeName: { type: "string", required: false },
            projectId: { type: "string", required: true, foreignKey: "CRM.contact_projects.id" },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            parentTaskId: { type: "string", required: false, foreignKey: "CRM.contact_tasks.id" },
            dueDate: { type: "datetime", required: false },
            tags: { type: "array", items: "string" },
            estimatedHours: { type: "decimal", required: false },
            actualHours: { type: "decimal", required: false },
            columnId: { type: "string", required: true, foreignKey: "CRM.contact_project_columns.id" },
            position: { type: "integer", required: true },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            completedAt: { type: "datetime", required: false }
          }
        },
        {
          name: "CRM.contact_tags",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: true },
            createdAt: { type: "datetime", required: true }
          }
        }
      ]
    },
    // Sales module
    {
      module: "sales",
      version: "001",
      description: "CRM Sales Management Tables - Updated for installation allocation and enhanced tracking",
      tables: [
        {
          name: "CRM.offers",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            contactName: { type: "string", required: true },
            contactCompany: { type: "string", required: false },
            amount: { type: "decimal", required: true },
            currency: { type: "string", required: true, foreignKey: "LU.currencies.id" },
            status: { type: "string", required: true, enum: ["draft", "sent", "accepted", "declined", "expired"] },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            description: { type: "text", required: false },
            notes: { type: "text", required: false },
            validUntil: { type: "datetime", required: false },
            shareLink: { type: "string", required: false },
            assignedTo: { type: "string", required: false, foreignKey: "SYS.users.id" },
            convertedToSaleId: { type: "string", required: false, foreignKey: "CRM.sales.id" },
            isRecurring: { type: "boolean", default: false },
            recurringInterval: { type: "string", required: false, enum: ["weekly", "monthly", "quarterly", "annually"] },
            tags: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["contactId", "status", "assignedTo", "createdAt"]
        },
        {
          name: "CRM.offer_items",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            offerId: { type: "string", required: true, foreignKey: "CRM.offers.id" },
            type: { type: "string", required: true, enum: ["service", "article"] },
            itemId: { type: "string", required: true },
            itemCode: { type: "string", required: false },
            itemName: { type: "string", required: true },
            description: { type: "text", required: false },
            quantity: { type: "decimal", required: true },
            unitPrice: { type: "decimal", required: true },
            totalPrice: { type: "decimal", required: true },
            discount: { type: "decimal", default: 0 },
            position: { type: "integer", required: true },
            installationId: { type: "string", required: false, foreignKey: "FIELD.installations.id" },
            installationName: { type: "string", required: false },
            requiresServiceOrder: { type: "boolean", default: false }
          },
          indexes: ["offerId", "type", "installationId"]
        },
        {
          name: "CRM.offer_notes",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            offerId: { type: "string", required: true, foreignKey: "CRM.offers.id" },
            note: { type: "text", required: true },
            isInternal: { type: "boolean", default: false },
            createdAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["offerId", "createdAt"]
        },
        {
          name: "CRM.offer_attachments",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            offerId: { type: "string", required: true, foreignKey: "CRM.offers.id" },
            fileName: { type: "string", required: true },
            originalName: { type: "string", required: true },
            fileSize: { type: "integer", required: true },
            mimeType: { type: "string", required: true },
            fileUrl: { type: "string", required: true },
            description: { type: "text", required: false },
            uploadedAt: { type: "datetime", required: true },
            uploadedBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["offerId", "uploadedAt"]
        },
        {
          name: "CRM.offer_activity_logs",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            offerId: { type: "string", required: true, foreignKey: "CRM.offers.id" },
            action: { type: "string", required: true, enum: ["created", "updated", "sent", "viewed", "accepted", "declined", "expired", "converted_to_sale"] },
            description: { type: "text", required: false },
            metadata: { type: "json", required: false },
            performedAt: { type: "datetime", required: true },
            performedBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["offerId", "action", "performedAt"]
        },
        {
          name: "CRM.sales",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            offerId: { type: "string", required: false, foreignKey: "CRM.offers.id" },
            contactName: { type: "string", required: true },
            contactCompany: { type: "string", required: false },
            amount: { type: "decimal", required: true },
            currency: { type: "string", required: true, foreignKey: "LU.currencies.id" },
            status: { type: "string", required: true, enum: ["pending", "confirmed", "invoiced", "paid", "cancelled"] },
            stage: { type: "string", required: true, enum: ["prospecting", "qualification", "proposal", "negotiation", "closed"] },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            description: { type: "text", required: false },
            notes: { type: "text", required: false },
            estimatedCloseDate: { type: "datetime", required: false },
            actualCloseDate: { type: "datetime", required: false },
            probability: { type: "integer", default: 0 },
            assignedTo: { type: "string", required: false, foreignKey: "SYS.users.id" },
            source: { type: "string", required: false },
            materialsFulfillment: { type: "string", required: false, enum: ["pending", "partial", "completed", "cancelled"] },
            serviceOrdersStatus: { type: "string", required: false, enum: ["pending", "in_progress", "completed", "cancelled"] },
            lostReason: { type: "text", required: false },
            tags: { type: "array", items: "string" },
            lastActivity: { type: "datetime", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["contactId", "status", "stage", "assignedTo", "createdAt"]
        },
        {
          name: "CRM.sale_items",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            saleId: { type: "string", required: true, foreignKey: "CRM.sales.id" },
            type: { type: "string", required: true, enum: ["service", "article"] },
            itemId: { type: "string", required: true },
            itemCode: { type: "string", required: false },
            itemName: { type: "string", required: true },
            description: { type: "text", required: false },
            quantity: { type: "decimal", required: true },
            unitPrice: { type: "decimal", required: true },
            totalPrice: { type: "decimal", required: true },
            discount: { type: "decimal", default: 0 },
            position: { type: "integer", required: true },
            installationId: { type: "string", required: false, foreignKey: "FIELD.installations.id" },
            installationName: { type: "string", required: false },
            requiresServiceOrder: { type: "boolean", default: false },
            serviceOrderGenerated: { type: "boolean", default: false },
            serviceOrderId: { type: "string", required: false, foreignKey: "FIELD.service_orders.id" },
            fulfillmentStatus: { type: "string", required: false, enum: ["pending", "delivered", "cancelled"] }
          },
          indexes: ["saleId", "type", "installationId", "serviceOrderId"]
        },
        {
          name: "CRM.sale_notes",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            saleId: { type: "string", required: true, foreignKey: "CRM.sales.id" },
            note: { type: "text", required: true },
            isInternal: { type: "boolean", default: false },
            createdAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["saleId", "createdAt"]
        },
        {
          name: "CRM.sale_attachments",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            saleId: { type: "string", required: true, foreignKey: "CRM.sales.id" },
            fileName: { type: "string", required: true },
            originalName: { type: "string", required: true },
            fileSize: { type: "integer", required: true },
            mimeType: { type: "string", required: true },
            fileUrl: { type: "string", required: true },
            description: { type: "text", required: false },
            uploadedAt: { type: "datetime", required: true },
            uploadedBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["saleId", "uploadedAt"]
        },
        {
          name: "CRM.sale_activity_logs",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            saleId: { type: "string", required: true, foreignKey: "CRM.sales.id" },
            action: { type: "string", required: true, enum: ["created", "updated", "confirmed", "invoiced", "paid", "cancelled", "service_order_generated", "materials_shipped", "materials_delivered"] },
            description: { type: "text", required: false },
            metadata: { type: "json", required: false },
            performedAt: { type: "datetime", required: true },
            performedBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["saleId", "action", "performedAt"]
        }
      ]
    },

    // Articles module
    {
      module: "articles",
      version: "001",
      description: "CRM Article and Service Management Tables",
      tables: [
        {
          name: "CRM.articles",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            sku: { type: "string", required: true, unique: true },
            description: { type: "text", required: false },
            categoryId: { type: "string", required: true, foreignKey: "LU.article_categories.id" },
            stock: { type: "integer", required: true, default: 0 },
            minStock: { type: "integer", required: false },
            maxStock: { type: "integer", required: false },
            unit: { type: "string", required: true },
            unitPrice: { type: "decimal", required: true },
            currency: { type: "string", required: true, foreignKey: "LU.currencies.id" },
            statusId: { type: "string", required: true, foreignKey: "LU.article_statuses.id" },
            location: { type: "string", required: false },
            images: { type: "array", items: "string" },
            tags: { type: "array", items: "string" },
            weight: { type: "decimal", required: false },
            dimensions: { type: "json", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["sku", "categoryId", "statusId", "name"]
        },
        {
          name: "CRM.services",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            serviceCode: { type: "string", required: true, unique: true },
            description: { type: "text", required: false },
            categoryId: { type: "string", required: true, foreignKey: "LU.service_categories.id" },
            unitPrice: { type: "decimal", required: true },
            currency: { type: "string", required: true, foreignKey: "LU.currencies.id" },
            estimatedDuration: { type: "integer", required: false },
            requiredSkills: { type: "array", items: "string" },
            statusId: { type: "string", required: true, foreignKey: "LU.article_statuses.id" },
            tags: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["serviceCode", "categoryId", "statusId"]
        }
      ]
    },

    // Calendar module
    {
      module: "calendar",
      version: "001",
      description: "CRM Calendar and Event Management Tables",
      tables: [
        {
          name: "CRM.calendar_events",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
            description: { type: "text", required: false },
            start: { type: "datetime", required: true },
            end: { type: "datetime", required: true },
            allDay: { type: "boolean", default: false },
            type: { type: "string", required: true, foreignKey: "LU.event_types.id" },
            status: { type: "string", required: true, enum: ["scheduled", "confirmed", "cancelled", "completed"] },
            location: { type: "string", required: false },
            relatedType: { type: "string", required: false, enum: ["contact", "sale", "offer", "project", "service_order"] },
            relatedId: { type: "string", required: false },
            contactId: { type: "string", required: false, foreignKey: "CRM.contacts.id" },
            attendees: { type: "array", items: "string" },
            reminders: { type: "array", items: "json" },
            recurring: { type: "json", required: false },
            color: { type: "string", required: false },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            isPrivate: { type: "boolean", default: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["start", "end", "type", "status", "contactId", "relatedType", "relatedId"]
        }
      ]
    },

    // Projects module
    {
      module: "projects",
      version: "001",
      description: "CRM Project Management Tables",
      tables: [
        {
          name: "CRM.projects",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "text", required: false },
            contactId: { type: "string", required: false, foreignKey: "CRM.contacts.id" },
            ownerId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            ownerName: { type: "string", required: true },
            teamMembers: { type: "array", items: "string" },
            budget: { type: "decimal", required: false },
            currency: { type: "string", required: false, foreignKey: "LU.currencies.id" },
            status: { type: "string", required: true, foreignKey: "LU.project_statuses.id" },
            type: { type: "string", required: true, foreignKey: "LU.project_types.id" },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            progress: { type: "integer", default: 0 },
            startDate: { type: "datetime", required: false },
            endDate: { type: "datetime", required: false },
            actualStartDate: { type: "datetime", required: false },
            actualEndDate: { type: "datetime", required: false },
            tags: { type: "array", items: "string" },
            isArchived: { type: "boolean", default: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["contactId", "ownerId", "status", "type", "priority"]
        },
        {
          name: "CRM.project_columns",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            projectId: { type: "string", required: true, foreignKey: "CRM.projects.id" },
            title: { type: "string", required: true },
            color: { type: "string", required: true },
            position: { type: "integer", required: true },
            isDefault: { type: "boolean", default: false },
            limit: { type: "integer", required: false },
            createdAt: { type: "datetime", required: true }
          }
        },
        {
          name: "CRM.project_tasks",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            title: { type: "string", required: true },
            description: { type: "text", required: false },
            projectId: { type: "string", required: true, foreignKey: "CRM.projects.id" },
            contactId: { type: "string", required: false, foreignKey: "CRM.contacts.id" },
            assigneeId: { type: "string", required: false, foreignKey: "SYS.users.id" },
            assigneeName: { type: "string", required: false },
            status: { type: "string", required: true, foreignKey: "LU.task_statuses.id" },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            columnId: { type: "string", required: true, foreignKey: "CRM.project_columns.id" },
            position: { type: "integer", required: true },
            parentTaskId: { type: "string", required: false, foreignKey: "CRM.project_tasks.id" },
            dueDate: { type: "datetime", required: false },
            startDate: { type: "datetime", required: false },
            estimatedHours: { type: "decimal", required: false },
            actualHours: { type: "decimal", required: false },
            tags: { type: "array", items: "string" },
            attachments: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            completedAt: { type: "datetime", required: false },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["projectId", "assigneeId", "status", "priority", "dueDate"]
        }
      ]
    },

    // Documents module
    {
      module: "documents",
      version: "001",
      description: "Document Management Tables",
      tables: [
        {
          name: "CRM.documents",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            fileName: { type: "string", required: true },
            originalName: { type: "string", required: true },
            fileType: { type: "string", required: true },
            fileSize: { type: "integer", required: true },
            filePath: { type: "string", required: true },
            mimeType: { type: "string", required: true },
            moduleType: { type: "string", required: true, enum: ["contacts", "sales", "offers", "services", "projects", "field"] },
            moduleId: { type: "string", required: true },
            moduleName: { type: "string", required: false },
            category: { type: "string", required: true, enum: ["crm", "field"] },
            description: { type: "text", required: false },
            tags: { type: "array", items: "string" },
            isPublic: { type: "boolean", default: false },
            uploadedBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            uploadedByName: { type: "string", required: true },
            uploadedAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            version: { type: "integer", default: 1 },
            checksum: { type: "string", required: false }
          },
          indexes: ["moduleType", "moduleId", "category", "uploadedBy", "uploadedAt"]
        },
        {
          name: "CRM.document_comments",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            documentId: { type: "string", required: true, foreignKey: "CRM.documents.id" },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            userName: { type: "string", required: true },
            comment: { type: "text", required: true },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: false }
          }
        },
        {
          name: "CRM.document_share_links",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            documentId: { type: "string", required: true, foreignKey: "CRM.documents.id" },
            linkId: { type: "string", required: true, unique: true },
            type: { type: "string", required: true, enum: ["internal", "external"] },
            accessLevel: { type: "string", required: true, enum: ["view", "download"] },
            expiresAt: { type: "datetime", required: false },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            createdByName: { type: "string", required: true },
            createdAt: { type: "datetime", required: true },
            isActive: { type: "boolean", default: true },
            accessCount: { type: "integer", default: 0 },
            maxAccess: { type: "integer", required: false },
            password: { type: "string", required: false }
          }
        }
      ]
    },

    // Workflow module
    {
      module: "workflow",
      version: "001",
      description: "Workflow Management Tables",
      tables: [
        {
          name: "CRM.workflows",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "text", required: false },
            category: { type: "string", required: true },
            status: { type: "string", required: true, enum: ["draft", "active", "inactive", "archived"] },
            trigger: { type: "json", required: true },
            nodes: { type: "json", required: true },
            edges: { type: "json", required: true },
            variables: { type: "json", required: false },
            tags: { type: "array", items: "string" },
            isPublic: { type: "boolean", default: false },
            version: { type: "string", required: true, default: "1.0.0" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["category", "status", "createdBy"]
        },
        {
          name: "CRM.workflow_executions",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            workflowId: { type: "string", required: true, foreignKey: "CRM.workflows.id" },
            status: { type: "string", required: true, enum: ["pending", "running", "completed", "failed", "cancelled"] },
            startedAt: { type: "datetime", required: true },
            completedAt: { type: "datetime", required: false },
            currentNodeId: { type: "string", required: false },
            variables: { type: "json", required: true },
            errors: { type: "json", required: false },
            logs: { type: "json", required: false },
            triggerData: { type: "json", required: false },
            result: { type: "json", required: false }
          },
          indexes: ["workflowId", "status", "startedAt"]
        },
        {
          name: "CRM.workflow_templates",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "text", required: true },
            category: { type: "string", required: true },
            tags: { type: "array", items: "string" },
            thumbnail: { type: "string", required: false },
            nodes: { type: "json", required: true },
            edges: { type: "json", required: true },
            variables: { type: "json", required: true },
            isPublic: { type: "boolean", required: true },
            version: { type: "string", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            downloadCount: { type: "integer", default: 0 },
            rating: { type: "decimal", default: 0 }
          },
          indexes: ["category", "isPublic", "createdBy"]
        }
      ]
    },

    // Dispatcher module
    {
      module: "dispatcher",
      version: "001",
      description: "Field Service Dispatcher Management Tables",
      tables: [
        {
          name: "FIELD.technician_schedule",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            technicianId: { type: "string", required: true, foreignKey: "FIELD.technicians.id" },
            date: { type: "date", required: true },
            startTime: { type: "time", required: true },
            endTime: { type: "time", required: true },
            type: { type: "string", required: true, enum: ["work", "break", "lunch", "meeting", "travel", "unavailable"] },
            jobId: { type: "string", required: false, foreignKey: "FIELD.jobs.id" },
            title: { type: "string", required: false },
            description: { type: "text", required: false },
            location: { type: "json", required: false },
            isRecurring: { type: "boolean", default: false },
            recurringPattern: { type: "json", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          },
          indexes: ["technicianId", "date", "startTime", "type"]
        },
        {
          name: "FIELD.technician_locations",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            technicianId: { type: "string", required: true, foreignKey: "FIELD.technicians.id" },
            latitude: { type: "decimal", required: true, precision: 10, scale: 8 },
            longitude: { type: "decimal", required: true, precision: 11, scale: 8 },
            address: { type: "string", required: false },
            accuracy: { type: "decimal", required: false },
            speed: { type: "decimal", required: false },
            heading: { type: "decimal", required: false },
            timestamp: { type: "datetime", required: true },
            batteryLevel: { type: "integer", required: false },
            isOnline: { type: "boolean", default: true }
          },
          indexes: ["technicianId", "timestamp", "latitude", "longitude"]
        }
      ]
    },

    // Lookups module
    {
      module: "lookups",
      version: "001",
      description: "Lookup Tables for System Configuration",
      tables: [
        {
          name: "LU.article_categories",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "text", required: false },
            color: { type: "string", required: false },
            isActive: { type: "boolean", default: true },
            sortOrder: { type: "integer", default: 0 }
          }
        },
        {
          name: "LU.article_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isActive: { type: "boolean", default: true },
            sortOrder: { type: "integer", default: 0 }
          }
        },
        {
          name: "LU.service_categories",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "text", required: false },
            color: { type: "string", required: true },
            isActive: { type: "boolean", default: true },
            sortOrder: { type: "integer", default: 0 }
          }
        },
        {
          name: "LU.currencies",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            symbol: { type: "string", required: true },
            code: { type: "string", required: true, unique: true },
            rate: { type: "decimal", default: 1.0 },
            isDefault: { type: "boolean", default: false },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.countries",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            code: { type: "string", required: true, unique: true },
            phonePrefix: { type: "string", required: false },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.priorities",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: true },
            level: { type: "integer", required: true },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.event_types",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            defaultDuration: { type: "integer", required: false },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.task_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: true },
            isCompleted: { type: "boolean", default: false },
            sortOrder: { type: "integer", default: 0 },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.project_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isCompleted: { type: "boolean", default: false },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.project_types",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "text", required: false },
            color: { type: "string", required: false },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.offer_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isCompleted: { type: "boolean", default: false },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.technician_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: true },
            isAvailable: { type: "boolean", default: true },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.leave_types",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isPaid: { type: "boolean", default: true },
            maxDays: { type: "integer", required: false },
            isActive: { type: "boolean", default: true }
          }
        },
        {
          name: "LU.skills",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            category: { type: "string", required: true },
            level: { type: "string", required: true, enum: ["beginner", "intermediate", "advanced", "expert"] },
            description: { type: "text", required: false },
            isActive: { type: "boolean", default: true }
          }
        }
      ]
    },

    // Field module (updated)
    {
      module: "field",
      version: "001",
      description: "Field Service Management Tables - Updated for proper business flow",
      tables: [
        {
          name: "FIELD.service_orders",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            orderNumber: { type: "string", required: true, unique: true },
            title: { type: "string", required: true },
            description: { type: "text", required: false },
            salesOrderId: { type: "string", required: true, foreignKey: "CRM.sales_orders.id" },
            offerId: { type: "string", required: true, foreignKey: "CRM.offers.id" },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            status: { type: "string", required: true, enum: ["open", "ready_for_planning", "planned", "partially_completed", "technically_completed", "invoiced", "closed"] },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            promisedDate: { type: "datetime", required: false },
            contractAmount: { type: "decimal", required: true },
            actualCost: { type: "decimal", required: false, default: 0 },
            profitMargin: { type: "decimal", required: false, default: 0 },
            serviceLocation: { type: "json", required: true },
            skills: { type: "array", items: "string" },
            notes: { type: "text", required: false },
            internalNotes: { type: "text", required: false },
            tags: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["orderNumber", "status", "priority", "contactId", "salesOrderId"]
        },
        {
          name: "FIELD.jobs",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            jobNumber: { type: "string", required: true, unique: true },
            serviceOrderId: { type: "string", required: true, foreignKey: "FIELD.service_orders.id" },
            installationId: { type: "string", required: true, foreignKey: "FIELD.installations.id" },
            title: { type: "string", required: true },
            description: { type: "text", required: true },
            status: { type: "string", required: true, enum: ["pending", "ready", "assigned", "in_progress", "completed", "cancelled"] },
            priority: { type: "string", required: true, enum: ["low", "medium", "high", "urgent"] },
            workType: { type: "string", required: true, enum: ["maintenance", "repair", "installation", "inspection", "upgrade"] },
            workLocation: { type: "string", required: true },
            requiredSkills: { type: "array", items: "string" },
            estimatedDuration: { type: "integer", required: true },
            estimatedCost: { type: "decimal", required: true },
            assignedTechnicians: { type: "array", items: "string" },
            scheduledDate: { type: "datetime", required: false },
            scheduledStartTime: { type: "string", required: false },
            scheduledEndTime: { type: "string", required: false },
            completionPercentage: { type: "integer", required: true, default: 0 },
            actualStartTime: { type: "datetime", required: false },
            actualEndTime: { type: "datetime", required: false },
            actualDuration: { type: "integer", required: false },
            actualCost: { type: "decimal", required: false },
            specialInstructions: { type: "text", required: false },
            notes: { type: "text", required: false },
            internalNotes: { type: "text", required: false },
            issues: { type: "array", items: "json" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          },
          indexes: ["jobNumber", "serviceOrderId", "installationId", "status", "priority", "workType"]
        },
        {
          name: "FIELD.job_articles",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            jobId: { type: "string", required: true, foreignKey: "FIELD.jobs.id" },
            articleId: { type: "string", required: true, foreignKey: "CRM.articles.id" },
            quantity: { type: "decimal", required: true, default: 1 },
            unitPrice: { type: "decimal", required: false },
            totalPrice: { type: "decimal", required: false },
            isRequired: { type: "boolean", required: true, default: true },
            notes: { type: "text", required: false },
            createdAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["jobId", "articleId"]
        },
        {
          name: "FIELD.job_issues",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            jobId: { type: "string", required: true, foreignKey: "FIELD.jobs.id" },
            title: { type: "string", required: true },
            description: { type: "text", required: true },
            severity: { type: "string", required: true, enum: ["low", "medium", "high", "critical"] },
            status: { type: "string", required: true, enum: ["open", "in_progress", "resolved", "closed"] },
            reportedBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            reportedAt: { type: "datetime", required: true },
            resolvedBy: { type: "string", required: false, foreignKey: "SYS.users.id" },
            resolvedAt: { type: "datetime", required: false },
            resolution: { type: "text", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          },
          indexes: ["jobId", "status", "severity", "reportedBy"]
        },
        {
          name: "FIELD.dispatches",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            dispatchNumber: { type: "string", required: true, unique: true },
            jobId: { type: "string", required: true, foreignKey: "FIELD.jobs.id" },
            technicianId: { type: "string", required: true, foreignKey: "FIELD.technicians.id" },
            status: { type: "string", required: true, enum: ["planned", "started", "technically_completed", "reviewed", "closed"] },
            scheduledStartAt: { type: "datetime", required: true },
            scheduledEndAt: { type: "datetime", required: true },
            actualStartAt: { type: "datetime", required: false },
            actualEndAt: { type: "datetime", required: false },
            estimatedDuration: { type: "integer", required: true },
            actualDuration: { type: "integer", required: false },
            workNotes: { type: "text", required: false },
            materialsUsed: { type: "array", items: "json" },
            timeBooked: { type: "decimal", required: false },
            filesUploaded: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["dispatchNumber", "jobId", "technicianId", "status", "scheduledStartAt"]
        },
        {
          name: "FIELD.technicians",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            firstName: { type: "string", required: true },
            lastName: { type: "string", required: true },
            email: { type: "string", required: true, unique: true },
            phone: { type: "string", required: true },
            position: { type: "string", required: false },
            skills: { type: "array", items: "string" },
            hourlyRate: { type: "decimal", required: false },
            status: { type: "string", required: true, enum: ["available", "busy", "offline", "on_leave", "not_working", "over_capacity"] },
            location: { type: "json", required: false },
            avatar: { type: "string", required: false },
            workingHours: { type: "json", required: true },
            roleId: { type: "string", required: false, foreignKey: "SYS.roles.id" },
            employeeId: { type: "string", required: false },
            department: { type: "string", required: false },
            certifications: { type: "array", items: "string" },
            emergencyContact: { type: "json", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          },
          indexes: ["email", "status", "skills"]
        },
        {
          name: "FIELD.installations",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            installationNumber: { type: "string", required: true, unique: true },
            name: { type: "string", required: true },
            model: { type: "string", required: true },
            description: { type: "text", required: true },
            location: { type: "string", required: true },
            manufacturer: { type: "string", required: true },
            hasWarranty: { type: "boolean", required: true },
            warrantyFrom: { type: "datetime", required: false },
            warrantyTo: { type: "datetime", required: false },
            type: { type: "string", required: true, enum: ["internal", "external"] },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          },
          indexes: ["installationNumber", "manufacturer", "type", "hasWarranty", "contactId"]
        }
      ]
    }
  ];

  return migrations;
};

function DatabaseFlowContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const onConnect = useCallback((params: Connection | Edge) => 
    setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Generate nodes and edges from migration data
  const generateGraphData = useCallback(() => {
    const migrationData = getMigrationData();
    const filteredData = selectedModule === 'all' 
      ? migrationData 
      : migrationData.filter(m => m.module === selectedModule);

    const allTables = filteredData.flatMap(migration => 
      migration.tables.map(table => ({
        ...table,
        module: migration.module
      }))
    );

    // Filter tables based on search term
    const filteredTables = searchTerm 
      ? allTables.filter(table => 
          table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          Object.keys(table.fields).some(field => 
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : allTables;

    // Create nodes
    const newNodes: Node[] = filteredTables.map((table, index) => ({
      id: table.name,
      type: 'tableNode',
      position: { 
        x: (index % 4) * 320, 
        y: Math.floor(index / 4) * 400 
      },
      data: { 
        table: table,
        isHighlighted: searchTerm ? 
          table.name.toLowerCase().includes(searchTerm.toLowerCase()) : false
      },
      draggable: true,
    }));

    // Create edges for foreign key relationships
    const newEdges: Edge[] = [];
    filteredTables.forEach(table => {
      Object.entries(table.fields).forEach(([fieldName, field]) => {
        if (field.foreignKey) {
          const targetTable = field.foreignKey.split('.')[0] + '.' + field.foreignKey.split('.')[1];
          if (filteredTables.some(t => t.name === targetTable)) {
            newEdges.push({
              id: `${table.name}-${targetTable}-${fieldName}`,
              source: table.name,
              target: targetTable,
              type: 'smoothstep',
              animated: false,
              style: { stroke: '#8b5cf6', strokeWidth: 2 },
              markerEnd: {
                type: 'arrowclosed',
                color: '#8b5cf6',
              },
              label: fieldName,
              labelStyle: { fontSize: '10px', fill: '#6b7280' },
            });
          }
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);

    // Auto-fit view after a short delay
    setTimeout(() => {
      fitView({ padding: 0.1 });
    }, 100);
  }, [searchTerm, selectedModule, setNodes, setEdges, fitView]);

  // Load data on component mount and when filters change
  useEffect(() => {
    generateGraphData();
  }, [generateGraphData]);

  const modules = ['all', ...Array.from(new Set(getMigrationData().map(m => m.module)))];

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="p-2 rounded-lg bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Database Schema Visualization</h1>
            <p className="text-sm text-muted-foreground">Interactive view of all database tables and relationships</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables or fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {modules.map(module => (
                <option key={module} value={module}>
                  {module === 'all' ? 'All Modules' : module.charAt(0).toUpperCase() + module.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={generateGraphData} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => fitView()} size="sm" variant="outline">
              <Maximize className="h-4 w-4 mr-2" />
              Fit View
            </Button>
            <Button onClick={() => zoomIn()} size="sm" variant="outline">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button onClick={() => zoomOut()} size="sm" variant="outline">
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Flow Area */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          className="bg-background"
        >
          <Controls 
            position="top-left"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            className="bg-muted/10"
          />
        </ReactFlow>
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {nodes.length} tables with {edges.length} relationships
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Key className="h-3 w-3 text-amber-500" />
              <span>Primary Key</span>
            </div>
            <div className="flex items-center gap-2">
              <Link className="h-3 w-3 text-blue-500" />
              <span>Foreign Key</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Relationship</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with permission wrapper
export default function DatabaseFullView() {
  return (
    <ReactFlowProvider>
      <DatabaseFullViewWrapper />
    </ReactFlowProvider>
  );
}
