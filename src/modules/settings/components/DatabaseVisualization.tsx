import React, { useState, useCallback, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
              {fieldName === table.primaryKey && <Key className="h-3 w-3 text-warning flex-shrink-0" />}
              {field.foreignKey && <Link className="h-3 w-3 text-primary flex-shrink-0" />}
              <span className="font-medium truncate">{fieldName}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-muted-foreground">{field.type}</span>
              {field.required && <span className="text-destructive text-[10px]">*</span>}
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
  return [
    // Field Module - Updated with latest structure and location data
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
          name: "FIELD.technicians",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            firstName: { type: "string", required: true },
            lastName: { type: "string", required: true },
            email: { type: "string", required: true },
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
    // CRM/Contacts Module
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
            firstName: { type: "string", required: true },
            lastName: { type: "string", required: true },
            email: { type: "string", required: false },
            phone: { type: "string", required: false },
            company: { type: "string", required: false },
            title: { type: "string", required: false },
            website: { type: "string", required: false },
            address: { type: "json", required: false },
            source: { type: "string", required: false },
            status: { type: "string", required: true, enum: ["active", "inactive", "lead", "prospect", "customer"] },
            tags: { type: "array", items: "string" },
            notes: { type: "text", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            modifiedBy: { type: "string", required: false, foreignKey: "SYS.users.id" }
          }
        },
        {
          name: "CRM.contact_notes",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            note: { type: "text", required: true },
            type: { type: "string", required: true, enum: ["general", "call", "email", "meeting", "task"] },
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
            description: { type: "text", required: false },
            amount: { type: "decimal", required: true },
            currency: { type: "string", required: true, foreignKey: "LU.currencies.id" },
            status: { type: "string", required: true, foreignKey: "LU.offer_statuses.id" },
            validUntil: { type: "datetime", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
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
            status: { type: "string", required: true, foreignKey: "LU.project_statuses.id" },
            type: { type: "string", required: true, foreignKey: "LU.project_types.id" },
            startDate: { type: "date", required: false },
            endDate: { type: "date", required: false },
            budget: { type: "decimal", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          }
        },
        {
          name: "CRM.contact_project_columns",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            projectId: { type: "string", required: true, foreignKey: "CRM.contact_projects.id" },
            name: { type: "string", required: true },
            position: { type: "integer", required: true },
            color: { type: "string", required: false },
            createdAt: { type: "datetime", required: true }
          }
        },
        {
          name: "CRM.contact_tasks",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            contactId: { type: "string", required: true, foreignKey: "CRM.contacts.id" },
            projectId: { type: "string", required: false, foreignKey: "CRM.contact_projects.id" },
            columnId: { type: "string", required: false, foreignKey: "CRM.contact_project_columns.id" },
            title: { type: "string", required: true },
            description: { type: "text", required: false },
            status: { type: "string", required: true, foreignKey: "LU.task_statuses.id" },
            priority: { type: "string", required: true, foreignKey: "LU.priorities.id" },
            dueDate: { type: "datetime", required: false },
            assignedTo: { type: "string", required: false, foreignKey: "SYS.users.id" },
            position: { type: "integer", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
          }
        },
        {
          name: "CRM.contact_tags",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            createdAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" }
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
    // Calendar Module
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
          }
        }
      ]
    },
    // Workflow Module
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
          }
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
          }
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
          }
        }
      ]
    },
    // Documents Module
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
            originalFileName: { type: "string", required: true },
            fileType: { type: "string", required: true },
            fileSize: { type: "integer", required: true },
            filePath: { type: "string", required: true },
            mimeType: { type: "string", required: true },
            checksum: { type: "string", required: true },
            version: { type: "integer", required: true, default: 1 },
            description: { type: "text", required: false },
            tags: { type: "array", items: "string" },
            isPublic: { type: "boolean", required: true, default: false },
            uploadedAt: { type: "datetime", required: true },
            uploadedBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            updatedAt: { type: "datetime", required: true },
            parentDocumentId: { type: "string", required: false, foreignKey: "CRM.documents.id" }
          }
        },
        {
          name: "CRM.document_comments",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            documentId: { type: "string", required: true, foreignKey: "CRM.documents.id" },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            comment: { type: "text", required: true },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          }
        },
        {
          name: "CRM.document_share_links",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            documentId: { type: "string", required: true, foreignKey: "CRM.documents.id" },
            linkId: { type: "string", required: true },
            type: { type: "string", required: true, enum: ["view", "download", "edit"] },
            accessLevel: { type: "string", required: true, enum: ["public", "restricted", "private"] },
            password: { type: "string", required: false },
            expiresAt: { type: "datetime", required: false },
            maxDownloads: { type: "integer", required: false },
            downloadCount: { type: "integer", required: true, default: 0 },
            isActive: { type: "boolean", required: true, default: true },
            createdAt: { type: "datetime", required: true },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            lastAccessedAt: { type: "datetime", required: false }
          }
        }
      ]
    },
    // Lookups Module
    {
      module: "lookups",
      version: "001",
      description: "System Lookup Tables",
      tables: [
        {
          name: "LU.article_categories",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "string", required: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.article_statuses", 
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "string", required: false },
            color: { type: "string", required: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.service_categories",
          primaryKey: "id", 
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "string", required: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.currencies",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            code: { type: "string", required: true },
            name: { type: "string", required: true },
            symbol: { type: "string", required: true },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.countries",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            code: { type: "string", required: true },
            name: { type: "string", required: true },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.priorities",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            level: { type: "integer", required: true },
            color: { type: "string", required: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.event_types",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.task_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isDefault: { type: "boolean", required: true, default: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.project_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isDefault: { type: "boolean", required: true, default: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.project_types",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "string", required: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.offer_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isDefault: { type: "boolean", required: true, default: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.technician_statuses",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            color: { type: "string", required: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.leave_types",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "string", required: false },
            isPaid: { type: "boolean", required: true, default: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        },
        {
          name: "LU.skills",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            category: { type: "string", required: false },
            description: { type: "string", required: false },
            isActive: { type: "boolean", required: true, default: true }
          }
        }
      ]
    },
    // System Module
    {
      module: "system",
      version: "001",
      description: "System Core Tables",
      tables: [
        {
          name: "SYS.users",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            username: { type: "string", required: true },
            email: { type: "string", required: true },
            firstName: { type: "string", required: false },
            lastName: { type: "string", required: false },
            role: { type: "string", required: true },
            status: { type: "string", required: true, enum: ["active", "inactive", "suspended"] },
            lastLoginAt: { type: "datetime", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          }
        }
      ]
    },
    // Preferences Module
    {
      module: "preferences",
      version: "001",
      description: "User Workspace Preferences and Customization Tables",
      tables: [
        {
          name: "PREF.user_preferences",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            theme: { type: "string", required: true, enum: ["light", "dark", "system"] },
            language: { type: "string", required: true },
            primaryColor: { type: "string", required: true, enum: ["blue", "red", "green", "purple", "orange", "indigo"] },
            layoutMode: { type: "string", required: true, enum: ["sidebar", "topbar"] },
            dataView: { type: "string", required: true, enum: ["table", "list", "grid"] },
            timezone: { type: "string", required: false },
            dateFormat: { type: "string", required: true },
            timeFormat: { type: "string", required: true, enum: ["12h", "24h"] },
            currency: { type: "string", required: true },
            numberFormat: { type: "string", required: true, enum: ["comma", "dot"] },
            notifications: { type: "json", required: true },
            sidebarCollapsed: { type: "boolean" },
            compactMode: { type: "boolean" },
            showTooltips: { type: "boolean" },
            animationsEnabled: { type: "boolean" },
            soundEnabled: { type: "boolean" },
            autoSave: { type: "boolean" },
            workArea: { type: "string", required: false },
            dashboardLayout: { type: "json", required: false },
            quickAccessItems: { type: "array", items: "string" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          }
        },
        {
          name: "PREF.company_settings",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            companyName: { type: "string", required: false },
            companyLogo: { type: "string", required: false },
            companyWebsite: { type: "string", required: false },
            companyAddress: { type: "json", required: false },
            companyPhone: { type: "string", required: false },
            companyEmail: { type: "string", required: false },
            taxNumber: { type: "string", required: false },
            businessType: { type: "string", required: false },
            industry: { type: "string", required: false },
            employeeCount: { type: "string", required: false, enum: ["1-10", "11-50", "51-200", "201-500", "500+"] },
            fiscalYearStart: { type: "string", required: false },
            defaultCurrency: { type: "string", required: true },
            invoicePrefix: { type: "string", required: false },
            quotePrefix: { type: "string", required: false },
            orderPrefix: { type: "string", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          }
        },
        {
          name: "PREF.workspace_templates",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            description: { type: "text", required: false },
            category: { type: "string", required: true, enum: ["dashboard", "layout", "theme", "workflow"] },
            templateData: { type: "json", required: true },
            isPublic: { type: "boolean" },
            isSystem: { type: "boolean" },
            tags: { type: "array", items: "string" },
            usageCount: { type: "integer" },
            rating: { type: "decimal", required: false },
            createdBy: { type: "string", required: true, foreignKey: "SYS.users.id" },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          }
        },
        {
          name: "PREF.user_templates",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            templateId: { type: "string", required: true, foreignKey: "PREF.workspace_templates.id" },
            customizations: { type: "json", required: false },
            isActive: { type: "boolean" },
            appliedAt: { type: "datetime", required: true }
          }
        },
        {
          name: "PREF.dashboard_widgets",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            widgetType: { type: "string", required: true, enum: ["chart", "kpi", "list", "calendar", "activity", "custom"] },
            title: { type: "string", required: true },
            config: { type: "json", required: true },
            position: { type: "json", required: true },
            size: { type: "json", required: true },
            isVisible: { type: "boolean" },
            refreshInterval: { type: "integer", required: false },
            dataSource: { type: "string", required: false },
            permissions: { type: "json", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          }
        },
        {
          name: "PREF.user_shortcuts",
          primaryKey: "id",
          fields: {
            id: { type: "string", required: true },
            userId: { type: "string", required: true, foreignKey: "SYS.users.id" },
            name: { type: "string", required: true },
            description: { type: "text", required: false },
            shortcutKey: { type: "string", required: true },
            action: { type: "string", required: true },
            actionData: { type: "json", required: false },
            isEnabled: { type: "boolean" },
            category: { type: "string", required: false },
            createdAt: { type: "datetime", required: true },
            updatedAt: { type: "datetime", required: true }
          }
        }
      ]
    }
  ];
};

const DatabaseVisualizationFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const { t } = useTranslation('settings');
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Generate nodes and edges from migration data
  const generateGraphData = useCallback(() => {
    const migrationData = getMigrationData();
    const allTables: MigrationTable[] = [];
    const moduleMap: Record<string, string> = {};
    
    // Collect all tables and map them to modules
    migrationData.forEach(migration => {
      migration.tables.forEach(table => {
        allTables.push(table);
        moduleMap[table.name] = migration.module;
      });
    });

    // Filter tables based on search and module
    const filteredTables = allTables.filter(table => {
      const matchesSearch = searchTerm === '' || 
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.keys(table.fields).some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesModule = selectedModule === 'all' || moduleMap[table.name] === selectedModule;
      
      return matchesSearch && matchesModule;
    });

    // Create nodes
    const newNodes: Node[] = filteredTables.map((table, index) => {
      const x = (index % 4) * 320 + 50;
      const y = Math.floor(index / 4) * 280 + 50;
      
      return {
        id: table.name,
        type: 'tableNode',
        position: { x, y },
        data: { 
          table: { ...table, module: moduleMap[table.name] },
          isHighlighted: false 
        },
        draggable: true,
      };
    });

    // Create edges for foreign key relationships
    const newEdges: Edge[] = [];
    filteredTables.forEach(table => {
      Object.entries(table.fields).forEach(([fieldName, field]) => {
        if (field.foreignKey) {
          const [targetSchema, targetTable] = field.foreignKey.split('.');
          const targetTableName = `${targetSchema}.${targetTable}`;
          
          // Only create edge if both tables are in the filtered set
          if (filteredTables.some(t => t.name === targetTableName)) {
            newEdges.push({
              id: `${table.name}-${targetTableName}-${fieldName}`,
              source: table.name,
              target: targetTableName,
              type: 'default',
              animated: false,
              style: { 
                stroke: 'hsl(var(--primary))', 
                strokeWidth: 3,
              },
              markerEnd: {
                type: 'arrowclosed',
                color: 'hsl(var(--primary))',
                width: 20,
                height: 20,
              },
              label: fieldName,
              labelStyle: { 
                fontSize: 12, 
                fontWeight: 'bold',
                fill: 'hsl(var(--primary))',
                backgroundColor: 'hsl(var(--background))',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '2px solid hsl(var(--primary))',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              },
              labelBgPadding: [8, 4],
              labelBgBorderRadius: 6,
              labelBgStyle: {
                fill: 'hsl(var(--background))',
                stroke: 'hsl(var(--primary))',
                strokeWidth: 2,
              },
            });
          }
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    
    // Fit view after a short delay to ensure nodes are rendered
    setTimeout(() => fitView(), 100);

    toast.success(t('databaseVisualization.loadedToast', { tableCount: filteredTables.length, relationshipCount: newEdges.length }));
  }, [searchTerm, selectedModule, setNodes, setEdges, fitView]);

  // Load data on component mount and when filters change
  useEffect(() => {
    generateGraphData();
  }, [generateGraphData]);

  const modules = ['all', ...Array.from(new Set(getMigrationData().map(m => m.module)))];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('databaseVisualization.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {modules.map(module => (
              <option key={module} value={module}>
                {module === 'all' ? t('databaseVisualization.allModules') : module.charAt(0).toUpperCase() + module.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={generateGraphData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('databaseVisualization.refresh')}
          </Button>
          <Button onClick={() => fitView()} size="sm" variant="outline">
            <Maximize className="h-4 w-4 mr-2" />
            {t('databaseVisualization.fitView')}
          </Button>
        </div>
      </div>


      {/* Graph Visualization */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div style={{ width: '100%', height: '600px' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Controls 
                position="top-left"
                className="!bg-card !border-border shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground hover:[&>button]:!bg-muted [&>button]:!shadow-sm"
              />
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={20} 
                size={1}
                color="hsl(var(--border))"
              />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
        <Card className="p-4">
        <CardTitle className="text-sm mb-3">{t('databaseVisualization.legendTitle')}</CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Key className="h-3 w-3 text-warning" />
            <span>{t('databaseVisualization.legend.primaryKey')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link className="h-3 w-3 text-primary" />
            <span>{t('databaseVisualization.legend.foreignKey')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-destructive text-[10px] font-bold">*</span>
            <span>{t('databaseVisualization.legend.requiredField')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary animate-pulse"></div>
            <span>{t('databaseVisualization.legend.relationship')}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export function DatabaseVisualization() {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Database className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{t('databaseVisualization.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('databaseVisualization.desc')}
          </p>
        </div>
      </div>

      <ReactFlowProvider>
        <DatabaseVisualizationFlow />
      </ReactFlowProvider>
    </div>
  );
}