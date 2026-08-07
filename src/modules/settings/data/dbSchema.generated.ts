// AUTO-GENERATED from FullDatabaseTable dump — do not edit by hand.
export type DbColumn = { name: string; def: string };
export type DbForeignKey = { from: string; to: string; col: string };
export type DbIndex = { name: string; unique: boolean; columns: string[] };
export type DbTableSchema = {
  name: string;
  category: string;
  sources: string[];
  primaryKey: string[] | null;
  uniques: string[][];
  indexes: DbIndex[];
  columns: DbColumn[];
  foreignKeys: DbForeignKey[];
};
export const DB_SCHEMA: DbTableSchema[] = [
  {
    "name": "__EFMigrationsHistory",
    "category": "System",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "MigrationId"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "PK___EFMigrationsHistory",
        "unique": true,
        "columns": [
          "MigrationId"
        ]
      }
    ],
    "columns": [
      {
        "name": "MigrationId",
        "def": "varchar(150)"
      },
      {
        "name": "ProductVersion",
        "def": "varchar(32) NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "activated_modules",
    "category": "Platform",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "activated_modules_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_activated_modules_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ux_activated_modules_plugin_code",
        "unique": true,
        "columns": [
          "plugin_code"
        ]
      },
      {
        "name": "ux_activated_modules_tenant_code",
        "unique": true,
        "columns": [
          "TenantId",
          "plugin_code"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "plugin_code",
        "def": "varchar(40) NOT NULL"
      },
      {
        "name": "is_enabled",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_by",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "AiConversations",
    "category": "AI",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "AiConversations_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_AiConversations_LastMessageAt",
        "unique": false,
        "columns": [
          "LastMessageAt"
        ]
      },
      {
        "name": "IX_AiConversations_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_AiConversations_UserId",
        "unique": false,
        "columns": [
          "UserId"
        ]
      },
      {
        "name": "IX_AiConversations_UserId_IsDeleted",
        "unique": false,
        "columns": [
          "UserId",
          "IsDeleted"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Title",
        "def": "varchar(255) DEFAULT 'New Conversation' NOT NULL"
      },
      {
        "name": "Summary",
        "def": "text"
      },
      {
        "name": "LastMessageAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "MessageCount",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsArchived",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "IsPinned",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "AiMessages",
    "category": "AI",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "AiMessages_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_AiMessages_ConversationId",
        "unique": false,
        "columns": [
          "ConversationId"
        ]
      },
      {
        "name": "IX_AiMessages_CreatedAt",
        "unique": false,
        "columns": [
          "CreatedAt"
        ]
      },
      {
        "name": "IX_AiMessages_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ConversationId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Role",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "Content",
        "def": "text NOT NULL"
      },
      {
        "name": "Feedback",
        "def": "varchar(20)"
      },
      {
        "name": "IsRegenerated",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "Metadata",
        "def": "jsonb"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "AiMessages_ConversationId_fkey",
        "to": "AiConversations",
        "col": "ConversationId"
      }
    ]
  },
  {
    "name": "AppSettings",
    "category": "Platform",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "AppSettings_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "AppSettings_setting_key_key",
        "unique": true,
        "columns": [
          "setting_key"
        ]
      },
      {
        "name": "idx_app_settings_key",
        "unique": false,
        "columns": [
          "setting_key"
        ]
      },
      {
        "name": "IX_AppSettings_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "setting_key",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "setting_value",
        "def": "text DEFAULT '' NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now()"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ArticleCategories",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ArticleCategories_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_ArticleCategories",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"ArticleCategories_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "ParentCategoryId",
        "def": "integer"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ArticleGroups",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ix_article_groups_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_ArticleGroups",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"ArticleGroups_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ArticleNotes",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ArticleNotes_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "idx_article_notes_article_id",
        "unique": false,
        "columns": [
          "ArticleId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ArticleId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Note",
        "def": "text NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_ArticleNotes_Articles",
        "to": "Articles",
        "col": "ArticleId"
      }
    ]
  },
  {
    "name": "Articles",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_articles_name_ci",
        "unique": false,
        "columns": [
          "lower((Name"
        ]
      },
      {
        "name": "idx_articles_type",
        "unique": false,
        "columns": [
          "Type"
        ]
      },
      {
        "name": "IX_Articles_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Articles",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Articles_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "ArticleNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Name",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "CategoryId",
        "def": "integer"
      },
      {
        "name": "Unit",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "PurchasePrice",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "SalesPrice",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "StockQuantity",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "MinStockLevel",
        "def": "numeric(18, 2)"
      },
      {
        "name": "LocationId",
        "def": "integer"
      },
      {
        "name": "Supplier",
        "def": "varchar(200)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "Tags",
        "def": "text"
      },
      {
        "name": "Type",
        "def": "varchar(20) DEFAULT 'material'"
      },
      {
        "name": "Duration",
        "def": "integer"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100)"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "GroupId",
        "def": "integer"
      },
      {
        "name": "tva_rate",
        "def": "numeric(5, 2) DEFAULT '19.00' NOT NULL"
      },
      {
        "name": "TvaRate",
        "def": "numeric(5, 2) DEFAULT '19.00' NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ArticleSupplierPriceHistory",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ArticleSupplierPriceHistory_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_ArticleSupplierPriceHistory_ASId",
        "unique": false,
        "columns": [
          "ArticleSupplierId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ArticleSupplierId",
        "def": "integer NOT NULL"
      },
      {
        "name": "OldPrice",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "NewPrice",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "Currency",
        "def": "varchar(10) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "ChangedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "ChangedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "Reason",
        "def": "varchar(500)"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_ArticleSupplierPriceHistory_ArticleSuppliers_ArticleSupplier",
        "to": "ArticleSuppliers",
        "col": "ArticleSupplierId"
      }
    ]
  },
  {
    "name": "ArticleSuppliers",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "TenantId",
        "ArticleId",
        "SupplierId"
      ]
    ],
    "indexes": [
      {
        "name": "ArticleSuppliers_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "ArticleSuppliers_TenantId_ArticleId_SupplierId_key",
        "unique": true,
        "columns": [
          "TenantId",
          "ArticleId",
          "SupplierId"
        ]
      },
      {
        "name": "IX_ArticleSuppliers_ArticleId",
        "unique": false,
        "columns": [
          "TenantId",
          "ArticleId"
        ]
      },
      {
        "name": "IX_ArticleSuppliers_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_ArticleSuppliers_SupplierId",
        "unique": false,
        "columns": [
          "TenantId",
          "SupplierId"
        ]
      },
      {
        "name": "IX_ArticleSuppliers_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "ArticleId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "SupplierId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "SupplierRef",
        "def": "varchar(100)"
      },
      {
        "name": "PurchasePrice",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "Currency",
        "def": "varchar(10) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "MinOrderQty",
        "def": "numeric(18, 2) DEFAULT '1' NOT NULL"
      },
      {
        "name": "LeadTimeDays",
        "def": "integer DEFAULT 7 NOT NULL"
      },
      {
        "name": "IsPreferred",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(255)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Attachments",
    "category": "Documents",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_Attachments_DispatchId",
        "unique": false,
        "columns": [
          "DispatchId"
        ]
      },
      {
        "name": "IX_Attachments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Attachments",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Attachments_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "DispatchId",
        "def": "integer NOT NULL"
      },
      {
        "name": "FileName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "FilePath",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "FileSize",
        "def": "bigint NOT NULL"
      },
      {
        "name": "ContentType",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "AttachmentType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "UploadedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UploadedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "calendar_events",
    "category": "Calendar",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "calendar_events_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_calendar_events_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "Title",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Start",
        "def": "timestamp NOT NULL"
      },
      {
        "name": "End",
        "def": "timestamp NOT NULL"
      },
      {
        "name": "all_day",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "Type",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'scheduled' NOT NULL"
      },
      {
        "name": "Priority",
        "def": "varchar(10) DEFAULT 'medium' NOT NULL"
      },
      {
        "name": "Category",
        "def": "varchar(50)"
      },
      {
        "name": "Color",
        "def": "varchar(7)"
      },
      {
        "name": "Location",
        "def": "text"
      },
      {
        "name": "Attendees",
        "def": "jsonb"
      },
      {
        "name": "related_type",
        "def": "varchar(20)"
      },
      {
        "name": "related_id",
        "def": "uuid"
      },
      {
        "name": "contact_id",
        "def": "integer"
      },
      {
        "name": "Reminders",
        "def": "jsonb"
      },
      {
        "name": "Recurring",
        "def": "jsonb"
      },
      {
        "name": "is_private",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "created_by",
        "def": "uuid NOT NULL"
      },
      {
        "name": "modified_by",
        "def": "uuid"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_calendar_events_Contacts",
        "to": "Contacts",
        "col": "contact_id"
      },
      {
        "from": "FK_calendar_events_event_types",
        "to": "event_types",
        "col": "Type"
      }
    ]
  },
  {
    "name": "CalendarEvents",
    "category": "Calendar",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "PK_CalendarEvents",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"CalendarEvents_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Title",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "StartDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "EndDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "Location",
        "def": "varchar(200)"
      },
      {
        "name": "EventTypeId",
        "def": "integer"
      },
      {
        "name": "IsAllDay",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "RecurrenceRule",
        "def": "varchar(500)"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ConnectedEmailAccounts",
    "category": "Notifications & Email",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ConnectedEmailAccounts_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_ConnectedEmailAccounts_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_ConnectedEmailAccounts_UserId",
        "unique": false,
        "columns": [
          "UserId"
        ]
      },
      {
        "name": "IX_ConnectedEmailAccounts_UserId_Handle",
        "unique": true,
        "columns": [
          "UserId",
          "Handle"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Handle",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "Provider",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "AccessToken",
        "def": "text DEFAULT '' NOT NULL"
      },
      {
        "name": "RefreshToken",
        "def": "text DEFAULT '' NOT NULL"
      },
      {
        "name": "Scopes",
        "def": "text"
      },
      {
        "name": "SyncStatus",
        "def": "varchar(50) DEFAULT 'not_synced' NOT NULL"
      },
      {
        "name": "LastSyncedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "AuthFailedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "EmailVisibility",
        "def": "varchar(50) DEFAULT 'share_everything' NOT NULL"
      },
      {
        "name": "CalendarVisibility",
        "def": "varchar(50) DEFAULT 'share_everything' NOT NULL"
      },
      {
        "name": "ContactAutoCreationPolicy",
        "def": "varchar(50) DEFAULT 'sent_and_received' NOT NULL"
      },
      {
        "name": "IsEmailSyncEnabled",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "IsCalendarSyncEnabled",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "ExcludeGroupEmails",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "ExcludeNonProfessionalEmails",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "IsCalendarContactAutoCreationEnabled",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ContactNotes",
    "category": "CRM • Contacts",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_contactnotes_contact",
        "unique": false,
        "columns": [
          "ContactId"
        ]
      },
      {
        "name": "idx_contactnotes_contactid",
        "unique": false,
        "columns": [
          "ContactId"
        ]
      },
      {
        "name": "IX_ContactNotes_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_ContactNotes",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"ContactNotes_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "ContactId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Note",
        "def": "text NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Contacts",
    "category": "CRM • Contacts",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_contacts_active_created",
        "unique": false,
        "columns": [
          "CreatedDate"
        ]
      },
      {
        "name": "idx_contacts_cin",
        "unique": false,
        "columns": [
          "Cin"
        ]
      },
      {
        "name": "idx_contacts_company",
        "unique": false,
        "columns": [
          "Company"
        ]
      },
      {
        "name": "idx_contacts_company_ci",
        "unique": false,
        "columns": [
          "lower((Company"
        ]
      },
      {
        "name": "idx_contacts_company_lower",
        "unique": false,
        "columns": [
          "lower((Company"
        ]
      },
      {
        "name": "idx_contacts_email",
        "unique": false,
        "columns": [
          "Email"
        ]
      },
      {
        "name": "idx_contacts_email_ci",
        "unique": false,
        "columns": [
          "lower((Email"
        ]
      },
      {
        "name": "idx_contacts_email_lower",
        "unique": false,
        "columns": [
          "lower((Email"
        ]
      },
      {
        "name": "idx_contacts_favorites",
        "unique": false,
        "columns": [
          "CreatedDate"
        ]
      },
      {
        "name": "idx_contacts_firstname_ci",
        "unique": false,
        "columns": [
          "lower((FirstName"
        ]
      },
      {
        "name": "idx_contacts_geolocation",
        "unique": false,
        "columns": [
          "Latitude",
          "Longitude"
        ]
      },
      {
        "name": "idx_contacts_has_location",
        "unique": false,
        "columns": [
          "HasLocation"
        ]
      },
      {
        "name": "idx_contacts_isactive",
        "unique": false,
        "columns": [
          "IsActive"
        ]
      },
      {
        "name": "idx_contacts_lastname_ci",
        "unique": false,
        "columns": [
          "lower((LastName"
        ]
      },
      {
        "name": "idx_contacts_matricule",
        "unique": false,
        "columns": [
          "MatriculeFiscale"
        ]
      },
      {
        "name": "idx_contacts_name",
        "unique": false,
        "columns": [
          "Name"
        ]
      },
      {
        "name": "idx_contacts_name_lower",
        "unique": false,
        "columns": [
          "lower((Name"
        ]
      },
      {
        "name": "idx_contacts_status",
        "unique": false,
        "columns": [
          "Status"
        ]
      },
      {
        "name": "idx_contacts_status_type",
        "unique": false,
        "columns": [
          "Status",
          "Type"
        ]
      },
      {
        "name": "idx_contacts_type",
        "unique": false,
        "columns": [
          "Type"
        ]
      },
      {
        "name": "IX_Contacts_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Contacts",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Contacts_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "FirstName",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "LastName",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Email",
        "def": "varchar(255)"
      },
      {
        "name": "Phone",
        "def": "varchar(20)"
      },
      {
        "name": "Company",
        "def": "varchar(200)"
      },
      {
        "name": "Position",
        "def": "varchar(100)"
      },
      {
        "name": "Address",
        "def": "varchar(500)"
      },
      {
        "name": "City",
        "def": "varchar(100)"
      },
      {
        "name": "Country",
        "def": "varchar(100)"
      },
      {
        "name": "PostalCode",
        "def": "varchar(20)"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "Name",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(50) DEFAULT 'active'"
      },
      {
        "name": "Type",
        "def": "varchar(50) DEFAULT 'individual'"
      },
      {
        "name": "Avatar",
        "def": "varchar(500)"
      },
      {
        "name": "Favorite",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "LastContactDate",
        "def": "timestamp"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "Cin",
        "def": "varchar(50)"
      },
      {
        "name": "MatriculeFiscale",
        "def": "varchar(100)"
      },
      {
        "name": "Latitude",
        "def": "numeric(10, 7)"
      },
      {
        "name": "Longitude",
        "def": "numeric(10, 7)"
      },
      {
        "name": "HasLocation",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ContactTagAssignments",
    "category": "CRM • Contacts",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_contacttagassignments_contact",
        "unique": false,
        "columns": [
          "ContactId"
        ]
      },
      {
        "name": "idx_contacttagassignments_tag",
        "unique": false,
        "columns": [
          "TagId"
        ]
      },
      {
        "name": "IX_ContactTagAssignments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_ContactTagAssignments",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"ContactTagAssignments_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "ContactId",
        "def": "integer NOT NULL"
      },
      {
        "name": "TagId",
        "def": "integer NOT NULL"
      },
      {
        "name": "AssignedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "AssignedBy",
        "def": "varchar(255)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ContactTags",
    "category": "CRM • Contacts",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ContactTags_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_ContactTags",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"ContactTags_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Color",
        "def": "varchar(7)"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Currencies",
    "category": "Lookups",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_Currencies_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Currencies",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Currencies_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Code",
        "def": "varchar(3) NOT NULL"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Symbol",
        "def": "varchar(10) NOT NULL"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "IsDefault",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "SortOrder",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "CreatedUser",
        "def": "varchar(100) DEFAULT 'system'"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp DEFAULT now()"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "custom_email_accounts",
    "category": "Notifications & Email",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "custom_email_accounts_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "idx_custom_email_accounts_user_id",
        "unique": false,
        "columns": [
          "user_id"
        ]
      },
      {
        "name": "ux_custom_email_accounts_user_email",
        "unique": true,
        "columns": [
          "user_id",
          "email"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "user_id",
        "def": "uuid"
      },
      {
        "name": "email",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "display_name",
        "def": "varchar(255)"
      },
      {
        "name": "provider",
        "def": "varchar(50) DEFAULT 'custom'"
      },
      {
        "name": "smtp_server",
        "def": "varchar(255)"
      },
      {
        "name": "smtp_port",
        "def": "integer"
      },
      {
        "name": "smtp_security",
        "def": "varchar(20)"
      },
      {
        "name": "imap_server",
        "def": "varchar(255)"
      },
      {
        "name": "imap_port",
        "def": "integer"
      },
      {
        "name": "imap_security",
        "def": "varchar(20)"
      },
      {
        "name": "pop3_server",
        "def": "varchar(255)"
      },
      {
        "name": "pop3_port",
        "def": "integer"
      },
      {
        "name": "pop3_security",
        "def": "varchar(20)"
      },
      {
        "name": "encrypted_password",
        "def": "text"
      },
      {
        "name": "is_active",
        "def": "boolean DEFAULT true"
      },
      {
        "name": "last_synced_at",
        "def": "timestamp with time zone"
      },
      {
        "name": "created_at",
        "def": "timestamp with time zone DEFAULT now()"
      },
      {
        "name": "updated_at",
        "def": "timestamp with time zone DEFAULT now()"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "CustomEmailAccounts",
    "category": "Notifications & Email",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "CustomEmailAccounts_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_CustomEmailAccounts_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_CustomEmailAccounts_UserId",
        "unique": false,
        "columns": [
          "UserId"
        ]
      },
      {
        "name": "UX_CustomEmailAccounts_UserId_Email",
        "unique": true,
        "columns": [
          "UserId",
          "Email"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "UserId",
        "def": "integer"
      },
      {
        "name": "Email",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "DisplayName",
        "def": "varchar(255)"
      },
      {
        "name": "Provider",
        "def": "varchar(50) DEFAULT 'custom'"
      },
      {
        "name": "SmtpServer",
        "def": "varchar(255)"
      },
      {
        "name": "SmtpPort",
        "def": "integer"
      },
      {
        "name": "SmtpSecurity",
        "def": "varchar(20)"
      },
      {
        "name": "ImapServer",
        "def": "varchar(255)"
      },
      {
        "name": "ImapPort",
        "def": "integer"
      },
      {
        "name": "ImapSecurity",
        "def": "varchar(20)"
      },
      {
        "name": "Pop3Server",
        "def": "varchar(255)"
      },
      {
        "name": "Pop3Port",
        "def": "integer"
      },
      {
        "name": "Pop3Security",
        "def": "varchar(20)"
      },
      {
        "name": "EncryptedPassword",
        "def": "text"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true"
      },
      {
        "name": "LastSyncedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now()"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now()"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "DailyTasks",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_DailyTasks_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_DailyTasks",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"DailyTasks_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Title",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "DueDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "IsCompleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CompletedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "AssignedUserId",
        "def": "integer"
      },
      {
        "name": "Priority",
        "def": "varchar(20)"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'todo'"
      },
      {
        "name": "EstimatedHours",
        "def": "numeric(18, 2)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "TaskType",
        "def": "varchar(50) DEFAULT 'follow-up' NOT NULL"
      },
      {
        "name": "RelatedEntityType",
        "def": "varchar(50)"
      },
      {
        "name": "RelatedEntityId",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Dashboards",
    "category": "Dashboards",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "Dashboards_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "idx_dashboards_active",
        "unique": false,
        "columns": [
          "IsDeleted",
          "UpdatedAt"
        ]
      },
      {
        "name": "idx_dashboards_share_token",
        "unique": false,
        "columns": [
          "ShareToken"
        ]
      },
      {
        "name": "idx_dashboards_sharetoken",
        "unique": true,
        "columns": [
          "ShareToken"
        ]
      },
      {
        "name": "IX_Dashboards_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "Name",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "TemplateKey",
        "def": "varchar(50)"
      },
      {
        "name": "IsDefault",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "IsShared",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "SharedWithRoles",
        "def": "jsonb"
      },
      {
        "name": "Widgets",
        "def": "jsonb DEFAULT '[]' NOT NULL"
      },
      {
        "name": "GridSettings",
        "def": "jsonb"
      },
      {
        "name": "IsPublic",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "ShareToken",
        "def": "varchar(100)"
      },
      {
        "name": "SharedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(200)"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "SnapshotData",
        "def": "jsonb"
      },
      {
        "name": "SnapshotAt",
        "def": "timestamp"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "dispatch_history",
    "category": "Dispatches",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "dispatch_history_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_dispatch_history_changed_at",
        "unique": false,
        "columns": [
          "changed_at"
        ]
      },
      {
        "name": "ix_dispatch_history_dispatch",
        "unique": false,
        "columns": [
          "dispatch_id"
        ]
      },
      {
        "name": "ix_dispatch_history_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "dispatch_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "action",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "old_value",
        "def": "text"
      },
      {
        "name": "new_value",
        "def": "text"
      },
      {
        "name": "changed_by",
        "def": "varchar(50)"
      },
      {
        "name": "changed_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "metadata",
        "def": "jsonb"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Dispatches",
    "category": "Dispatches",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_dispatches_not_deleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "idx_dispatches_status_date",
        "unique": false,
        "columns": [
          "Status",
          "ScheduledDate"
        ]
      },
      {
        "name": "ix_dispatches_tenant_projectid",
        "unique": false,
        "columns": [
          "TenantId",
          "ProjectId"
        ]
      },
      {
        "name": "IX_Dispatches_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Dispatches",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "uq_dispatches_dispatch_number",
        "unique": true,
        "columns": [
          "DispatchNumber"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Dispatches_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "DispatchNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "ContactId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ServiceOrderId",
        "def": "integer"
      },
      {
        "name": "ProjectTaskId",
        "def": "integer"
      },
      {
        "name": "ScheduledDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "CompletedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "Status",
        "def": "text NOT NULL"
      },
      {
        "name": "Priority",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "SiteAddress",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "JobId",
        "def": "varchar(50)"
      },
      {
        "name": "DispatchedBy",
        "def": "varchar(50)"
      },
      {
        "name": "DispatchedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CompletionPercentage",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "RequiredSkills",
        "def": "text[]"
      },
      {
        "name": "WorkLocationJson",
        "def": "jsonb"
      },
      {
        "name": "ActualStartTime",
        "def": "timestamp with time zone"
      },
      {
        "name": "ActualEndTime",
        "def": "timestamp with time zone"
      },
      {
        "name": "ActualDuration",
        "def": "integer"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "InstallationId",
        "def": "integer"
      },
      {
        "name": "InstallationName",
        "def": "varchar(255)"
      },
      {
        "name": "ScheduledStartTime",
        "def": "interval"
      },
      {
        "name": "ScheduledEndTime",
        "def": "interval"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "ProjectId",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "DispatchHistory",
    "category": "Dispatches",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "PK_DispatchHistory",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"DispatchHistory_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "DispatchId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "StatusDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "ChangedBy",
        "def": "varchar(100) NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "DispatchJobs",
    "category": "Dispatches",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "DispatchId",
        "JobId"
      ]
    ],
    "indexes": [
      {
        "name": "DispatchJobs_DispatchId_JobId_key",
        "unique": true,
        "columns": [
          "DispatchId",
          "JobId"
        ]
      },
      {
        "name": "DispatchJobs_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_DispatchJobs_DispatchId",
        "unique": false,
        "columns": [
          "DispatchId"
        ]
      },
      {
        "name": "IX_DispatchJobs_JobId",
        "unique": false,
        "columns": [
          "JobId"
        ]
      },
      {
        "name": "IX_DispatchJobs_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "DispatchId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "JobId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": [
      {
        "from": "DispatchJobs_DispatchId_fkey",
        "to": "Dispatches",
        "col": "DispatchId"
      }
    ]
  },
  {
    "name": "DispatchTechnicians",
    "category": "Dispatches",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_DispatchTechnicians_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_DispatchTechnicians",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"DispatchTechnicians_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "DispatchId",
        "def": "integer NOT NULL"
      },
      {
        "name": "TechnicianId",
        "def": "integer NOT NULL"
      },
      {
        "name": "AssignedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "Role",
        "def": "varchar(50)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Documents",
    "category": "Documents",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "Documents_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "idx_documents_category",
        "unique": false,
        "columns": [
          "Category"
        ]
      },
      {
        "name": "idx_documents_module",
        "unique": false,
        "columns": [
          "ModuleType",
          "ModuleId"
        ]
      },
      {
        "name": "idx_documents_uploaded_at",
        "unique": false,
        "columns": [
          "UploadedAt"
        ]
      },
      {
        "name": "idx_documents_uploaded_by",
        "unique": false,
        "columns": [
          "UploadedBy"
        ]
      },
      {
        "name": "IX_Documents_CompressionMethod",
        "unique": false,
        "columns": [
          "CompressionMethod"
        ]
      },
      {
        "name": "IX_Documents_IsCompressed",
        "unique": false,
        "columns": [
          "IsCompressed"
        ]
      },
      {
        "name": "IX_Documents_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "FileName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "OriginalName",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "FilePath",
        "def": "varchar(1000) NOT NULL"
      },
      {
        "name": "FileSize",
        "def": "bigint NOT NULL"
      },
      {
        "name": "ContentType",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModuleType",
        "def": "varchar(50)"
      },
      {
        "name": "ModuleId",
        "def": "varchar(100)"
      },
      {
        "name": "ModuleName",
        "def": "varchar(255)"
      },
      {
        "name": "Category",
        "def": "varchar(50) DEFAULT 'crm' NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(1000)"
      },
      {
        "name": "Tags",
        "def": "varchar(500)"
      },
      {
        "name": "IsPublic",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "UploadedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "UploadedByName",
        "def": "varchar(200)"
      },
      {
        "name": "UploadedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp"
      },
      {
        "name": "OriginalFileSize",
        "def": "bigint"
      },
      {
        "name": "IsCompressed",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CompressionRatio",
        "def": "numeric(5, 2)"
      },
      {
        "name": "CompressionMethod",
        "def": "varchar(50) DEFAULT 'none' NOT NULL"
      },
      {
        "name": "ExternalUrl",
        "def": "varchar(2000)"
      },
      {
        "name": "ResourceType",
        "def": "varchar(50)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "DynamicFormResponses",
    "category": "Dynamic Forms",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "DynamicFormResponses_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_DynamicFormResponses_FormId",
        "unique": false,
        "columns": [
          "FormId"
        ]
      },
      {
        "name": "IX_DynamicFormResponses_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "FormId",
        "def": "integer NOT NULL"
      },
      {
        "name": "FormVersion",
        "def": "integer NOT NULL"
      },
      {
        "name": "EntityType",
        "def": "varchar(50)"
      },
      {
        "name": "EntityId",
        "def": "varchar(100)"
      },
      {
        "name": "Responses",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "Notes",
        "def": "varchar(2000)"
      },
      {
        "name": "SubmittedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "SubmittedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "SubmitterName",
        "def": "varchar(200)"
      },
      {
        "name": "SubmitterEmail",
        "def": "varchar(200)"
      },
      {
        "name": "IsPublicSubmission",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "DynamicFormResponses_FormId_fkey",
        "to": "DynamicForms",
        "col": "FormId"
      }
    ]
  },
  {
    "name": "DynamicForms",
    "category": "Dynamic Forms",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "DynamicForms_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "DynamicForms_PublicSlug_key",
        "unique": true,
        "columns": [
          "PublicSlug"
        ]
      },
      {
        "name": "idx_dynamicforms_publicslug",
        "unique": false,
        "columns": [
          "PublicSlug"
        ]
      },
      {
        "name": "idx_dynamicforms_thankyousettings",
        "unique": false,
        "columns": [
          "ThankYouSettings"
        ]
      },
      {
        "name": "IX_DynamicForms_PublicSlug",
        "unique": false,
        "columns": [
          "PublicSlug"
        ]
      },
      {
        "name": "IX_DynamicForms_Status",
        "unique": false,
        "columns": [
          "Status"
        ]
      },
      {
        "name": "IX_DynamicForms_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "NameEn",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "NameFr",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "DescriptionEn",
        "def": "varchar(1000)"
      },
      {
        "name": "DescriptionFr",
        "def": "varchar(1000)"
      },
      {
        "name": "Status",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "Version",
        "def": "integer DEFAULT 1 NOT NULL"
      },
      {
        "name": "Category",
        "def": "varchar(100)"
      },
      {
        "name": "Fields",
        "def": "jsonb DEFAULT '[]' NOT NULL"
      },
      {
        "name": "CreatedUser",
        "def": "varchar(100)"
      },
      {
        "name": "ModifyUser",
        "def": "varchar(100)"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100)"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "IsPublic",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "PublicSlug",
        "def": "varchar(200)"
      },
      {
        "name": "ThankYouSettings",
        "def": "jsonb"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "EmailBlocklistItems",
    "category": "Notifications & Email",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "EmailBlocklistItems_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_EmailBlocklistItems_AccountId_Handle",
        "unique": true,
        "columns": [
          "ConnectedEmailAccountId",
          "Handle"
        ]
      },
      {
        "name": "IX_EmailBlocklistItems_ConnectedEmailAccountId",
        "unique": false,
        "columns": [
          "ConnectedEmailAccountId"
        ]
      },
      {
        "name": "IX_EmailBlocklistItems_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "ConnectedEmailAccountId",
        "def": "uuid NOT NULL"
      },
      {
        "name": "Handle",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "EmailBlocklistItems_ConnectedEmailAccountId_fkey",
        "to": "ConnectedEmailAccounts",
        "col": "ConnectedEmailAccountId"
      }
    ]
  },
  {
    "name": "EntityFormDocuments",
    "category": "Dynamic Forms",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "EntityFormDocuments_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_EntityFormDocuments_Entity",
        "unique": false,
        "columns": [
          "EntityType",
          "EntityId"
        ]
      },
      {
        "name": "IX_EntityFormDocuments_FormId",
        "unique": false,
        "columns": [
          "FormId"
        ]
      },
      {
        "name": "IX_EntityFormDocuments_Status",
        "unique": false,
        "columns": [
          "Status"
        ]
      },
      {
        "name": "IX_EntityFormDocuments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "EntityType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "EntityId",
        "def": "integer NOT NULL"
      },
      {
        "name": "FormId",
        "def": "integer NOT NULL"
      },
      {
        "name": "FormVersion",
        "def": "integer DEFAULT 1 NOT NULL"
      },
      {
        "name": "Title",
        "def": "varchar(500)"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'Draft' NOT NULL"
      },
      {
        "name": "Responses",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "CreatedByName",
        "def": "varchar(255)"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(255)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(255)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_EntityFormDocuments_DynamicForms",
        "to": "DynamicForms",
        "col": "FormId"
      }
    ]
  },
  {
    "name": "event_attendees",
    "category": "Calendar",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "event_attendees_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_event_attendees_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "event_id",
        "def": "uuid NOT NULL"
      },
      {
        "name": "user_id",
        "def": "uuid"
      },
      {
        "name": "Email",
        "def": "varchar(200)"
      },
      {
        "name": "Name",
        "def": "varchar(100)"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "Response",
        "def": "text"
      },
      {
        "name": "responded_at",
        "def": "timestamp"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_event_attendees_calendar_events",
        "to": "calendar_events",
        "col": "event_id"
      }
    ]
  },
  {
    "name": "event_reminders",
    "category": "Calendar",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "event_reminders_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_event_reminders_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "event_id",
        "def": "uuid NOT NULL"
      },
      {
        "name": "Type",
        "def": "varchar(20) DEFAULT 'email' NOT NULL"
      },
      {
        "name": "minutes_before",
        "def": "integer NOT NULL"
      },
      {
        "name": "is_active",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "sent_at",
        "def": "timestamp"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_event_reminders_calendar_events",
        "to": "calendar_events",
        "col": "event_id"
      }
    ]
  },
  {
    "name": "event_types",
    "category": "Calendar",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "event_types_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_event_types_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Color",
        "def": "varchar(7) DEFAULT '#3B82F6' NOT NULL"
      },
      {
        "name": "is_default",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "is_active",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "EventAttendees",
    "category": "Calendar",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "PK_EventAttendees",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"EventAttendees_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "EventId",
        "def": "integer NOT NULL"
      },
      {
        "name": "UserId",
        "def": "integer"
      },
      {
        "name": "Email",
        "def": "varchar(255)"
      },
      {
        "name": "ResponseStatus",
        "def": "varchar(20) NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "EventReminders",
    "category": "Calendar",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "PK_EventReminders",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"EventReminders_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "EventId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ReminderMinutes",
        "def": "integer NOT NULL"
      },
      {
        "name": "ReminderType",
        "def": "varchar(20) NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "EventTypes",
    "category": "Calendar",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "PK_EventTypes",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"EventTypes_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Color",
        "def": "varchar(7)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Expenses",
    "category": "Service Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_Expenses_DispatchId",
        "unique": false,
        "columns": [
          "DispatchId"
        ]
      },
      {
        "name": "IX_Expenses_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Expenses",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Expenses_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "DispatchId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ExpenseType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Amount",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "ExpenseDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "ReceiptPath",
        "def": "varchar(500)"
      },
      {
        "name": "RecordedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ExternalEndpointLogs",
    "category": "Platform",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ExternalEndpointLogs_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_ExternalEndpointLogs_EndpointId",
        "unique": false,
        "columns": [
          "EndpointId"
        ]
      },
      {
        "name": "ix_ExternalEndpointLogs_EndpointId_ReceivedAt",
        "unique": false,
        "columns": [
          "EndpointId",
          "ReceivedAt"
        ]
      },
      {
        "name": "IX_ExternalEndpointLogs_ReceivedAt",
        "unique": false,
        "columns": [
          "ReceivedAt"
        ]
      },
      {
        "name": "IX_ExternalEndpointLogs_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "EndpointId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Method",
        "def": "varchar(10) DEFAULT 'POST' NOT NULL"
      },
      {
        "name": "Headers",
        "def": "text"
      },
      {
        "name": "QueryString",
        "def": "text"
      },
      {
        "name": "Body",
        "def": "text"
      },
      {
        "name": "SourceIp",
        "def": "varchar(50)"
      },
      {
        "name": "StatusCode",
        "def": "integer DEFAULT 200 NOT NULL"
      },
      {
        "name": "ResponseBody",
        "def": "text"
      },
      {
        "name": "ReceivedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "ProcessedAt",
        "def": "timestamp"
      },
      {
        "name": "IsRead",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_ExternalEndpointLogs_Endpoints",
        "to": "ExternalEndpoints",
        "col": "EndpointId"
      }
    ]
  },
  {
    "name": "ExternalEndpoints",
    "category": "Platform",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ExternalEndpoints_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_ExternalEndpoints_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_ExternalEndpoints_TenantId_Slug",
        "unique": true,
        "columns": [
          "TenantId",
          "Slug"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Name",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "Slug",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "ApiKey",
        "def": "varchar(128) NOT NULL"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "AllowedMethods",
        "def": "varchar(50) DEFAULT 'POST' NOT NULL"
      },
      {
        "name": "AllowedOrigins",
        "def": "text"
      },
      {
        "name": "ExpectedSchema",
        "def": "text"
      },
      {
        "name": "ResponseTemplate",
        "def": "text"
      },
      {
        "name": "WebhookForwardUrl",
        "def": "text"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "ForwardSecret",
        "def": "varchar(128)"
      },
      {
        "name": "LogRetentionDays",
        "def": "integer DEFAULT 30 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "GoodsReceiptItems",
    "category": "Purchases",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "GoodsReceiptItems_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_GoodsReceiptItems_GRId",
        "unique": false,
        "columns": [
          "GoodsReceiptId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "GoodsReceiptId",
        "def": "integer NOT NULL"
      },
      {
        "name": "PurchaseOrderItemId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ArticleId",
        "def": "integer"
      },
      {
        "name": "ArticleName",
        "def": "varchar(255)"
      },
      {
        "name": "ArticleNumber",
        "def": "varchar(50)"
      },
      {
        "name": "OrderedQty",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "QuantityReceived",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "QuantityRejected",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "RejectionReason",
        "def": "varchar(500)"
      },
      {
        "name": "LocationId",
        "def": "integer"
      },
      {
        "name": "Notes",
        "def": "text"
      }
    ],
    "foreignKeys": [
      {
        "from": "GoodsReceiptItems_GoodsReceiptId_fkey",
        "to": "GoodsReceipts",
        "col": "GoodsReceiptId"
      },
      {
        "from": "GoodsReceiptItems_PurchaseOrderItemId_fkey",
        "to": "PurchaseOrderItems",
        "col": "PurchaseOrderItemId"
      }
    ]
  },
  {
    "name": "GoodsReceipts",
    "category": "Purchases",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "GoodsReceipts_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_GoodsReceipts_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_GoodsReceipts_POId",
        "unique": false,
        "columns": [
          "PurchaseOrderId"
        ]
      },
      {
        "name": "IX_GoodsReceipts_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ReceiptNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "PurchaseOrderId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SupplierId",
        "def": "integer"
      },
      {
        "name": "SupplierName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "ReceiptDate",
        "def": "date DEFAULT CURRENT_DATE NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'partial' NOT NULL"
      },
      {
        "name": "DeliveryNoteRef",
        "def": "varchar(100)"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "ReceivedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "ReceivedByName",
        "def": "varchar(255)"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(255)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": [
      {
        "from": "GoodsReceipts_PurchaseOrderId_fkey",
        "to": "PurchaseOrders",
        "col": "PurchaseOrderId"
      }
    ]
  },
  {
    "name": "hr_applicant_notes",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_applicant_notes_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_applicant_notes_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "applicant_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "body",
        "def": "text NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "author_user_id",
        "def": "integer"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "fk_hr_applicant_notes_applicant",
        "to": "hr_applicants",
        "col": "applicant_id"
      }
    ]
  },
  {
    "name": "hr_applicants",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_applicants_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_applicants_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_applicants_tenant_email",
        "unique": false,
        "columns": [
          "TenantId",
          "email"
        ]
      },
      {
        "name": "ix_hr_applicants_tenant_opening",
        "unique": false,
        "columns": [
          "TenantId",
          "opening_id"
        ]
      },
      {
        "name": "ix_hr_applicants_tenant_stage",
        "unique": false,
        "columns": [
          "TenantId",
          "stage"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "opening_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "first_name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "last_name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "email",
        "def": "varchar(200)"
      },
      {
        "name": "phone",
        "def": "varchar(40)"
      },
      {
        "name": "source",
        "def": "varchar(60)"
      },
      {
        "name": "resume_url",
        "def": "varchar(500)"
      },
      {
        "name": "resume_file_name",
        "def": "varchar(200)"
      },
      {
        "name": "stage",
        "def": "varchar(30) DEFAULT 'applied' NOT NULL"
      },
      {
        "name": "rating",
        "def": "integer"
      },
      {
        "name": "expected_salary",
        "def": "numeric(14, 3)"
      },
      {
        "name": "available_from",
        "def": "timestamp"
      },
      {
        "name": "rejection_reason",
        "def": "varchar(300)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "created_by",
        "def": "integer"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "fk_hr_applicants_opening",
        "to": "hr_job_openings",
        "col": "opening_id"
      }
    ]
  },
  {
    "name": "hr_attendance",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_attendance_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_attendance_tenant_user_date",
        "unique": true,
        "columns": [
          "TenantId",
          "user_id",
          "date"
        ]
      },
      {
        "name": "ix_hr_attendance_tenantid",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "date",
        "def": "date NOT NULL"
      },
      {
        "name": "check_in",
        "def": "time"
      },
      {
        "name": "check_out",
        "def": "time"
      },
      {
        "name": "break_minutes",
        "def": "integer"
      },
      {
        "name": "source",
        "def": "varchar(30) DEFAULT 'manual' NOT NULL"
      },
      {
        "name": "raw_data",
        "def": "text"
      },
      {
        "name": "total_hours",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "overtime_hours",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(30) DEFAULT 'present' NOT NULL"
      },
      {
        "name": "notes",
        "def": "text"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_attendance_settings",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_attendance_settings_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_attendance_settings_tenant",
        "unique": true,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "weekend_days",
        "def": "text DEFAULT '[0,6]' NOT NULL"
      },
      {
        "name": "standard_hours_per_day",
        "def": "numeric(10, 2) DEFAULT '8' NOT NULL"
      },
      {
        "name": "overtime_threshold_hours",
        "def": "numeric(10, 2) DEFAULT '8' NOT NULL"
      },
      {
        "name": "overtime_multiplier",
        "def": "numeric(10, 2) DEFAULT '1.5' NOT NULL"
      },
      {
        "name": "rounding_method",
        "def": "varchar(20) DEFAULT 'none' NOT NULL"
      },
      {
        "name": "calculation_method",
        "def": "varchar(30) DEFAULT 'actual_hours' NOT NULL"
      },
      {
        "name": "late_threshold_minutes",
        "def": "integer DEFAULT 10 NOT NULL"
      },
      {
        "name": "holidays",
        "def": "text DEFAULT '[]' NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "work_days_json",
        "def": "text DEFAULT '[1,2,3,4,5]' NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_audit_logs",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_audit_logs_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_audit_logs_event",
        "unique": false,
        "columns": [
          "event_type"
        ]
      },
      {
        "name": "ix_hr_audit_logs_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_audit_logs_user",
        "unique": false,
        "columns": [
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "event_type",
        "def": "varchar(60) NOT NULL"
      },
      {
        "name": "description",
        "def": "varchar(500)"
      },
      {
        "name": "payload",
        "def": "text"
      },
      {
        "name": "actor_user_id",
        "def": "integer"
      },
      {
        "name": "actor_name",
        "def": "varchar(200)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_bonus_costs",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_bonus_costs_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_bonus_costs_period",
        "unique": false,
        "columns": [
          "year",
          "month"
        ]
      },
      {
        "name": "ix_hr_bonus_costs_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_bonus_costs_tenant_user_period",
        "unique": false,
        "columns": [
          "TenantId",
          "user_id",
          "year",
          "month"
        ]
      },
      {
        "name": "ix_hr_bonus_costs_user",
        "unique": false,
        "columns": [
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "kind",
        "def": "varchar(40) DEFAULT 'bonus' NOT NULL"
      },
      {
        "name": "category",
        "def": "varchar(80)"
      },
      {
        "name": "label",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "amount",
        "def": "numeric(14, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "frequency",
        "def": "varchar(20) DEFAULT 'monthly' NOT NULL"
      },
      {
        "name": "year",
        "def": "integer NOT NULL"
      },
      {
        "name": "month",
        "def": "integer NOT NULL"
      },
      {
        "name": "affects_payroll",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "subject_to_cnss",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "notes",
        "def": "text"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "created_by",
        "def": "integer"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_cnss_rates",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_cnss_rates_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_cnss_rates_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "effective_from",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "employee_rate",
        "def": "numeric(8, 6) DEFAULT '0.0918' NOT NULL"
      },
      {
        "name": "employer_rate",
        "def": "numeric(8, 6) DEFAULT '0.1657' NOT NULL"
      },
      {
        "name": "css_rate",
        "def": "numeric(8, 6) DEFAULT '0.01' NOT NULL"
      },
      {
        "name": "salary_ceiling",
        "def": "numeric(14, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "abattement_head_of_family",
        "def": "numeric(14, 3) DEFAULT '150' NOT NULL"
      },
      {
        "name": "abattement_per_child",
        "def": "numeric(14, 3) DEFAULT '100' NOT NULL"
      },
      {
        "name": "irpp_brackets_json",
        "def": "text"
      },
      {
        "name": "is_active",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "notes",
        "def": "varchar(300)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "irpp_brackets",
        "def": "text"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_departments",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_departments_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_departments_parent",
        "unique": false,
        "columns": [
          "parent_id"
        ]
      },
      {
        "name": "ix_hr_departments_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_departments_tenant_name",
        "unique": false,
        "columns": [
          "TenantId",
          "name"
        ]
      },
      {
        "name": "ix_hr_departments_tenantid",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "name",
        "def": "varchar(150) NOT NULL"
      },
      {
        "name": "code",
        "def": "varchar(50)"
      },
      {
        "name": "parent_id",
        "def": "integer"
      },
      {
        "name": "manager_id",
        "def": "integer"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "position",
        "def": "integer"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_employee_documents",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_employee_documents_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_employee_documents_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_employee_documents_user",
        "unique": false,
        "columns": [
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "doc_type",
        "def": "varchar(40) DEFAULT 'other' NOT NULL"
      },
      {
        "name": "title",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "file_url",
        "def": "varchar(1000) NOT NULL"
      },
      {
        "name": "file_name",
        "def": "varchar(300)"
      },
      {
        "name": "mime_type",
        "def": "varchar(120)"
      },
      {
        "name": "file_size",
        "def": "bigint"
      },
      {
        "name": "issued_date",
        "def": "timestamp"
      },
      {
        "name": "expires_at",
        "def": "timestamp"
      },
      {
        "name": "uploaded_by",
        "def": "integer"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_employee_salary_configs",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_employee_salary_configs_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_employee_salary_configs_tenant_user",
        "unique": true,
        "columns": [
          "TenantId",
          "user_id"
        ]
      },
      {
        "name": "ix_hr_employee_salary_configs_tenantid",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_salary_configs_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_salary_configs_user",
        "unique": false,
        "columns": [
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "gross_salary",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "is_head_of_family",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "children_count",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "custom_deductions",
        "def": "numeric(18, 3)"
      },
      {
        "name": "bank_account",
        "def": "varchar(100)"
      },
      {
        "name": "cnss_number",
        "def": "varchar(100)"
      },
      {
        "name": "hire_date",
        "def": "date"
      },
      {
        "name": "department",
        "def": "varchar(100)"
      },
      {
        "name": "position",
        "def": "varchar(100)"
      },
      {
        "name": "employment_type",
        "def": "varchar(50) DEFAULT 'full_time' NOT NULL"
      },
      {
        "name": "cin",
        "def": "varchar(50)"
      },
      {
        "name": "birth_date",
        "def": "date"
      },
      {
        "name": "marital_status",
        "def": "varchar(20)"
      },
      {
        "name": "address_line1",
        "def": "varchar(200)"
      },
      {
        "name": "address_line2",
        "def": "varchar(200)"
      },
      {
        "name": "city",
        "def": "varchar(100)"
      },
      {
        "name": "postal_code",
        "def": "varchar(20)"
      },
      {
        "name": "emergency_contact_name",
        "def": "varchar(200)"
      },
      {
        "name": "emergency_contact_phone",
        "def": "varchar(30)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "contract_type",
        "def": "varchar(20)"
      },
      {
        "name": "contract_end_date",
        "def": "date"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_goals",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_goals_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_goals_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_goals_tenant_cycle",
        "unique": false,
        "columns": [
          "TenantId",
          "cycle_id"
        ]
      },
      {
        "name": "ix_hr_goals_tenant_status",
        "unique": false,
        "columns": [
          "TenantId",
          "status"
        ]
      },
      {
        "name": "ix_hr_goals_tenant_user",
        "unique": false,
        "columns": [
          "TenantId",
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "cycle_id",
        "def": "integer"
      },
      {
        "name": "title",
        "def": "varchar(250) NOT NULL"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "category",
        "def": "varchar(40) DEFAULT 'smart' NOT NULL"
      },
      {
        "name": "weight",
        "def": "numeric(5, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "target_value",
        "def": "varchar(120)"
      },
      {
        "name": "progress",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(30) DEFAULT 'not_started' NOT NULL"
      },
      {
        "name": "due_date",
        "def": "timestamp"
      },
      {
        "name": "score",
        "def": "numeric(4, 2)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "created_by",
        "def": "integer"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_interviews",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_interviews_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_interviews_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_interviews_tenant_applicant",
        "unique": false,
        "columns": [
          "TenantId",
          "applicant_id"
        ]
      },
      {
        "name": "ix_hr_interviews_tenant_scheduled",
        "unique": false,
        "columns": [
          "TenantId",
          "scheduled_at"
        ]
      },
      {
        "name": "ix_hr_interviews_tenant_status",
        "unique": false,
        "columns": [
          "TenantId",
          "status"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "applicant_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "kind",
        "def": "varchar(30) DEFAULT 'phone' NOT NULL"
      },
      {
        "name": "scheduled_at",
        "def": "timestamp NOT NULL"
      },
      {
        "name": "duration_minutes",
        "def": "integer DEFAULT 45 NOT NULL"
      },
      {
        "name": "interviewer_user_id",
        "def": "integer"
      },
      {
        "name": "location",
        "def": "varchar(200)"
      },
      {
        "name": "meeting_url",
        "def": "varchar(500)"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'scheduled' NOT NULL"
      },
      {
        "name": "score",
        "def": "integer"
      },
      {
        "name": "feedback",
        "def": "text"
      },
      {
        "name": "recommendation",
        "def": "varchar(20)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "created_by",
        "def": "integer"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "fk_hr_interviews_applicant",
        "to": "hr_applicants",
        "col": "applicant_id"
      }
    ]
  },
  {
    "name": "hr_job_openings",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_job_openings_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_job_openings_department",
        "unique": false,
        "columns": [
          "department_id"
        ]
      },
      {
        "name": "ix_hr_job_openings_status",
        "unique": false,
        "columns": [
          "status"
        ]
      },
      {
        "name": "ix_hr_job_openings_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_job_openings_tenant_status",
        "unique": false,
        "columns": [
          "TenantId",
          "status"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "title",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "department",
        "def": "varchar(150)"
      },
      {
        "name": "location",
        "def": "varchar(150)"
      },
      {
        "name": "employment_type",
        "def": "varchar(40) DEFAULT 'full_time' NOT NULL"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "requirements",
        "def": "text"
      },
      {
        "name": "salary_min",
        "def": "numeric(14, 3)"
      },
      {
        "name": "salary_max",
        "def": "numeric(14, 3)"
      },
      {
        "name": "currency",
        "def": "varchar(10) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "headcount",
        "def": "integer DEFAULT 1 NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'open' NOT NULL"
      },
      {
        "name": "hiring_manager_id",
        "def": "integer"
      },
      {
        "name": "opened_at",
        "def": "timestamp"
      },
      {
        "name": "closed_at",
        "def": "timestamp"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "created_by",
        "def": "integer"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "tenant_id",
        "def": "integer"
      },
      {
        "name": "department_id",
        "def": "integer"
      },
      {
        "name": "contract_type",
        "def": "varchar(20)"
      },
      {
        "name": "seniority",
        "def": "varchar(20)"
      },
      {
        "name": "openings_count",
        "def": "integer DEFAULT 1 NOT NULL"
      },
      {
        "name": "hiring_manager_user_id",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_leave_balances",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_leave_balances_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_leave_balances_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_leave_balances_tenant_user_year_type",
        "unique": true,
        "columns": [
          "TenantId",
          "user_id",
          "year",
          "leave_type"
        ]
      },
      {
        "name": "ix_hr_leave_balances_tenantid",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "year",
        "def": "integer NOT NULL"
      },
      {
        "name": "leave_type",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "annual_allowance",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "used",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "pending",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "remaining",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_leaves",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_leaves_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_leaves_period",
        "unique": false,
        "columns": [
          "start_date",
          "end_date"
        ]
      },
      {
        "name": "ix_hr_leaves_status",
        "unique": false,
        "columns": [
          "status"
        ]
      },
      {
        "name": "ix_hr_leaves_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_leaves_user",
        "unique": false,
        "columns": [
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "leave_type",
        "def": "varchar(40) DEFAULT 'annual' NOT NULL"
      },
      {
        "name": "start_date",
        "def": "date NOT NULL"
      },
      {
        "name": "end_date",
        "def": "date NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "reason",
        "def": "text"
      },
      {
        "name": "approved_by",
        "def": "integer"
      },
      {
        "name": "approved_at",
        "def": "timestamp"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_payroll_entries",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_payroll_entries_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_payroll_entries_run",
        "unique": false,
        "columns": [
          "payroll_run_id"
        ]
      },
      {
        "name": "ix_hr_payroll_entries_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_payroll_entries_tenant_run_user",
        "unique": false,
        "columns": [
          "TenantId",
          "payroll_run_id",
          "user_id"
        ]
      },
      {
        "name": "ix_hr_payroll_entries_tenantid",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_payroll_entries_user",
        "unique": false,
        "columns": [
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "payroll_run_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "gross_salary",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "cnss",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "taxable_gross",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "abattement",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "taxable_base",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "irpp",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "css",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "net_salary",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "worked_days",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "total_hours",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "overtime_hours",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "leave_days",
        "def": "numeric(10, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "details",
        "def": "text DEFAULT '{}' NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "fk_hr_payroll_entries_run",
        "to": "hr_payroll_runs",
        "col": "payroll_run_id"
      }
    ]
  },
  {
    "name": "hr_payroll_runs",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_payroll_runs_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_payroll_runs_period",
        "unique": false,
        "columns": [
          "year",
          "month"
        ]
      },
      {
        "name": "ix_hr_payroll_runs_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_payroll_runs_tenant_year_month",
        "unique": false,
        "columns": [
          "TenantId",
          "year",
          "month"
        ]
      },
      {
        "name": "ix_hr_payroll_runs_tenantid",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "month",
        "def": "integer NOT NULL"
      },
      {
        "name": "year",
        "def": "integer NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'draft' NOT NULL"
      },
      {
        "name": "total_gross",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "total_net",
        "def": "numeric(18, 3) DEFAULT '0' NOT NULL"
      },
      {
        "name": "created_by",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "confirmed_at",
        "def": "timestamp"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_performance_reviews",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_performance_reviews_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_perf_reviews_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_perf_reviews_tenant_cycle",
        "unique": false,
        "columns": [
          "TenantId",
          "cycle_id"
        ]
      },
      {
        "name": "ix_hr_perf_reviews_tenant_status",
        "unique": false,
        "columns": [
          "TenantId",
          "status"
        ]
      },
      {
        "name": "ix_hr_perf_reviews_tenant_user",
        "unique": false,
        "columns": [
          "TenantId",
          "user_id"
        ]
      },
      {
        "name": "ux_hr_perf_reviews_tenant_cycle_user",
        "unique": true,
        "columns": [
          "TenantId",
          "cycle_id",
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "cycle_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "reviewer_user_id",
        "def": "integer"
      },
      {
        "name": "status",
        "def": "varchar(30) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "self_assessment",
        "def": "text"
      },
      {
        "name": "self_assessment_submitted_at",
        "def": "timestamp"
      },
      {
        "name": "manager_comments",
        "def": "text"
      },
      {
        "name": "overall_score",
        "def": "numeric(4, 2)"
      },
      {
        "name": "rating",
        "def": "varchar(30)"
      },
      {
        "name": "strengths",
        "def": "text"
      },
      {
        "name": "improvements",
        "def": "text"
      },
      {
        "name": "development_plan",
        "def": "text"
      },
      {
        "name": "completed_at",
        "def": "timestamp"
      },
      {
        "name": "acknowledged_at",
        "def": "timestamp"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "created_by",
        "def": "integer"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_public_holidays",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_public_holidays_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_public_holidays_date",
        "unique": false,
        "columns": [
          "date"
        ]
      },
      {
        "name": "ix_hr_public_holidays_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "date",
        "def": "date NOT NULL"
      },
      {
        "name": "name",
        "def": "varchar(150) NOT NULL"
      },
      {
        "name": "category",
        "def": "varchar(50) DEFAULT 'civil' NOT NULL"
      },
      {
        "name": "is_recurring",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_review_cycles",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_review_cycles_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_review_cycles_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_review_cycles_tenant_status",
        "unique": false,
        "columns": [
          "TenantId",
          "status"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "name",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "frequency",
        "def": "varchar(20) DEFAULT 'annual' NOT NULL"
      },
      {
        "name": "period_start",
        "def": "timestamp NOT NULL"
      },
      {
        "name": "period_end",
        "def": "timestamp NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'draft' NOT NULL"
      },
      {
        "name": "self_assessment_required",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "created_by",
        "def": "integer"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "is_deleted",
        "def": "boolean DEFAULT false NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "hr_salary_history",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "hr_salary_history_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      },
      {
        "name": "ix_hr_salary_history_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ix_hr_salary_history_user",
        "unique": false,
        "columns": [
          "user_id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "previous_gross",
        "def": "numeric(14, 3)"
      },
      {
        "name": "new_gross",
        "def": "numeric(14, 3) NOT NULL"
      },
      {
        "name": "currency",
        "def": "varchar(10) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "effective_date",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "reason",
        "def": "varchar(300)"
      },
      {
        "name": "changed_by",
        "def": "integer"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "InstallationNotes",
    "category": "Installations",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_installationnotes_installationid",
        "unique": false,
        "columns": [
          "InstallationId"
        ]
      },
      {
        "name": "InstallationNotes_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "IX_InstallationNotes_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "InstallationId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Note",
        "def": "varchar(2000) NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "InstallationNotes_InstallationId_fkey",
        "to": "Installations",
        "col": "InstallationId"
      }
    ]
  },
  {
    "name": "Installations",
    "category": "Installations",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_installations_matricule",
        "unique": false,
        "columns": [
          "Matricule"
        ]
      },
      {
        "name": "IX_Installations_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Installations",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Installations_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "InstallationNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "ContactId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SiteAddress",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "InstallationType",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "InstallationDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "WarrantyExpiry",
        "def": "timestamp with time zone"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "Name",
        "def": "varchar(200)"
      },
      {
        "name": "Model",
        "def": "varchar(200)"
      },
      {
        "name": "Manufacturer",
        "def": "varchar(200)"
      },
      {
        "name": "Category",
        "def": "varchar(100)"
      },
      {
        "name": "Type",
        "def": "varchar(50)"
      },
      {
        "name": "WarrantyFrom",
        "def": "timestamp with time zone"
      },
      {
        "name": "SerialNumber",
        "def": "varchar(100)"
      },
      {
        "name": "Matricule",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "InventoryTransactions",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_InventoryTransactions_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_InventoryTransactions",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"InventoryTransactions_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "ArticleId",
        "def": "integer NOT NULL"
      },
      {
        "name": "TransactionType",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "Quantity",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "TransactionDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "Reference",
        "def": "varchar(100)"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Locations",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_Locations_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Locations",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Locations_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "LookupItems",
    "category": "Lookups",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_LookupItems_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_LookupItems",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"LookupItems_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Category",
        "def": "varchar(50)"
      },
      {
        "name": "Value",
        "def": "varchar(100)"
      },
      {
        "name": "DisplayOrder",
        "def": "integer"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "LookupType",
        "def": "varchar(50)"
      },
      {
        "name": "Name",
        "def": "varchar(100)"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "Color",
        "def": "varchar(20)"
      },
      {
        "name": "SortOrder",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "CreatedUser",
        "def": "varchar(100) DEFAULT 'system'"
      },
      {
        "name": "ModifyUser",
        "def": "varchar(100)"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp DEFAULT now()"
      },
      {
        "name": "IsDefault",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "IsPaid",
        "def": "boolean"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "MainAdminUsers",
    "category": "Identity & Auth",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_mainadmin_email_lower",
        "unique": false,
        "columns": [
          "lower((Email"
        ]
      },
      {
        "name": "idx_mainadminusers_email",
        "unique": false,
        "columns": [
          "Email"
        ]
      },
      {
        "name": "idx_mainadminusers_otpcode",
        "unique": false,
        "columns": [
          "OtpCode"
        ]
      },
      {
        "name": "idx_mainadminusers_resettoken",
        "unique": false,
        "columns": [
          "PasswordResetToken"
        ]
      },
      {
        "name": "PK_MainAdminUsers",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"MainAdminUsers_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Username",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Email",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "PasswordHash",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "FirstName",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "LastName",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "LastLoginDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "OnboardingCompleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "AccessToken",
        "def": "text"
      },
      {
        "name": "RefreshToken",
        "def": "text"
      },
      {
        "name": "TokenExpiresAt",
        "def": "timestamp"
      },
      {
        "name": "PhoneNumber",
        "def": "varchar(20)"
      },
      {
        "name": "Country",
        "def": "varchar(2)"
      },
      {
        "name": "Industry",
        "def": "varchar(100) DEFAULT ''"
      },
      {
        "name": "CompanyName",
        "def": "varchar(255)"
      },
      {
        "name": "CompanyWebsite",
        "def": "varchar(500)"
      },
      {
        "name": "PreferencesJson",
        "def": "text"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp"
      },
      {
        "name": "LastLoginAt",
        "def": "timestamp"
      },
      {
        "name": "CompanyLogoUrl",
        "def": "varchar(500) DEFAULT NULL"
      },
      {
        "name": "ProfilePictureUrl",
        "def": "varchar(500) DEFAULT NULL"
      },
      {
        "name": "OtpCode",
        "def": "varchar(6)"
      },
      {
        "name": "OtpExpiresAt",
        "def": "timestamp"
      },
      {
        "name": "PasswordResetToken",
        "def": "varchar(500)"
      },
      {
        "name": "PasswordResetTokenExpiresAt",
        "def": "timestamp"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "MaintenanceHistory",
    "category": "Installations",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_MaintenanceHistory_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_MaintenanceHistory",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"MaintenanceHistory_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "InstallationId",
        "def": "integer NOT NULL"
      },
      {
        "name": "MaintenanceDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "MaintenanceType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "PerformedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Cost",
        "def": "numeric(18, 2)"
      },
      {
        "name": "NextMaintenanceDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "MaterialUsage",
    "category": "Service Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_MaterialUsage_DispatchId",
        "unique": false,
        "columns": [
          "DispatchId"
        ]
      },
      {
        "name": "IX_MaterialUsage_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_MaterialUsage",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"MaterialUsage_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "DispatchId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ArticleId",
        "def": "integer"
      },
      {
        "name": "Description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "Quantity",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "UnitPrice",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "TotalPrice",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "UsedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "RecordedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Unit",
        "def": "varchar(20) DEFAULT 'piece' NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Notes",
    "category": "Documents",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_Notes_DispatchId",
        "unique": false,
        "columns": [
          "DispatchId"
        ]
      },
      {
        "name": "IX_Notes_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Notes",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Notes_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "DispatchId",
        "def": "integer NOT NULL"
      },
      {
        "name": "NoteText",
        "def": "text NOT NULL"
      },
      {
        "name": "NoteType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "IsInternal",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Notifications",
    "category": "Notifications & Email",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_Notifications_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "Notifications_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Title",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "Type",
        "def": "varchar(50) DEFAULT 'info' NOT NULL"
      },
      {
        "name": "Category",
        "def": "varchar(50) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "Link",
        "def": "varchar(255)"
      },
      {
        "name": "RelatedEntityId",
        "def": "integer"
      },
      {
        "name": "RelatedEntityType",
        "def": "varchar(50)"
      },
      {
        "name": "IsRead",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "ReadAt",
        "def": "timestamp"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "NumberingSettings",
    "category": "Numbering",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_numbering_settings_entity",
        "unique": false,
        "columns": [
          "entity_name"
        ]
      },
      {
        "name": "IX_NumberingSettings_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "NumberingSettings_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "uq_numbering_settings_entity",
        "unique": true,
        "columns": [
          "entity_name"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "entity_name",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "is_enabled",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "template",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "strategy",
        "def": "varchar(30) DEFAULT 'atomic_counter' NOT NULL"
      },
      {
        "name": "reset_frequency",
        "def": "varchar(20) DEFAULT 'yearly' NOT NULL"
      },
      {
        "name": "start_value",
        "def": "integer DEFAULT 1 NOT NULL"
      },
      {
        "name": "padding",
        "def": "integer DEFAULT 6 NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "NumberSequences",
    "category": "Numbering",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "entity_name",
        "period_key"
      ]
    ],
    "indexes": [
      {
        "name": "idx_number_sequences_entity_period",
        "unique": false,
        "columns": [
          "entity_name",
          "period_key"
        ]
      },
      {
        "name": "IX_NumberSequences_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "NumberSequences_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "uq_number_sequences_entity_period",
        "unique": true,
        "columns": [
          "entity_name",
          "period_key"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "entity_name",
        "def": "varchar(50) NOT NULL UNIQUE"
      },
      {
        "name": "period_key",
        "def": "varchar(20) DEFAULT 'all' NOT NULL UNIQUE"
      },
      {
        "name": "last_value",
        "def": "bigint DEFAULT 0 NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "offer_activities",
    "category": "Sales • Offers",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "offer_activities_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "offer_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "type",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "details",
        "def": "text"
      },
      {
        "name": "old_value",
        "def": "varchar(255)"
      },
      {
        "name": "new_value",
        "def": "varchar(255)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "created_by",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "created_by_name",
        "def": "varchar(255) NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_offer_activities_offers",
        "to": "offers",
        "col": "offer_id"
      }
    ]
  },
  {
    "name": "offer_items",
    "category": "Sales • Offers",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "offer_items_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "offer_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "type",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "article_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "item_name",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "item_code",
        "def": "varchar(100)"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "quantity",
        "def": "numeric(10, 2) DEFAULT '1' NOT NULL"
      },
      {
        "name": "unit_price",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "total_price",
        "def": "numeric(15, 2) GENERATED ALWAYS AS (((quantity * unit_price) * ((1)::numeric - (COALESCE(discount, (0)::numeric) / (100)::numeric)))) STORED"
      },
      {
        "name": "discount",
        "def": "numeric(15, 2) DEFAULT '0'"
      },
      {
        "name": "discount_type",
        "def": "varchar(20) DEFAULT 'percentage'"
      },
      {
        "name": "installation_id",
        "def": "varchar(50)"
      },
      {
        "name": "installation_name",
        "def": "varchar(255)"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_offer_items_offers",
        "to": "offers",
        "col": "offer_id"
      }
    ]
  },
  {
    "name": "OfferActivities",
    "category": "Sales • Offers",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_OfferActivities_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_OfferActivities",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"OfferActivities_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "OfferId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ActivityType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "ActivityDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "PerformedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "OfferItems",
    "category": "Sales • Offers",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_OfferItems_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_OfferItems",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"OfferItems_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "OfferId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ArticleId",
        "def": "integer"
      },
      {
        "name": "Description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "Quantity",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "UnitPrice",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "Discount",
        "def": "numeric(5, 2)"
      },
      {
        "name": "TaxRate",
        "def": "numeric(5, 2) NOT NULL"
      },
      {
        "name": "LineTotal",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "DisplayOrder",
        "def": "integer NOT NULL"
      },
      {
        "name": "Type",
        "def": "varchar(20) DEFAULT 'article'"
      },
      {
        "name": "ItemName",
        "def": "varchar(255)"
      },
      {
        "name": "ItemCode",
        "def": "varchar(100)"
      },
      {
        "name": "InstallationId",
        "def": "varchar(50)"
      },
      {
        "name": "InstallationName",
        "def": "varchar(255)"
      },
      {
        "name": "DiscountType",
        "def": "varchar(20) DEFAULT 'percentage'"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "offers",
    "category": "Sales • Offers",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_offers_contact_status",
        "unique": false,
        "columns": [
          "contact_id",
          "status"
        ]
      },
      {
        "name": "idx_offers_created_desc",
        "unique": false,
        "columns": [
          "created_at"
        ]
      },
      {
        "name": "offers_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "title",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "contact_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "amount",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "currency",
        "def": "varchar(3) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "taxes",
        "def": "numeric(15, 2) DEFAULT '0'"
      },
      {
        "name": "discount",
        "def": "numeric(15, 2) DEFAULT '0'"
      },
      {
        "name": "total_amount",
        "def": "numeric(15, 2) GENERATED ALWAYS AS (((amount + COALESCE(taxes, (0)::numeric)) - COALESCE(discount, (0)::numeric))) STORED"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'draft' NOT NULL"
      },
      {
        "name": "category",
        "def": "varchar(50)"
      },
      {
        "name": "source",
        "def": "varchar(50)"
      },
      {
        "name": "billing_address",
        "def": "text"
      },
      {
        "name": "billing_postal_code",
        "def": "varchar(20)"
      },
      {
        "name": "billing_country",
        "def": "varchar(100)"
      },
      {
        "name": "delivery_address",
        "def": "text"
      },
      {
        "name": "delivery_postal_code",
        "def": "varchar(20)"
      },
      {
        "name": "delivery_country",
        "def": "varchar(100)"
      },
      {
        "name": "valid_until",
        "def": "timestamp"
      },
      {
        "name": "assigned_to",
        "def": "varchar(50)"
      },
      {
        "name": "assigned_to_name",
        "def": "varchar(255)"
      },
      {
        "name": "tags",
        "def": "text[]"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "created_by",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "last_activity",
        "def": "timestamp"
      },
      {
        "name": "converted_to_sale_id",
        "def": "varchar(50)"
      },
      {
        "name": "converted_to_service_order_id",
        "def": "varchar(50)"
      },
      {
        "name": "converted_at",
        "def": "timestamp"
      },
      {
        "name": "tax_type",
        "def": "varchar(20) DEFAULT 'percentage'"
      },
      {
        "name": "fiscal_stamp",
        "def": "numeric(10, 3) DEFAULT '1.000'"
      },
      {
        "name": "paid_amount",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "payment_status",
        "def": "varchar(20) DEFAULT 'unpaid' NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_offers_Contacts",
        "to": "Contacts",
        "col": "contact_id"
      }
    ]
  },
  {
    "name": "Offers",
    "category": "Sales • Offers",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_offers_contact_has_location",
        "unique": false,
        "columns": [
          "ContactHasLocation"
        ]
      },
      {
        "name": "ix_offers_tenant_projectid",
        "unique": false,
        "columns": [
          "TenantId",
          "ProjectId"
        ]
      },
      {
        "name": "IX_Offers_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Offers",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "uq_offers_offer_number",
        "unique": true,
        "columns": [
          "OfferNumber"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Offers_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "OfferNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "ContactId",
        "def": "integer NOT NULL"
      },
      {
        "name": "OfferDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "ValidUntil",
        "def": "timestamp with time zone"
      },
      {
        "name": "Status",
        "def": "text NOT NULL"
      },
      {
        "name": "TotalAmount",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "DiscountPercent",
        "def": "numeric(5, 2)"
      },
      {
        "name": "DiscountAmount",
        "def": "numeric(18, 2)"
      },
      {
        "name": "TaxAmount",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "GrandTotal",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "TermsAndConditions",
        "def": "text"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "Title",
        "def": "varchar(255)"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Currency",
        "def": "varchar(3) DEFAULT 'TND'"
      },
      {
        "name": "Taxes",
        "def": "numeric(18, 2) DEFAULT '0'"
      },
      {
        "name": "Discount",
        "def": "numeric(18, 2) DEFAULT '0'"
      },
      {
        "name": "Category",
        "def": "varchar(50)"
      },
      {
        "name": "Source",
        "def": "varchar(50)"
      },
      {
        "name": "BillingAddress",
        "def": "text"
      },
      {
        "name": "BillingPostalCode",
        "def": "varchar(20)"
      },
      {
        "name": "BillingCountry",
        "def": "varchar(100)"
      },
      {
        "name": "DeliveryAddress",
        "def": "text"
      },
      {
        "name": "DeliveryPostalCode",
        "def": "varchar(20)"
      },
      {
        "name": "DeliveryCountry",
        "def": "varchar(100)"
      },
      {
        "name": "AssignedTo",
        "def": "varchar(50)"
      },
      {
        "name": "AssignedToName",
        "def": "varchar(255)"
      },
      {
        "name": "Tags",
        "def": "text[]"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now()"
      },
      {
        "name": "LastActivity",
        "def": "timestamp with time zone"
      },
      {
        "name": "ConvertedToSaleId",
        "def": "varchar(50)"
      },
      {
        "name": "ConvertedToServiceOrderId",
        "def": "varchar(50)"
      },
      {
        "name": "ConvertedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "TaxType",
        "def": "varchar(20) DEFAULT 'percentage'"
      },
      {
        "name": "FiscalStamp",
        "def": "numeric(10, 3) DEFAULT '1.000'"
      },
      {
        "name": "ContactLatitude",
        "def": "numeric(10, 7)"
      },
      {
        "name": "ContactLongitude",
        "def": "numeric(10, 7)"
      },
      {
        "name": "ContactHasLocation",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "CreatedByName",
        "def": "varchar(255)"
      },
      {
        "name": "DiscountType",
        "def": "varchar(20) DEFAULT 'fixed'"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "SentCount",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "ProjectId",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "OfflineHydrationPreferences",
    "category": "Platform",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_OfflineHydrationPreferences_TenantId_UserId",
        "unique": true,
        "columns": [
          "TenantId",
          "UserId"
        ]
      },
      {
        "name": "OfflineHydrationPreferences_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name \"OfflineHydrationPreferences_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ModulesJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "payment_item_allocations",
    "category": "Payments",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_payment_item_allocations_item",
        "unique": false,
        "columns": [
          "item_id"
        ]
      },
      {
        "name": "idx_payment_item_allocations_payment",
        "unique": false,
        "columns": [
          "payment_id"
        ]
      },
      {
        "name": "IX_payment_item_allocations_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "payment_item_allocations_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "payment_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "item_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "item_name",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "allocated_amount",
        "def": "numeric(15, 2) NOT NULL"
      },
      {
        "name": "item_total",
        "def": "numeric(15, 2) NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "payment_item_allocations_payment_id_fkey",
        "to": "payments",
        "col": "payment_id"
      }
    ]
  },
  {
    "name": "payment_plan_installments",
    "category": "Payments",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_payment_plan_installments_plan",
        "unique": false,
        "columns": [
          "plan_id"
        ]
      },
      {
        "name": "IX_payment_plan_installments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "payment_plan_installments_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "plan_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "installment_number",
        "def": "integer NOT NULL"
      },
      {
        "name": "amount",
        "def": "numeric(15, 2) NOT NULL"
      },
      {
        "name": "due_date",
        "def": "timestamp NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "paid_amount",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "paid_at",
        "def": "timestamp"
      },
      {
        "name": "notes",
        "def": "text"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "payment_plan_installments_plan_id_fkey",
        "to": "payment_plans",
        "col": "plan_id"
      }
    ]
  },
  {
    "name": "payment_plans",
    "category": "Payments",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_payment_plans_entity",
        "unique": false,
        "columns": [
          "entity_type",
          "entity_id"
        ]
      },
      {
        "name": "IX_payment_plans_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "payment_plans_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "entity_type",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "entity_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "name",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "total_amount",
        "def": "numeric(15, 2) NOT NULL"
      },
      {
        "name": "currency",
        "def": "varchar(3) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "installment_count",
        "def": "integer DEFAULT 2 NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'active' NOT NULL"
      },
      {
        "name": "created_by",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "payments",
    "category": "Payments",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_payments_date",
        "unique": false,
        "columns": [
          "payment_date"
        ]
      },
      {
        "name": "idx_payments_entity",
        "unique": false,
        "columns": [
          "entity_type",
          "entity_id"
        ]
      },
      {
        "name": "idx_payments_installment",
        "unique": false,
        "columns": [
          "installment_id"
        ]
      },
      {
        "name": "idx_payments_plan",
        "unique": false,
        "columns": [
          "plan_id"
        ]
      },
      {
        "name": "IX_payments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "payments_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "entity_type",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "entity_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "plan_id",
        "def": "varchar(50)"
      },
      {
        "name": "installment_id",
        "def": "varchar(50)"
      },
      {
        "name": "amount",
        "def": "numeric(15, 2) NOT NULL"
      },
      {
        "name": "currency",
        "def": "varchar(3) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "payment_method",
        "def": "varchar(50) DEFAULT 'cash' NOT NULL"
      },
      {
        "name": "payment_reference",
        "def": "varchar(255)"
      },
      {
        "name": "payment_date",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'completed' NOT NULL"
      },
      {
        "name": "notes",
        "def": "text"
      },
      {
        "name": "receipt_number",
        "def": "varchar(100)"
      },
      {
        "name": "created_by",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "created_by_name",
        "def": "varchar(255)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "payments_installment_id_fkey",
        "to": "payment_plan_installments",
        "col": "installment_id"
      },
      {
        "from": "payments_plan_id_fkey",
        "to": "payment_plans",
        "col": "plan_id"
      }
    ]
  },
  {
    "name": "PdfSettings",
    "category": "Documents",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_pdf_settings_module",
        "unique": false,
        "columns": [
          "Module"
        ]
      },
      {
        "name": "IX_PdfSettings_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PdfSettings_Module_key",
        "unique": true,
        "columns": [
          "Module"
        ]
      },
      {
        "name": "PdfSettings_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "Module",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "SettingsJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp DEFAULT now()"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp DEFAULT now()"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ProjectActivities",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ProjectActivities_ActionType",
        "unique": false,
        "columns": [
          "ActionType"
        ]
      },
      {
        "name": "IX_ProjectActivities_CreatedBy",
        "unique": false,
        "columns": [
          "CreatedBy"
        ]
      },
      {
        "name": "IX_ProjectActivities_CreatedDate",
        "unique": false,
        "columns": [
          "CreatedDate"
        ]
      },
      {
        "name": "IX_ProjectActivities_ProjectId",
        "unique": false,
        "columns": [
          "ProjectId"
        ]
      },
      {
        "name": "IX_ProjectActivities_ProjectId_CreatedDate",
        "unique": false,
        "columns": [
          "ProjectId",
          "CreatedDate"
        ]
      },
      {
        "name": "IX_ProjectActivities_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ProjectActivities_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ProjectId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ActionType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "Details",
        "def": "varchar(1000)"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "RelatedEntityId",
        "def": "integer"
      },
      {
        "name": "RelatedEntityType",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "ProjectActivities_ProjectId_fkey",
        "to": "Projects",
        "col": "ProjectId"
      }
    ]
  },
  {
    "name": "ProjectNotes",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ProjectNotes_CreatedBy",
        "unique": false,
        "columns": [
          "CreatedBy"
        ]
      },
      {
        "name": "IX_ProjectNotes_CreatedDate",
        "unique": false,
        "columns": [
          "CreatedDate"
        ]
      },
      {
        "name": "IX_ProjectNotes_ProjectId",
        "unique": false,
        "columns": [
          "ProjectId"
        ]
      },
      {
        "name": "IX_ProjectNotes_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ProjectNotes_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ProjectId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Content",
        "def": "text NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(255)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "ProjectNotes_ProjectId_fkey",
        "to": "Projects",
        "col": "ProjectId"
      }
    ]
  },
  {
    "name": "Projects",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_Projects_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Projects",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Projects_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "StartDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "EndDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "Status",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "Priority",
        "def": "varchar(20)"
      },
      {
        "name": "ContactId",
        "def": "integer"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TeamMembers",
        "def": "varchar(1000)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ProjectSettings",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ix_projectsettings_tenantid_unique",
        "unique": true,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ProjectSettings_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "SettingsJson",
        "def": "text DEFAULT '{}' NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ProjectTasks",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ProjectTasks_ProjectId",
        "unique": false,
        "columns": [
          "ProjectId"
        ]
      },
      {
        "name": "IX_ProjectTasks_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_ProjectTasks",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"ProjectTasks_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Title",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Priority",
        "def": "varchar(20)"
      },
      {
        "name": "DueDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "AssignedUserId",
        "def": "integer"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "EstimatedHours",
        "def": "numeric(18, 2)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "RelatedEntityType",
        "def": "varchar(50)"
      },
      {
        "name": "RelatedEntityId",
        "def": "integer"
      },
      {
        "name": "TaskType",
        "def": "varchar(50) DEFAULT 'follow-up' NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(50) DEFAULT 'open' NOT NULL"
      },
      {
        "name": "ProjectId",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "PurchaseActivities",
    "category": "Purchases",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_PurchaseActivities_Entity",
        "unique": false,
        "columns": [
          "TenantId",
          "EntityType",
          "EntityId"
        ]
      },
      {
        "name": "IX_PurchaseActivities_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PurchaseActivities_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "EntityType",
        "def": "varchar(30) NOT NULL"
      },
      {
        "name": "EntityId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ActivityType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text NOT NULL"
      },
      {
        "name": "OldValue",
        "def": "text"
      },
      {
        "name": "NewValue",
        "def": "text"
      },
      {
        "name": "PerformedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "PerformedByName",
        "def": "varchar(255)"
      },
      {
        "name": "PerformedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "PurchaseOrderItems",
    "category": "Purchases",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_PurchaseOrderItems_POId",
        "unique": false,
        "columns": [
          "PurchaseOrderId"
        ]
      },
      {
        "name": "PurchaseOrderItems_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "PurchaseOrderId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ArticleId",
        "def": "integer"
      },
      {
        "name": "ArticleName",
        "def": "varchar(255)"
      },
      {
        "name": "ArticleNumber",
        "def": "varchar(50)"
      },
      {
        "name": "SupplierRef",
        "def": "varchar(100)"
      },
      {
        "name": "Description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "Quantity",
        "def": "numeric(18, 2) DEFAULT '1' NOT NULL"
      },
      {
        "name": "ReceivedQty",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "UnitPrice",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "TaxRate",
        "def": "numeric(5, 2) DEFAULT '19' NOT NULL"
      },
      {
        "name": "Discount",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "DiscountType",
        "def": "varchar(20) DEFAULT 'percentage' NOT NULL"
      },
      {
        "name": "LineTotal",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "Unit",
        "def": "varchar(20) DEFAULT 'piece' NOT NULL"
      },
      {
        "name": "DisplayOrder",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "PurchaseOrderItems_PurchaseOrderId_fkey",
        "to": "PurchaseOrders",
        "col": "PurchaseOrderId"
      }
    ]
  },
  {
    "name": "PurchaseOrders",
    "category": "Purchases",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_PurchaseOrders_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_PurchaseOrders_Status",
        "unique": false,
        "columns": [
          "TenantId",
          "Status"
        ]
      },
      {
        "name": "IX_PurchaseOrders_SupplierId",
        "unique": false,
        "columns": [
          "TenantId",
          "SupplierId"
        ]
      },
      {
        "name": "IX_PurchaseOrders_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PurchaseOrders_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "OrderNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "SupplierId",
        "def": "integer"
      },
      {
        "name": "SupplierName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "SupplierEmail",
        "def": "varchar(255)"
      },
      {
        "name": "SupplierPhone",
        "def": "varchar(50)"
      },
      {
        "name": "SupplierAddress",
        "def": "varchar(500)"
      },
      {
        "name": "SupplierMatriculeFiscale",
        "def": "varchar(100)"
      },
      {
        "name": "Title",
        "def": "varchar(255)"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Status",
        "def": "varchar(30) DEFAULT 'draft' NOT NULL"
      },
      {
        "name": "OrderDate",
        "def": "date DEFAULT CURRENT_DATE NOT NULL"
      },
      {
        "name": "ExpectedDelivery",
        "def": "date"
      },
      {
        "name": "ActualDelivery",
        "def": "date"
      },
      {
        "name": "Currency",
        "def": "varchar(10) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "SubTotal",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "Discount",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "DiscountType",
        "def": "varchar(20) DEFAULT 'percentage' NOT NULL"
      },
      {
        "name": "TaxAmount",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "FiscalStamp",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "GrandTotal",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "PaymentTerms",
        "def": "varchar(50) DEFAULT 'net30'"
      },
      {
        "name": "PaymentStatus",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "Tags",
        "def": "text"
      },
      {
        "name": "BillingAddress",
        "def": "varchar(500)"
      },
      {
        "name": "DeliveryAddress",
        "def": "varchar(500)"
      },
      {
        "name": "ServiceOrderId",
        "def": "integer"
      },
      {
        "name": "SaleId",
        "def": "integer"
      },
      {
        "name": "ApprovedBy",
        "def": "varchar(255)"
      },
      {
        "name": "ApprovalDate",
        "def": "timestamp"
      },
      {
        "name": "SentToSupplierAt",
        "def": "timestamp"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "CreatedByName",
        "def": "varchar(255)"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(255)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "RecurringTaskLogs",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_RecurringTaskLogs_GeneratedDate",
        "unique": false,
        "columns": [
          "GeneratedDate"
        ]
      },
      {
        "name": "IX_RecurringTaskLogs_RecurringTaskId",
        "unique": false,
        "columns": [
          "RecurringTaskId"
        ]
      },
      {
        "name": "IX_RecurringTaskLogs_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "RecurringTaskLogs_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "RecurringTaskId",
        "def": "integer NOT NULL"
      },
      {
        "name": "GeneratedProjectTaskId",
        "def": "integer"
      },
      {
        "name": "GeneratedDailyTaskId",
        "def": "integer"
      },
      {
        "name": "GeneratedDate",
        "def": "timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "ScheduledFor",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'created' NOT NULL"
      },
      {
        "name": "Notes",
        "def": "varchar(500)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_RecurringTaskLogs_RecurringTasks",
        "to": "RecurringTasks",
        "col": "RecurringTaskId"
      }
    ]
  },
  {
    "name": "RecurringTasks",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_RecurringTasks_DailyTaskId",
        "unique": false,
        "columns": [
          "DailyTaskId"
        ]
      },
      {
        "name": "IX_RecurringTasks_IsActive",
        "unique": false,
        "columns": [
          "IsActive"
        ]
      },
      {
        "name": "IX_RecurringTasks_NextOccurrence",
        "unique": false,
        "columns": [
          "NextOccurrence"
        ]
      },
      {
        "name": "IX_RecurringTasks_ProjectTaskId",
        "unique": false,
        "columns": [
          "ProjectTaskId"
        ]
      },
      {
        "name": "IX_RecurringTasks_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "RecurringTasks_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ProjectTaskId",
        "def": "integer"
      },
      {
        "name": "DailyTaskId",
        "def": "integer"
      },
      {
        "name": "RecurrenceType",
        "def": "varchar(50) DEFAULT 'daily' NOT NULL"
      },
      {
        "name": "DaysOfWeek",
        "def": "varchar(50)"
      },
      {
        "name": "DayOfMonth",
        "def": "integer"
      },
      {
        "name": "MonthOfYear",
        "def": "integer"
      },
      {
        "name": "Interval",
        "def": "integer DEFAULT 1 NOT NULL"
      },
      {
        "name": "StartDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "EndDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "MaxOccurrences",
        "def": "integer"
      },
      {
        "name": "OccurrenceCount",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "NextOccurrence",
        "def": "timestamp with time zone"
      },
      {
        "name": "LastGeneratedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "IsPaused",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_RecurringTasks_DailyTasks",
        "to": "DailyTasks",
        "col": "DailyTaskId"
      },
      {
        "from": "FK_RecurringTasks_ProjectTasks",
        "to": "ProjectTasks",
        "col": "ProjectTaskId"
      }
    ]
  },
  {
    "name": "RolePermissions",
    "category": "Roles & Permissions",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "RoleId",
        "Module",
        "Action"
      ]
    ],
    "indexes": [
      {
        "name": "IX_RolePermissions_Module_Action",
        "unique": false,
        "columns": [
          "Module",
          "Action"
        ]
      },
      {
        "name": "IX_RolePermissions_RoleId",
        "unique": false,
        "columns": [
          "RoleId"
        ]
      },
      {
        "name": "IX_RolePermissions_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "RolePermissions_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "UQ_RolePermissions_Role_Module_Action",
        "unique": true,
        "columns": [
          "RoleId",
          "Module",
          "Action"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "RoleId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "Module",
        "def": "varchar(50) NOT NULL UNIQUE"
      },
      {
        "name": "Action",
        "def": "varchar(50) NOT NULL UNIQUE"
      },
      {
        "name": "Granted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system'"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Roles",
    "category": "Roles & Permissions",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_roles_isactive",
        "unique": false,
        "columns": [
          "IsActive"
        ]
      },
      {
        "name": "idx_roles_name",
        "unique": false,
        "columns": [
          "Name"
        ]
      },
      {
        "name": "IX_Roles_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Roles",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Roles_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp"
      },
      {
        "name": "CreatedUser",
        "def": "varchar(100) DEFAULT 'system'"
      },
      {
        "name": "ModifyUser",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "RoleSkills",
    "category": "Roles & Permissions",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_roleskills_roleid",
        "unique": false,
        "columns": [
          "RoleId"
        ]
      },
      {
        "name": "idx_roleskills_skillid",
        "unique": false,
        "columns": [
          "SkillId"
        ]
      },
      {
        "name": "IX_RoleSkills_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_RoleSkills",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"RoleSkills_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "RoleId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SkillId",
        "def": "integer NOT NULL"
      },
      {
        "name": "RequiredProficiencyLevel",
        "def": "varchar(20)"
      },
      {
        "name": "IsRequired",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "AssignedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "AssignedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "Notes",
        "def": "varchar(500)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "RSRecords",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "InvoiceNumber",
        "PaymentDate",
        "EntityId",
        "EntityType"
      ]
    ],
    "indexes": [
      {
        "name": "ix_rs_entity",
        "unique": false,
        "columns": [
          "EntityType",
          "EntityId"
        ]
      },
      {
        "name": "ix_rs_payment_status",
        "unique": false,
        "columns": [
          "PaymentDate",
          "Status"
        ]
      },
      {
        "name": "IX_RSRecords_Compliance",
        "unique": false,
        "columns": [
          "PaymentDate",
          "IsOverdue",
          "SupplierType"
        ]
      },
      {
        "name": "IX_RSRecords_DeclarationDeadline",
        "unique": false,
        "columns": [
          "DeclarationDeadline"
        ]
      },
      {
        "name": "IX_RSRecords_IsExemptByTreaty",
        "unique": false,
        "columns": [
          "IsExemptByTreaty"
        ]
      },
      {
        "name": "IX_RSRecords_SupplierType",
        "unique": false,
        "columns": [
          "SupplierType"
        ]
      },
      {
        "name": "IX_RSRecords_TEJTransmissionStatus",
        "unique": false,
        "columns": [
          "TEJTransmissionStatus"
        ]
      },
      {
        "name": "IX_RSRecords_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "RSRecords_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "uq_rs_invoice_payment_entity",
        "unique": true,
        "columns": [
          "InvoiceNumber",
          "PaymentDate",
          "EntityId",
          "EntityType"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "EntityType",
        "def": "varchar(20) NOT NULL UNIQUE"
      },
      {
        "name": "EntityId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "EntityNumber",
        "def": "varchar(50)"
      },
      {
        "name": "InvoiceNumber",
        "def": "varchar(100) NOT NULL UNIQUE"
      },
      {
        "name": "InvoiceDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "InvoiceAmount",
        "def": "numeric(15, 2) NOT NULL"
      },
      {
        "name": "PaymentDate",
        "def": "timestamp with time zone NOT NULL UNIQUE"
      },
      {
        "name": "AmountPaid",
        "def": "numeric(15, 2) NOT NULL"
      },
      {
        "name": "RSAmount",
        "def": "numeric(15, 2) NOT NULL"
      },
      {
        "name": "RSTypeCode",
        "def": "varchar(10) DEFAULT '10' NOT NULL"
      },
      {
        "name": "SupplierName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "SupplierTaxId",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "SupplierAddress",
        "def": "varchar(500)"
      },
      {
        "name": "PayerName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "PayerTaxId",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "PayerAddress",
        "def": "varchar(500)"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "TEJExported",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TEJFileName",
        "def": "varchar(255)"
      },
      {
        "name": "Notes",
        "def": "varchar(1000)"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "ModifiedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "DeclarationDeadline",
        "def": "timestamp"
      },
      {
        "name": "IsOverdue",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DaysLate",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "PenaltyAmount",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "SupplierType",
        "def": "varchar(20)"
      },
      {
        "name": "IsExemptByTreaty",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TreatyCode",
        "def": "varchar(20)"
      },
      {
        "name": "TEJAcceptanceNumber",
        "def": "varchar(255)"
      },
      {
        "name": "TEJTransmissionStatus",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "sale_activities",
    "category": "Sales • Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "sale_activities_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "sale_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "type",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "details",
        "def": "text"
      },
      {
        "name": "old_value",
        "def": "text"
      },
      {
        "name": "new_value",
        "def": "text"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "created_by",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "created_by_name",
        "def": "varchar(255) NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_sale_activities_sales",
        "to": "sales",
        "col": "sale_id"
      }
    ]
  },
  {
    "name": "sale_items",
    "category": "Sales • Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "sale_items_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "sale_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "type",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "article_id",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "item_name",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "item_code",
        "def": "varchar(100)"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "quantity",
        "def": "numeric(10, 2) DEFAULT '1' NOT NULL"
      },
      {
        "name": "unit_price",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "total_price",
        "def": "numeric(15, 2) GENERATED ALWAYS AS (((quantity * unit_price) * ((1)::numeric - (COALESCE(discount, (0)::numeric) / (100)::numeric)))) STORED"
      },
      {
        "name": "discount",
        "def": "numeric(15, 2) DEFAULT '0'"
      },
      {
        "name": "discount_type",
        "def": "varchar(20) DEFAULT 'percentage'"
      },
      {
        "name": "installation_id",
        "def": "varchar(50)"
      },
      {
        "name": "installation_name",
        "def": "varchar(255)"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_sale_items_sales",
        "to": "sales",
        "col": "sale_id"
      }
    ]
  },
  {
    "name": "SaleActivities",
    "category": "Sales • Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SaleActivities_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_SaleActivities",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"SaleActivities_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "SaleId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ActivityType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "ActivityDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "PerformedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "SaleItems",
    "category": "Sales • Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SaleItems_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_SaleItems",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"SaleItems_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "SaleId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ArticleId",
        "def": "integer"
      },
      {
        "name": "Description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "Quantity",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "UnitPrice",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "Discount",
        "def": "numeric(5, 2)"
      },
      {
        "name": "TaxRate",
        "def": "numeric(5, 2) NOT NULL"
      },
      {
        "name": "LineTotal",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "DisplayOrder",
        "def": "integer NOT NULL"
      },
      {
        "name": "Type",
        "def": "varchar(20) DEFAULT 'article'"
      },
      {
        "name": "ItemName",
        "def": "varchar(255)"
      },
      {
        "name": "ItemCode",
        "def": "varchar(100)"
      },
      {
        "name": "InstallationId",
        "def": "varchar(50)"
      },
      {
        "name": "InstallationName",
        "def": "varchar(255)"
      },
      {
        "name": "DiscountType",
        "def": "varchar(20) DEFAULT 'percentage'"
      },
      {
        "name": "RequiresServiceOrder",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "ServiceOrderGenerated",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "ServiceOrderId",
        "def": "varchar(50)"
      },
      {
        "name": "FulfillmentStatus",
        "def": "varchar(20) DEFAULT 'pending'"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "sales",
    "category": "Sales • Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_sales_contact_created",
        "unique": false,
        "columns": [
          "contact_id",
          "created_at"
        ]
      },
      {
        "name": "idx_sales_stage_status",
        "unique": false,
        "columns": [
          "stage",
          "status"
        ]
      },
      {
        "name": "sales_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "varchar(50) PRIMARY KEY"
      },
      {
        "name": "title",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "description",
        "def": "text"
      },
      {
        "name": "contact_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "offer_id",
        "def": "varchar(50)"
      },
      {
        "name": "amount",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "currency",
        "def": "varchar(3) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "taxes",
        "def": "numeric(15, 2) DEFAULT '0'"
      },
      {
        "name": "discount",
        "def": "numeric(15, 2) DEFAULT '0'"
      },
      {
        "name": "total_amount",
        "def": "numeric(15, 2) GENERATED ALWAYS AS (((amount + COALESCE(taxes, (0)::numeric)) - COALESCE(discount, (0)::numeric))) STORED"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'new_offer' NOT NULL"
      },
      {
        "name": "stage",
        "def": "varchar(20) DEFAULT 'offer' NOT NULL"
      },
      {
        "name": "priority",
        "def": "varchar(20) DEFAULT 'medium' NOT NULL"
      },
      {
        "name": "billing_address",
        "def": "text"
      },
      {
        "name": "billing_postal_code",
        "def": "varchar(20)"
      },
      {
        "name": "billing_country",
        "def": "varchar(100)"
      },
      {
        "name": "delivery_address",
        "def": "text"
      },
      {
        "name": "delivery_postal_code",
        "def": "varchar(20)"
      },
      {
        "name": "delivery_country",
        "def": "varchar(100)"
      },
      {
        "name": "estimated_close_date",
        "def": "timestamp"
      },
      {
        "name": "actual_close_date",
        "def": "timestamp"
      },
      {
        "name": "valid_until",
        "def": "timestamp"
      },
      {
        "name": "assigned_to",
        "def": "varchar(50)"
      },
      {
        "name": "assigned_to_name",
        "def": "varchar(255)"
      },
      {
        "name": "tags",
        "def": "text[]"
      },
      {
        "name": "lost_reason",
        "def": "text"
      },
      {
        "name": "materials_fulfillment",
        "def": "varchar(20)"
      },
      {
        "name": "service_orders_status",
        "def": "varchar(20)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "created_by",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "last_activity",
        "def": "timestamp"
      },
      {
        "name": "fiscal_stamp",
        "def": "numeric(10, 3) DEFAULT '1.000'"
      },
      {
        "name": "paid_amount",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "payment_status",
        "def": "varchar(20) DEFAULT 'unpaid' NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_sales_Contacts",
        "to": "Contacts",
        "col": "contact_id"
      },
      {
        "from": "FK_sales_offers",
        "to": "offers",
        "col": "offer_id"
      }
    ]
  },
  {
    "name": "Sales",
    "category": "Sales • Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_sales_contact_has_location",
        "unique": false,
        "columns": [
          "ContactHasLocation"
        ]
      },
      {
        "name": "ix_sales_tenant_projectid",
        "unique": false,
        "columns": [
          "TenantId",
          "ProjectId"
        ]
      },
      {
        "name": "IX_Sales_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Sales",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "uq_sales_sale_number",
        "unique": true,
        "columns": [
          "SaleNumber"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Sales_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "SaleNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "ContactId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SaleDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "Status",
        "def": "text NOT NULL"
      },
      {
        "name": "TotalAmount",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "DiscountPercent",
        "def": "numeric(5, 2)"
      },
      {
        "name": "DiscountAmount",
        "def": "numeric(18, 2)"
      },
      {
        "name": "TaxAmount",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "GrandTotal",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "PaymentStatus",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "PaymentMethod",
        "def": "varchar(50)"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "Title",
        "def": "varchar(255)"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Currency",
        "def": "varchar(3) DEFAULT 'TND'"
      },
      {
        "name": "Taxes",
        "def": "numeric(18, 2) DEFAULT '0'"
      },
      {
        "name": "Discount",
        "def": "numeric(18, 2) DEFAULT '0'"
      },
      {
        "name": "Stage",
        "def": "varchar(50) DEFAULT 'closed'"
      },
      {
        "name": "Priority",
        "def": "varchar(20) DEFAULT 'medium'"
      },
      {
        "name": "Category",
        "def": "varchar(50)"
      },
      {
        "name": "Source",
        "def": "varchar(50)"
      },
      {
        "name": "BillingAddress",
        "def": "text"
      },
      {
        "name": "BillingPostalCode",
        "def": "varchar(20)"
      },
      {
        "name": "BillingCountry",
        "def": "varchar(100)"
      },
      {
        "name": "DeliveryAddress",
        "def": "text"
      },
      {
        "name": "DeliveryPostalCode",
        "def": "varchar(20)"
      },
      {
        "name": "DeliveryCountry",
        "def": "varchar(100)"
      },
      {
        "name": "AssignedTo",
        "def": "varchar(50)"
      },
      {
        "name": "AssignedToName",
        "def": "varchar(255)"
      },
      {
        "name": "Tags",
        "def": "text[]"
      },
      {
        "name": "EstimatedCloseDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ActualCloseDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ValidUntil",
        "def": "timestamp with time zone"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now()"
      },
      {
        "name": "LastActivity",
        "def": "timestamp with time zone"
      },
      {
        "name": "OfferId",
        "def": "varchar(50)"
      },
      {
        "name": "ConvertedFromOfferAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "LostReason",
        "def": "text"
      },
      {
        "name": "MaterialsFulfillment",
        "def": "varchar(20) DEFAULT 'pending'"
      },
      {
        "name": "ServiceOrdersStatus",
        "def": "varchar(20) DEFAULT 'pending'"
      },
      {
        "name": "CreatedByName",
        "def": "varchar(255)"
      },
      {
        "name": "TaxType",
        "def": "varchar(20) DEFAULT 'percentage'"
      },
      {
        "name": "FiscalStamp",
        "def": "numeric(10, 3) DEFAULT '1.000'"
      },
      {
        "name": "ContactLatitude",
        "def": "numeric(10, 7)"
      },
      {
        "name": "ContactLongitude",
        "def": "numeric(10, 7)"
      },
      {
        "name": "ContactHasLocation",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "DiscountType",
        "def": "varchar(20) DEFAULT 'fixed'"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "ProjectId",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ServiceOrderExpenses",
    "category": "Service Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ServiceOrderExpenses_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ServiceOrderExpenses_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ServiceOrderId",
        "def": "integer NOT NULL"
      },
      {
        "name": "TechnicianId",
        "def": "varchar(100)"
      },
      {
        "name": "Type",
        "def": "varchar(50) DEFAULT 'other' NOT NULL"
      },
      {
        "name": "Amount",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "Currency",
        "def": "varchar(10) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Date",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(50) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "InvoiceStatus",
        "def": "varchar(50) DEFAULT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ServiceOrderJobs",
    "category": "Service Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ServiceOrderJobs_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_ServiceOrderJobs",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"ServiceOrderJobs_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "ServiceOrderId",
        "def": "integer NOT NULL"
      },
      {
        "name": "JobDescription",
        "def": "text NOT NULL"
      },
      {
        "name": "AssignedTechnicianId",
        "def": "integer"
      },
      {
        "name": "Status",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "EstimatedHours",
        "def": "numeric(5, 2)"
      },
      {
        "name": "ActualHours",
        "def": "numeric(5, 2)"
      },
      {
        "name": "CompletedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "Title",
        "def": "varchar(255)"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "SaleItemId",
        "def": "varchar(50)"
      },
      {
        "name": "InstallationId",
        "def": "varchar(50)"
      },
      {
        "name": "InstallationName",
        "def": "varchar(255)"
      },
      {
        "name": "WorkType",
        "def": "varchar(50)"
      },
      {
        "name": "Priority",
        "def": "varchar(20) DEFAULT 'medium'"
      },
      {
        "name": "ScheduledDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "EstimatedDuration",
        "def": "integer"
      },
      {
        "name": "EstimatedCost",
        "def": "numeric(18, 2)"
      },
      {
        "name": "ActualDuration",
        "def": "integer"
      },
      {
        "name": "ActualCost",
        "def": "numeric(18, 2)"
      },
      {
        "name": "CompletionPercentage",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "AssignedTechnicianIds",
        "def": "text[]"
      },
      {
        "name": "RequiredSkills",
        "def": "text[]"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now()"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ServiceOrderMaterials",
    "category": "Service Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ServiceOrderMaterials_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ServiceOrderMaterials_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ServiceOrderId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SaleItemId",
        "def": "integer"
      },
      {
        "name": "ArticleId",
        "def": "integer"
      },
      {
        "name": "Name",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "Sku",
        "def": "varchar(100)"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "Quantity",
        "def": "numeric(18, 2) DEFAULT '1' NOT NULL"
      },
      {
        "name": "UnitPrice",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "TotalPrice",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(50) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "Source",
        "def": "varchar(50) DEFAULT 'manual' NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "InternalComment",
        "def": "varchar(1000)"
      },
      {
        "name": "ExternalComment",
        "def": "varchar(1000)"
      },
      {
        "name": "Replacing",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "OldArticleModel",
        "def": "varchar(255)"
      },
      {
        "name": "OldArticleStatus",
        "def": "varchar(50)"
      },
      {
        "name": "InstallationId",
        "def": "varchar(50)"
      },
      {
        "name": "InstallationName",
        "def": "varchar(255)"
      },
      {
        "name": "InvoiceStatus",
        "def": "varchar(50) DEFAULT NULL"
      },
      {
        "name": "Unit",
        "def": "varchar(20) DEFAULT 'piece' NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ServiceOrderNotes",
    "category": "Service Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ServiceOrderNotes_ServiceOrderId",
        "unique": false,
        "columns": [
          "ServiceOrderId"
        ]
      },
      {
        "name": "IX_ServiceOrderNotes_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ServiceOrderNotes_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ServiceOrderId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Content",
        "def": "text NOT NULL"
      },
      {
        "name": "Type",
        "def": "varchar(20) DEFAULT 'internal' NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "CreatedByName",
        "def": "varchar(255)"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_ServiceOrderNotes_ServiceOrders",
        "to": "ServiceOrders",
        "col": "ServiceOrderId"
      }
    ]
  },
  {
    "name": "ServiceOrders",
    "category": "Service Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_service_orders_contact_has_location",
        "unique": false,
        "columns": [
          "ContactHasLocation"
        ]
      },
      {
        "name": "ix_serviceorders_tenant_projectid",
        "unique": false,
        "columns": [
          "TenantId",
          "ProjectId"
        ]
      },
      {
        "name": "IX_ServiceOrders_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_ServiceOrders",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "uq_service_orders_order_number",
        "unique": true,
        "columns": [
          "OrderNumber"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"ServiceOrders_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "OrderNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "ContactId",
        "def": "integer NOT NULL"
      },
      {
        "name": "OrderDate",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "ServiceType",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Priority",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "Status",
        "def": "text NOT NULL"
      },
      {
        "name": "ScheduledDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "CompletedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "TotalAmount",
        "def": "numeric(18, 2)"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "SaleId",
        "def": "varchar(50)"
      },
      {
        "name": "OfferId",
        "def": "varchar(50)"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "StartDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "TargetCompletionDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ActualStartDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ActualCompletionDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "EstimatedDuration",
        "def": "integer"
      },
      {
        "name": "ActualDuration",
        "def": "integer"
      },
      {
        "name": "EstimatedCost",
        "def": "numeric(18, 2)"
      },
      {
        "name": "ActualCost",
        "def": "numeric(18, 2)"
      },
      {
        "name": "Discount",
        "def": "numeric(18, 2)"
      },
      {
        "name": "DiscountPercentage",
        "def": "numeric(5, 2)"
      },
      {
        "name": "Tax",
        "def": "numeric(18, 2)"
      },
      {
        "name": "PaymentStatus",
        "def": "varchar(20) DEFAULT 'pending'"
      },
      {
        "name": "PaymentTerms",
        "def": "varchar(50)"
      },
      {
        "name": "InvoiceNumber",
        "def": "varchar(50)"
      },
      {
        "name": "InvoiceDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "CompletionPercentage",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "RequiresApproval",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "ApprovedBy",
        "def": "varchar(50)"
      },
      {
        "name": "ApprovalDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "CancellationReason",
        "def": "text"
      },
      {
        "name": "CancellationNotes",
        "def": "text"
      },
      {
        "name": "Tags",
        "def": "text[]"
      },
      {
        "name": "CustomFields",
        "def": "jsonb"
      },
      {
        "name": "UpdatedBy",
        "def": "varchar(50)"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now()"
      },
      {
        "name": "ContactLatitude",
        "def": "numeric(10, 7)"
      },
      {
        "name": "ContactLongitude",
        "def": "numeric(10, 7)"
      },
      {
        "name": "ContactHasLocation",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "TechnicallyCompletedAt",
        "def": "timestamp"
      },
      {
        "name": "ServiceCount",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "CompletedDispatchCount",
        "def": "integer DEFAULT 0"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "ProjectId",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "ServiceOrderTimeEntries",
    "category": "Service Orders",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_ServiceOrderTimeEntries_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "ServiceOrderTimeEntries_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ServiceOrderId",
        "def": "integer NOT NULL"
      },
      {
        "name": "TechnicianId",
        "def": "varchar(100)"
      },
      {
        "name": "WorkType",
        "def": "varchar(50) DEFAULT 'work' NOT NULL"
      },
      {
        "name": "StartTime",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "EndTime",
        "def": "timestamp with time zone"
      },
      {
        "name": "Duration",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Billable",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "HourlyRate",
        "def": "numeric(18, 2)"
      },
      {
        "name": "TotalCost",
        "def": "numeric(18, 2)"
      },
      {
        "name": "Status",
        "def": "varchar(50) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "InvoiceStatus",
        "def": "varchar(50) DEFAULT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Skills",
    "category": "Roles & Permissions",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_skills_category",
        "unique": false,
        "columns": [
          "Category"
        ]
      },
      {
        "name": "idx_skills_isactive",
        "unique": false,
        "columns": [
          "IsActive"
        ]
      },
      {
        "name": "idx_skills_name",
        "unique": false,
        "columns": [
          "Name"
        ]
      },
      {
        "name": "IX_Skills_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "PK_Skills",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer GENERATED BY DEFAULT AS IDENTITY (sequence name \"Skills_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Category",
        "def": "varchar(50)"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Level",
        "def": "varchar(20)"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp"
      },
      {
        "name": "CreatedUser",
        "def": "varchar(100) DEFAULT 'system'"
      },
      {
        "name": "ModifyUser",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "stock_transactions",
    "category": "Inventory & Articles",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_stock_transactions_article_id",
        "unique": false,
        "columns": [
          "article_id"
        ]
      },
      {
        "name": "idx_stock_transactions_created_at",
        "unique": false,
        "columns": [
          "created_at"
        ]
      },
      {
        "name": "idx_stock_transactions_performed_by",
        "unique": false,
        "columns": [
          "performed_by"
        ]
      },
      {
        "name": "idx_stock_transactions_reference",
        "unique": false,
        "columns": [
          "reference_type",
          "reference_id"
        ]
      },
      {
        "name": "idx_stock_transactions_type",
        "unique": false,
        "columns": [
          "transaction_type"
        ]
      },
      {
        "name": "IX_stock_transactions_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "stock_transactions_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "article_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "transaction_type",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "quantity",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "previous_stock",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "new_stock",
        "def": "numeric(18, 2) NOT NULL"
      },
      {
        "name": "reason",
        "def": "varchar(255)"
      },
      {
        "name": "reference_type",
        "def": "varchar(50)"
      },
      {
        "name": "reference_id",
        "def": "varchar(50)"
      },
      {
        "name": "reference_number",
        "def": "varchar(100)"
      },
      {
        "name": "notes",
        "def": "text"
      },
      {
        "name": "performed_by",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "performed_by_name",
        "def": "varchar(200)"
      },
      {
        "name": "ip_address",
        "def": "varchar(45)"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "stock_transactions_article_id_fkey",
        "to": "Articles",
        "col": "article_id"
      }
    ]
  },
  {
    "name": "SupplierInvoiceItems",
    "category": "Purchases",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SupplierInvoiceItems_SIId",
        "unique": false,
        "columns": [
          "SupplierInvoiceId"
        ]
      },
      {
        "name": "SupplierInvoiceItems_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SupplierInvoiceId",
        "def": "integer NOT NULL"
      },
      {
        "name": "PurchaseOrderItemId",
        "def": "integer"
      },
      {
        "name": "ArticleId",
        "def": "integer"
      },
      {
        "name": "ArticleName",
        "def": "varchar(255)"
      },
      {
        "name": "Description",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "Quantity",
        "def": "numeric(18, 2) DEFAULT '1' NOT NULL"
      },
      {
        "name": "UnitPrice",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "TaxRate",
        "def": "numeric(5, 2) DEFAULT '19' NOT NULL"
      },
      {
        "name": "LineTotal",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "DisplayOrder",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "SupplierInvoiceItems_PurchaseOrderItemId_fkey",
        "to": "PurchaseOrderItems",
        "col": "PurchaseOrderItemId"
      },
      {
        "from": "SupplierInvoiceItems_SupplierInvoiceId_fkey",
        "to": "SupplierInvoices",
        "col": "SupplierInvoiceId"
      }
    ]
  },
  {
    "name": "SupplierInvoices",
    "category": "Purchases",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SupplierInvoices_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_SupplierInvoices_Status",
        "unique": false,
        "columns": [
          "TenantId",
          "Status"
        ]
      },
      {
        "name": "IX_SupplierInvoices_SupplierId",
        "unique": false,
        "columns": [
          "TenantId",
          "SupplierId"
        ]
      },
      {
        "name": "IX_SupplierInvoices_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "SupplierInvoices_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "InvoiceNumber",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "SupplierInvoiceRef",
        "def": "varchar(100)"
      },
      {
        "name": "SupplierId",
        "def": "integer"
      },
      {
        "name": "SupplierName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "SupplierMatriculeFiscale",
        "def": "varchar(100)"
      },
      {
        "name": "PurchaseOrderId",
        "def": "integer"
      },
      {
        "name": "GoodsReceiptId",
        "def": "integer"
      },
      {
        "name": "InvoiceDate",
        "def": "date DEFAULT CURRENT_DATE NOT NULL"
      },
      {
        "name": "DueDate",
        "def": "date NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(30) DEFAULT 'draft' NOT NULL"
      },
      {
        "name": "Currency",
        "def": "varchar(10) DEFAULT 'TND' NOT NULL"
      },
      {
        "name": "SubTotal",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "Discount",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "DiscountType",
        "def": "varchar(20) DEFAULT 'percentage' NOT NULL"
      },
      {
        "name": "TaxAmount",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "FiscalStamp",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "GrandTotal",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "AmountPaid",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "PaymentMethod",
        "def": "varchar(50)"
      },
      {
        "name": "PaymentDate",
        "def": "date"
      },
      {
        "name": "Notes",
        "def": "text"
      },
      {
        "name": "RsApplicable",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "RsTypeCode",
        "def": "varchar(20)"
      },
      {
        "name": "RsAmount",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "RsRecordId",
        "def": "varchar(100)"
      },
      {
        "name": "FactureEnLigneId",
        "def": "varchar(100)"
      },
      {
        "name": "FactureEnLigneStatus",
        "def": "varchar(20) DEFAULT 'pending'"
      },
      {
        "name": "FactureEnLigneSentAt",
        "def": "timestamp"
      },
      {
        "name": "TejSynced",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TejSyncDate",
        "def": "timestamp"
      },
      {
        "name": "TejSyncStatus",
        "def": "varchar(20) DEFAULT 'pending'"
      },
      {
        "name": "TejErrorMessage",
        "def": "text"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(255)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      }
    ],
    "foreignKeys": [
      {
        "from": "SupplierInvoices_GoodsReceiptId_fkey",
        "to": "GoodsReceipts",
        "col": "GoodsReceiptId"
      },
      {
        "from": "SupplierInvoices_PurchaseOrderId_fkey",
        "to": "PurchaseOrders",
        "col": "PurchaseOrderId"
      }
    ]
  },
  {
    "name": "SupportTicketAttachments",
    "category": "Support Tickets",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SupportTicketAttachments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_SupportTicketAttachments_TicketId",
        "unique": false,
        "columns": [
          "SupportTicketId"
        ]
      },
      {
        "name": "SupportTicketAttachments_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "SupportTicketId",
        "def": "integer NOT NULL"
      },
      {
        "name": "FileName",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "FilePath",
        "def": "varchar(1000)"
      },
      {
        "name": "FileSize",
        "def": "bigint DEFAULT 0 NOT NULL"
      },
      {
        "name": "ContentType",
        "def": "varchar(200)"
      },
      {
        "name": "UploadedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "SupportTicketAttachments_SupportTicketId_fkey",
        "to": "SupportTickets",
        "col": "SupportTicketId"
      }
    ]
  },
  {
    "name": "SupportTicketComments",
    "category": "Support Tickets",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SupportTicketComments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_SupportTicketComments_TicketId",
        "unique": false,
        "columns": [
          "SupportTicketId"
        ]
      },
      {
        "name": "SupportTicketComments_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "SupportTicketId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Author",
        "def": "varchar(255) DEFAULT '' NOT NULL"
      },
      {
        "name": "AuthorEmail",
        "def": "varchar(255)"
      },
      {
        "name": "Text",
        "def": "text NOT NULL"
      },
      {
        "name": "IsInternal",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "SyncedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "OfflineDeviceId",
        "def": "varchar(255)"
      }
    ],
    "foreignKeys": [
      {
        "from": "SupportTicketComments_SupportTicketId_fkey",
        "to": "SupportTickets",
        "col": "SupportTicketId"
      }
    ]
  },
  {
    "name": "SupportTicketLinks",
    "category": "Support Tickets",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "SourceTicketId",
        "TargetTicketId",
        "LinkType"
      ]
    ],
    "indexes": [
      {
        "name": "IX_SupportTicketLinks_Source",
        "unique": false,
        "columns": [
          "SourceTicketId"
        ]
      },
      {
        "name": "IX_SupportTicketLinks_Target",
        "unique": false,
        "columns": [
          "TargetTicketId"
        ]
      },
      {
        "name": "IX_SupportTicketLinks_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "SupportTicketLinks_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "SupportTicketLinks_SourceTicketId_TargetTicketId_LinkType_key",
        "unique": true,
        "columns": [
          "SourceTicketId",
          "TargetTicketId",
          "LinkType"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "SourceTicketId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "TargetTicketId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "LinkType",
        "def": "varchar(30) DEFAULT 'related' NOT NULL UNIQUE"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "SupportTicketLinks_SourceTicketId_fkey",
        "to": "SupportTickets",
        "col": "SourceTicketId"
      },
      {
        "from": "SupportTicketLinks_TargetTicketId_fkey",
        "to": "SupportTickets",
        "col": "TargetTicketId"
      }
    ]
  },
  {
    "name": "SupportTickets",
    "category": "Support Tickets",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SupportTickets_OfflineDeviceId",
        "unique": false,
        "columns": [
          "OfflineDeviceId"
        ]
      },
      {
        "name": "IX_SupportTickets_Status",
        "unique": false,
        "columns": [
          "Status"
        ]
      },
      {
        "name": "IX_SupportTickets_SyncedAt",
        "unique": false,
        "columns": [
          "SyncedAt"
        ]
      },
      {
        "name": "IX_SupportTickets_Tenant",
        "unique": false,
        "columns": [
          "Tenant"
        ]
      },
      {
        "name": "IX_SupportTickets_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "SupportTickets_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "Title",
        "def": "varchar(300) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text NOT NULL"
      },
      {
        "name": "Urgency",
        "def": "varchar(20)"
      },
      {
        "name": "Category",
        "def": "varchar(50)"
      },
      {
        "name": "CurrentPage",
        "def": "varchar(500)"
      },
      {
        "name": "RelatedUrl",
        "def": "varchar(1000)"
      },
      {
        "name": "Tenant",
        "def": "varchar(100) DEFAULT '' NOT NULL"
      },
      {
        "name": "UserEmail",
        "def": "varchar(255)"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'open' NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "SyncedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "OfflineDeviceId",
        "def": "varchar(255)"
      },
      {
        "name": "SyncVersion",
        "def": "integer DEFAULT 1"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "sync_changes",
    "category": "System & Audit",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ix_sync_changes_tenant_changed_at",
        "unique": false,
        "columns": [
          "TenantId",
          "ChangedAt"
        ]
      },
      {
        "name": "ix_sync_changes_tenant_entity",
        "unique": false,
        "columns": [
          "TenantId",
          "EntityType",
          "EntityId"
        ]
      },
      {
        "name": "ix_sync_changes_tenant_entitykey",
        "unique": false,
        "columns": [
          "TenantId",
          "EntityType",
          "EntityKey"
        ]
      },
      {
        "name": "ix_sync_changes_tenant_userid_changedat",
        "unique": false,
        "columns": [
          "TenantId",
          "ChangedByUserId",
          "ChangedAt"
        ]
      },
      {
        "name": "sync_changes_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "bigserial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "EntityType",
        "def": "varchar(80) NOT NULL"
      },
      {
        "name": "EntityId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Operation",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "DataJson",
        "def": "text"
      },
      {
        "name": "ChangedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "ChangedBy",
        "def": "varchar(100)"
      },
      {
        "name": "EntityKey",
        "def": "varchar(128)"
      },
      {
        "name": "ChangedByUserId",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "sync_operation_receipts",
    "category": "System & Audit",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ix_sync_operation_receipts_tenant_user_createdat",
        "unique": false,
        "columns": [
          "TenantId",
          "CreatedByUser",
          "CreatedAt"
        ]
      },
      {
        "name": "ix_sync_receipts_tenant_created_at",
        "unique": false,
        "columns": [
          "TenantId",
          "CreatedAt"
        ]
      },
      {
        "name": "ix_sync_receipts_tenant_device_op",
        "unique": true,
        "columns": [
          "TenantId",
          "DeviceId",
          "OpId"
        ]
      },
      {
        "name": "ix_sync_receipts_tenant_userid_createdat",
        "unique": false,
        "columns": [
          "TenantId",
          "CreatedByUserId",
          "CreatedAt"
        ]
      },
      {
        "name": "sync_operation_receipts_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "bigserial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "DeviceId",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "OpId",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(40) DEFAULT 'applied' NOT NULL"
      },
      {
        "name": "ServerEntityId",
        "def": "integer"
      },
      {
        "name": "ResponseJson",
        "def": "text"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "OperationJson",
        "def": "text"
      },
      {
        "name": "created_by_user",
        "def": "varchar(256)"
      },
      {
        "name": "CreatedByUser",
        "def": "varchar(256)"
      },
      {
        "name": "ServerEntityKey",
        "def": "varchar(128)"
      },
      {
        "name": "CreatedByUserId",
        "def": "integer"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "SyncedCalendarEvents",
    "category": "Notifications & Email",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "ConnectedEmailAccountId",
        "ExternalId"
      ]
    ],
    "indexes": [
      {
        "name": "idx_synced_calendar_events_account",
        "unique": false,
        "columns": [
          "ConnectedEmailAccountId"
        ]
      },
      {
        "name": "idx_synced_calendar_events_start",
        "unique": false,
        "columns": [
          "StartTime"
        ]
      },
      {
        "name": "IX_SyncedCalendarEvents_Account_ExternalId",
        "unique": true,
        "columns": [
          "ConnectedEmailAccountId",
          "ExternalId"
        ]
      },
      {
        "name": "IX_SyncedCalendarEvents_AccountId_StartTime",
        "unique": false,
        "columns": [
          "ConnectedEmailAccountId",
          "StartTime"
        ]
      },
      {
        "name": "IX_SyncedCalendarEvents_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "SyncedCalendarEvents_ConnectedEmailAccountId_ExternalId_key",
        "unique": true,
        "columns": [
          "ConnectedEmailAccountId",
          "ExternalId"
        ]
      },
      {
        "name": "SyncedCalendarEvents_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "ConnectedEmailAccountId",
        "def": "uuid NOT NULL UNIQUE"
      },
      {
        "name": "ExternalId",
        "def": "varchar(255) NOT NULL UNIQUE"
      },
      {
        "name": "Title",
        "def": "text DEFAULT '' NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Location",
        "def": "varchar(500)"
      },
      {
        "name": "StartTime",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "EndTime",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "IsAllDay",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(50) DEFAULT 'confirmed' NOT NULL"
      },
      {
        "name": "OrganizerEmail",
        "def": "varchar(255)"
      },
      {
        "name": "Attendees",
        "def": "text"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "SyncedCalendarEvents_ConnectedEmailAccountId_fkey",
        "to": "ConnectedEmailAccounts",
        "col": "ConnectedEmailAccountId"
      }
    ]
  },
  {
    "name": "SyncedEmailAttachments",
    "category": "Notifications & Email",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SyncedEmailAttachments_SyncedEmailId",
        "unique": false,
        "columns": [
          "SyncedEmailId"
        ]
      },
      {
        "name": "IX_SyncedEmailAttachments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "SyncedEmailAttachments_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "SyncedEmailId",
        "def": "uuid NOT NULL"
      },
      {
        "name": "ExternalAttachmentId",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "FileName",
        "def": "varchar(255) DEFAULT '' NOT NULL"
      },
      {
        "name": "ContentType",
        "def": "varchar(100) DEFAULT 'application/octet-stream' NOT NULL"
      },
      {
        "name": "Size",
        "def": "bigint DEFAULT 0 NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "SyncedEmailAttachments_SyncedEmailId_fkey",
        "to": "SyncedEmails",
        "col": "SyncedEmailId"
      }
    ]
  },
  {
    "name": "SyncedEmails",
    "category": "Notifications & Email",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SyncedEmails_Account_ExternalId",
        "unique": true,
        "columns": [
          "ConnectedEmailAccountId",
          "ExternalId"
        ]
      },
      {
        "name": "IX_SyncedEmails_AccountId_ReceivedAt",
        "unique": false,
        "columns": [
          "ConnectedEmailAccountId",
          "ReceivedAt"
        ]
      },
      {
        "name": "IX_SyncedEmails_Subject",
        "unique": false,
        "columns": [
          "to_tsvector('english'::regconfig",
          "Subject"
        ]
      },
      {
        "name": "IX_SyncedEmails_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "SyncedEmails_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
      },
      {
        "name": "ConnectedEmailAccountId",
        "def": "uuid NOT NULL"
      },
      {
        "name": "ExternalId",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "ThreadId",
        "def": "varchar(255)"
      },
      {
        "name": "Subject",
        "def": "text DEFAULT '' NOT NULL"
      },
      {
        "name": "Snippet",
        "def": "text"
      },
      {
        "name": "FromEmail",
        "def": "varchar(255) DEFAULT '' NOT NULL"
      },
      {
        "name": "FromName",
        "def": "varchar(255)"
      },
      {
        "name": "ToEmails",
        "def": "text"
      },
      {
        "name": "CcEmails",
        "def": "text"
      },
      {
        "name": "BccEmails",
        "def": "text"
      },
      {
        "name": "BodyPreview",
        "def": "text"
      },
      {
        "name": "IsRead",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "IsStarred",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "HasAttachments",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "Labels",
        "def": "text"
      },
      {
        "name": "ReceivedAt",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "SyncedEmails_ConnectedEmailAccountId_fkey",
        "to": "ConnectedEmailAccounts",
        "col": "ConnectedEmailAccountId"
      }
    ]
  },
  {
    "name": "SyncFailureLog",
    "category": "System & Audit",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SyncFailureLog_DeviceId_Timestamp",
        "unique": false,
        "columns": [
          "DeviceId",
          "Timestamp"
        ]
      },
      {
        "name": "IX_SyncFailureLog_EntityType",
        "unique": false,
        "columns": [
          "EntityType"
        ]
      },
      {
        "name": "IX_SyncFailureLog_Status",
        "unique": false,
        "columns": [
          "Status"
        ]
      },
      {
        "name": "IX_SyncFailureLog_UserId_Timestamp",
        "unique": false,
        "columns": [
          "UserId",
          "Timestamp"
        ]
      },
      {
        "name": "SyncFailureLog_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "DeviceId",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "UserId",
        "def": "integer"
      },
      {
        "name": "OpId",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "EntityType",
        "def": "varchar(100)"
      },
      {
        "name": "Status",
        "def": "varchar(50)"
      },
      {
        "name": "ErrorMessage",
        "def": "text"
      },
      {
        "name": "HttpStatus",
        "def": "integer"
      },
      {
        "name": "HttpBody",
        "def": "text"
      },
      {
        "name": "Endpoint",
        "def": "varchar(500)"
      },
      {
        "name": "Method",
        "def": "varchar(10)"
      },
      {
        "name": "Timestamp",
        "def": "timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "Resolved",
        "def": "boolean DEFAULT false"
      },
      {
        "name": "ResolvedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "Tenant",
        "def": "varchar(255)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "SyncPerformanceLog",
    "category": "System & Audit",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SyncPerformanceLog_DeviceId_Timestamp",
        "unique": false,
        "columns": [
          "DeviceId",
          "Timestamp"
        ]
      },
      {
        "name": "IX_SyncPerformanceLog_UserId_Timestamp",
        "unique": false,
        "columns": [
          "UserId",
          "Timestamp"
        ]
      },
      {
        "name": "SyncPerformanceLog_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "DeviceId",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "UserId",
        "def": "integer"
      },
      {
        "name": "SyncDuration",
        "def": "bigint NOT NULL"
      },
      {
        "name": "OperationsAttempted",
        "def": "integer NOT NULL"
      },
      {
        "name": "OperationsSucceeded",
        "def": "integer NOT NULL"
      },
      {
        "name": "OperationsFailed",
        "def": "integer NOT NULL"
      },
      {
        "name": "BytesSent",
        "def": "bigint"
      },
      {
        "name": "BytesReceived",
        "def": "bigint"
      },
      {
        "name": "Timestamp",
        "def": "timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "Tenant",
        "def": "varchar(255)"
      },
      {
        "name": "NetworkType",
        "def": "varchar(50)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "SystemLogs",
    "category": "System & Audit",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_SystemLogs_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "SystemLogs_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "Timestamp",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "Level",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "Message",
        "def": "text NOT NULL"
      },
      {
        "name": "Module",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Action",
        "def": "varchar(50) DEFAULT 'other' NOT NULL"
      },
      {
        "name": "UserId",
        "def": "varchar(100)"
      },
      {
        "name": "UserName",
        "def": "varchar(200)"
      },
      {
        "name": "EntityType",
        "def": "varchar(100)"
      },
      {
        "name": "EntityId",
        "def": "varchar(100)"
      },
      {
        "name": "Details",
        "def": "text"
      },
      {
        "name": "IpAddress",
        "def": "varchar(45)"
      },
      {
        "name": "UserAgent",
        "def": "text"
      },
      {
        "name": "Metadata",
        "def": "jsonb"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "TaskComments",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_TaskComments_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "TaskComments_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TaskId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Comment",
        "def": "text NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp DEFAULT now()"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "TaskTimeEntries",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_TaskTimeEntries_ApprovalStatus",
        "unique": false,
        "columns": [
          "ApprovalStatus"
        ]
      },
      {
        "name": "IX_TaskTimeEntries_DailyTaskId",
        "unique": false,
        "columns": [
          "DailyTaskId"
        ]
      },
      {
        "name": "IX_TaskTimeEntries_ProjectTaskId",
        "unique": false,
        "columns": [
          "ProjectTaskId"
        ]
      },
      {
        "name": "IX_TaskTimeEntries_StartTime",
        "unique": false,
        "columns": [
          "StartTime"
        ]
      },
      {
        "name": "IX_TaskTimeEntries_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_TaskTimeEntries_UserId",
        "unique": false,
        "columns": [
          "UserId"
        ]
      },
      {
        "name": "TaskTimeEntries_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ProjectTaskId",
        "def": "integer"
      },
      {
        "name": "DailyTaskId",
        "def": "integer"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "UserName",
        "def": "varchar(100)"
      },
      {
        "name": "StartTime",
        "def": "timestamp with time zone NOT NULL"
      },
      {
        "name": "EndTime",
        "def": "timestamp with time zone"
      },
      {
        "name": "Duration",
        "def": "numeric(18, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "IsBillable",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "HourlyRate",
        "def": "numeric(18, 2)"
      },
      {
        "name": "TotalCost",
        "def": "numeric(18, 2)"
      },
      {
        "name": "WorkType",
        "def": "varchar(50) DEFAULT 'work' NOT NULL"
      },
      {
        "name": "ApprovalStatus",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "ApprovedById",
        "def": "integer"
      },
      {
        "name": "ApprovedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ApprovalNotes",
        "def": "text"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_TaskTimeEntries_ApprovedBy",
        "to": "MainAdminUsers",
        "col": "ApprovedById"
      },
      {
        "from": "FK_TaskTimeEntries_DailyTasks",
        "to": "DailyTasks",
        "col": "DailyTaskId"
      },
      {
        "from": "FK_TaskTimeEntries_ProjectTasks",
        "to": "ProjectTasks",
        "col": "ProjectTaskId"
      },
      {
        "from": "FK_TaskTimeEntries_Users",
        "to": "MainAdminUsers",
        "col": "UserId"
      }
    ]
  },
  {
    "name": "technician_status_history",
    "category": "Dispatches",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ix_tech_status_hist_changed_at",
        "unique": false,
        "columns": [
          "changed_at"
        ]
      },
      {
        "name": "ix_tech_status_hist_technician",
        "unique": false,
        "columns": [
          "technician_id"
        ]
      },
      {
        "name": "ix_tech_status_hist_tenant",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "technician_status_history_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "technician_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "changed_from",
        "def": "varchar(50)"
      },
      {
        "name": "changed_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "changed_by",
        "def": "integer"
      },
      {
        "name": "reason",
        "def": "text"
      },
      {
        "name": "metadata",
        "def": "jsonb"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "TEJExportLogs",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "ix_tej_year_month",
        "unique": false,
        "columns": [
          "Year",
          "Month"
        ]
      },
      {
        "name": "IX_TEJExportLogs_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "TEJExportLogs_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "FileName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "ExportDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "ExportedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "Month",
        "def": "smallint NOT NULL"
      },
      {
        "name": "Year",
        "def": "smallint NOT NULL"
      },
      {
        "name": "RecordCount",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "TotalRSAmount",
        "def": "numeric(15, 2) DEFAULT '0' NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'success' NOT NULL"
      },
      {
        "name": "ErrorMessage",
        "def": "varchar(2000)"
      },
      {
        "name": "DocumentId",
        "def": "integer"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "Tenants",
    "category": "Tenancy",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_Tenants_MainAdminUserId",
        "unique": false,
        "columns": [
          "MainAdminUserId"
        ]
      },
      {
        "name": "IX_Tenants_Slug",
        "unique": false,
        "columns": [
          "Slug"
        ]
      },
      {
        "name": "Tenants_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "Tenants_Slug_key",
        "unique": true,
        "columns": [
          "Slug"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "MainAdminUserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Slug",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "CompanyName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "CompanyLogoUrl",
        "def": "varchar(500)"
      },
      {
        "name": "CompanyWebsite",
        "def": "varchar(500)"
      },
      {
        "name": "CompanyPhone",
        "def": "varchar(50)"
      },
      {
        "name": "CompanyAddress",
        "def": "text"
      },
      {
        "name": "CompanyCountry",
        "def": "varchar(2)"
      },
      {
        "name": "Industry",
        "def": "varchar(100)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "IsDefault",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp"
      }
    ],
    "foreignKeys": [
      {
        "from": "Tenants_MainAdminUserId_fkey",
        "to": "MainAdminUsers",
        "col": "MainAdminUserId"
      }
    ]
  },
  {
    "name": "TimeEntries",
    "category": "Projects & Tasks",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_TimeEntries_DispatchId",
        "unique": false,
        "columns": [
          "DispatchId"
        ]
      },
      {
        "name": "IX_TimeEntries_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "TimeEntries_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "DispatchId",
        "def": "integer NOT NULL"
      },
      {
        "name": "TechnicianId",
        "def": "integer"
      },
      {
        "name": "StartTime",
        "def": "timestamp with time zone"
      },
      {
        "name": "EndTime",
        "def": "timestamp with time zone"
      },
      {
        "name": "Duration",
        "def": "integer"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "ActivityType",
        "def": "varchar(100)"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT CURRENT_TIMESTAMP"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "TimeEntries_DispatchId_fkey",
        "to": "Dispatches",
        "col": "DispatchId"
      }
    ]
  },
  {
    "name": "TokenRefreshLog",
    "category": "Identity & Auth",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_TokenRefreshLog_Success",
        "unique": false,
        "columns": [
          "Success"
        ]
      },
      {
        "name": "IX_TokenRefreshLog_UserId_Timestamp",
        "unique": false,
        "columns": [
          "UserId",
          "Timestamp"
        ]
      },
      {
        "name": "TokenRefreshLog_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Reason",
        "def": "varchar(100)"
      },
      {
        "name": "Success",
        "def": "boolean NOT NULL"
      },
      {
        "name": "ErrorMessage",
        "def": "text"
      },
      {
        "name": "Timestamp",
        "def": "timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL"
      },
      {
        "name": "Tenant",
        "def": "varchar(255)"
      },
      {
        "name": "DeviceId",
        "def": "varchar(255)"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "user_leaves",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_user_leaves_dates",
        "unique": false,
        "columns": [
          "start_date",
          "end_date"
        ]
      },
      {
        "name": "idx_user_leaves_status",
        "unique": false,
        "columns": [
          "status"
        ]
      },
      {
        "name": "idx_user_leaves_user_id",
        "unique": false,
        "columns": [
          "user_id"
        ]
      },
      {
        "name": "ix_user_leaves_status_dates",
        "unique": false,
        "columns": [
          "status",
          "start_date",
          "end_date"
        ]
      },
      {
        "name": "IX_user_leaves_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "user_leaves_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "leave_type",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "start_date",
        "def": "date NOT NULL"
      },
      {
        "name": "end_date",
        "def": "date NOT NULL"
      },
      {
        "name": "status",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "notes",
        "def": "text"
      },
      {
        "name": "approved_by",
        "def": "integer"
      },
      {
        "name": "approved_at",
        "def": "timestamp"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "reason",
        "def": "text"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "user_status_history",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_user_status_history_changed_at",
        "unique": false,
        "columns": [
          "changed_at"
        ]
      },
      {
        "name": "idx_user_status_history_user_id",
        "unique": false,
        "columns": [
          "user_id"
        ]
      },
      {
        "name": "IX_user_status_history_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "user_status_history_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "previous_status",
        "def": "varchar(50)"
      },
      {
        "name": "new_status",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "reason",
        "def": "text"
      },
      {
        "name": "changed_by",
        "def": "integer"
      },
      {
        "name": "changed_at",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "user_working_hours",
    "category": "HR & Payroll",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_user_working_hours_active",
        "unique": false,
        "columns": [
          "is_active"
        ]
      },
      {
        "name": "idx_user_working_hours_day",
        "unique": false,
        "columns": [
          "day_of_week"
        ]
      },
      {
        "name": "idx_user_working_hours_user_id",
        "unique": false,
        "columns": [
          "user_id"
        ]
      },
      {
        "name": "IX_user_working_hours_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "user_working_hours_pkey",
        "unique": true,
        "columns": [
          "id"
        ]
      }
    ],
    "columns": [
      {
        "name": "id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "user_id",
        "def": "integer NOT NULL"
      },
      {
        "name": "day_of_week",
        "def": "integer NOT NULL"
      },
      {
        "name": "start_time",
        "def": "time NOT NULL"
      },
      {
        "name": "end_time",
        "def": "time NOT NULL"
      },
      {
        "name": "is_active",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "effective_from",
        "def": "timestamp"
      },
      {
        "name": "effective_until",
        "def": "timestamp"
      },
      {
        "name": "created_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "updated_at",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "lunch_start",
        "def": "time DEFAULT '12:00:00'"
      },
      {
        "name": "lunch_end",
        "def": "time DEFAULT '13:00:00'"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "UserAiKeys",
    "category": "Identity & Auth",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_UserAiKeys_Provider",
        "unique": false,
        "columns": [
          "Provider"
        ]
      },
      {
        "name": "IX_UserAiKeys_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_UserAiKeys_UserId_UserType",
        "unique": false,
        "columns": [
          "UserId",
          "UserType"
        ]
      },
      {
        "name": "UserAiKeys_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "UserType",
        "def": "varchar(20) DEFAULT 'MainAdminUser' NOT NULL"
      },
      {
        "name": "Label",
        "def": "varchar(100) DEFAULT 'Key' NOT NULL"
      },
      {
        "name": "ApiKey",
        "def": "text NOT NULL"
      },
      {
        "name": "Provider",
        "def": "varchar(50) DEFAULT 'openrouter' NOT NULL"
      },
      {
        "name": "Priority",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "UserAiPreferences",
    "category": "Identity & Auth",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_UserAiPreferences_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_UserAiPreferences_UserId_UserType",
        "unique": true,
        "columns": [
          "UserId",
          "UserType"
        ]
      },
      {
        "name": "UserAiPreferences_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "UserType",
        "def": "varchar(20) DEFAULT 'MainAdminUser' NOT NULL"
      },
      {
        "name": "DefaultModel",
        "def": "varchar(200)"
      },
      {
        "name": "FallbackModel",
        "def": "varchar(200)"
      },
      {
        "name": "DefaultTemperature",
        "def": "numeric(3, 2) DEFAULT '0.70' NOT NULL"
      },
      {
        "name": "DefaultMaxTokens",
        "def": "integer DEFAULT 1000 NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "UserPreferences",
    "category": "Identity & Auth",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_userpreferences_userid",
        "unique": false,
        "columns": [
          "UserId"
        ]
      },
      {
        "name": "IX_UserPreferences_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "UserPreferences_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "PreferencesJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_UserPreferences_Users",
        "to": "Users",
        "col": "UserId"
      }
    ]
  },
  {
    "name": "UserRoles",
    "category": "Roles & Permissions",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "UserId",
        "RoleId"
      ]
    ],
    "indexes": [
      {
        "name": "idx_userroles_roleid",
        "unique": false,
        "columns": [
          "RoleId"
        ]
      },
      {
        "name": "idx_userroles_userid",
        "unique": false,
        "columns": [
          "UserId"
        ]
      },
      {
        "name": "IX_UserRoles_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "UQ_UserRoles_User_Role",
        "unique": true,
        "columns": [
          "UserId",
          "RoleId"
        ]
      },
      {
        "name": "UserRoles_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "RoleId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "AssignedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "AssignedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_UserRoles_Roles",
        "to": "Roles",
        "col": "RoleId"
      },
      {
        "from": "FK_UserRoles_Users",
        "to": "Users",
        "col": "UserId"
      }
    ]
  },
  {
    "name": "Users",
    "category": "Identity & Auth",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_users_active_created",
        "unique": false,
        "columns": [
          "CreatedDate"
        ]
      },
      {
        "name": "idx_users_email",
        "unique": false,
        "columns": [
          "Email"
        ]
      },
      {
        "name": "idx_users_email_lower_active",
        "unique": false,
        "columns": [
          "lower((Email"
        ]
      },
      {
        "name": "idx_users_isactive",
        "unique": false,
        "columns": [
          "IsActive"
        ]
      },
      {
        "name": "idx_users_isdeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "idx_users_otp_code",
        "unique": false,
        "columns": [
          "OtpCode"
        ]
      },
      {
        "name": "idx_users_reset_token",
        "unique": false,
        "columns": [
          "PasswordResetToken"
        ]
      },
      {
        "name": "IX_Users_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "Users_Email_key",
        "unique": true,
        "columns": [
          "Email"
        ]
      },
      {
        "name": "Users_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "FirstName",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "LastName",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Email",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "Phone",
        "def": "varchar(20)"
      },
      {
        "name": "PasswordHash",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CreatedDate",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "ModifiedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "DeletedDate",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "AccessToken",
        "def": "text"
      },
      {
        "name": "RefreshToken",
        "def": "text"
      },
      {
        "name": "TokenExpiresAt",
        "def": "timestamp"
      },
      {
        "name": "CurrentStatus",
        "def": "varchar(50) DEFAULT 'offline'"
      },
      {
        "name": "LocationJson",
        "def": "text"
      },
      {
        "name": "Country",
        "def": "varchar(2) DEFAULT 'US'"
      },
      {
        "name": "LastLoginAt",
        "def": "timestamp"
      },
      {
        "name": "CreatedUser",
        "def": "varchar(100) DEFAULT 'system'"
      },
      {
        "name": "ModifyUser",
        "def": "varchar(100)"
      },
      {
        "name": "ModifyDate",
        "def": "timestamp"
      },
      {
        "name": "Role",
        "def": "varchar(50) DEFAULT 'User'"
      },
      {
        "name": "Skills",
        "def": "text"
      },
      {
        "name": "PhoneNumber",
        "def": "varchar(20)"
      },
      {
        "name": "ProfilePictureUrl",
        "def": "varchar(500) DEFAULT NULL"
      },
      {
        "name": "OtpCode",
        "def": "varchar(6)"
      },
      {
        "name": "OtpExpiresAt",
        "def": "timestamp"
      },
      {
        "name": "PasswordResetToken",
        "def": "varchar(500)"
      },
      {
        "name": "PasswordResetTokenExpiresAt",
        "def": "timestamp"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "UserSignatures",
    "category": "Identity & Auth",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_usersignatures_userid",
        "unique": false,
        "columns": [
          "UserId"
        ]
      },
      {
        "name": "IX_UserSignatures_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "UserSignatures_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      },
      {
        "name": "UserSignatures_UserId_key",
        "unique": true,
        "columns": [
          "UserId"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SignatureUrl",
        "def": "varchar(1000) NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "UserSignatures_UserId_fkey",
        "to": "Users",
        "col": "UserId"
      }
    ]
  },
  {
    "name": "UserSkills",
    "category": "Identity & Auth",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [
      [
        "UserId",
        "SkillId"
      ]
    ],
    "indexes": [
      {
        "name": "idx_userskills_skillid",
        "unique": false,
        "columns": [
          "SkillId"
        ]
      },
      {
        "name": "idx_userskills_userid",
        "unique": false,
        "columns": [
          "UserId"
        ]
      },
      {
        "name": "IX_UserSkills_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "UQ_UserSkills_User_Skill",
        "unique": true,
        "columns": [
          "UserId",
          "SkillId"
        ]
      },
      {
        "name": "UserSkills_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "UserId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "SkillId",
        "def": "integer NOT NULL UNIQUE"
      },
      {
        "name": "ProficiencyLevel",
        "def": "varchar(20)"
      },
      {
        "name": "YearsOfExperience",
        "def": "integer"
      },
      {
        "name": "Certifications",
        "def": "varchar(500)"
      },
      {
        "name": "Notes",
        "def": "varchar(1000)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "AssignedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "AssignedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_UserSkills_Skills",
        "to": "Skills",
        "col": "SkillId"
      },
      {
        "from": "FK_UserSkills_Users",
        "to": "Users",
        "col": "UserId"
      }
    ]
  },
  {
    "name": "WB_ActivityLog",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_ActivityLog_Action",
        "unique": false,
        "columns": [
          "Action"
        ]
      },
      {
        "name": "IX_WB_ActivityLog_CreatedAt",
        "unique": false,
        "columns": [
          "CreatedAt"
        ]
      },
      {
        "name": "IX_WB_ActivityLog_CreatedBy",
        "unique": false,
        "columns": [
          "CreatedBy"
        ]
      },
      {
        "name": "IX_WB_ActivityLog_EntityType",
        "unique": false,
        "columns": [
          "EntityType"
        ]
      },
      {
        "name": "IX_WB_ActivityLog_SiteId",
        "unique": false,
        "columns": [
          "SiteId"
        ]
      },
      {
        "name": "IX_WB_ActivityLog_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WB_ActivityLog_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_ActivityLog_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "SiteId",
        "def": "integer NOT NULL"
      },
      {
        "name": "PageId",
        "def": "integer"
      },
      {
        "name": "Action",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "EntityType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Details",
        "def": "text"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_WB_ActivityLog_Sites",
        "to": "WB_Sites",
        "col": "SiteId"
      }
    ]
  },
  {
    "name": "WB_BrandProfiles",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_BrandProfiles_IsBuiltIn",
        "unique": false,
        "columns": [
          "IsBuiltIn"
        ]
      },
      {
        "name": "IX_WB_BrandProfiles_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_WB_BrandProfiles_Name",
        "unique": false,
        "columns": [
          "Name"
        ]
      },
      {
        "name": "IX_WB_BrandProfiles_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WB_BrandProfiles_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_BrandProfiles_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "ThemeJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "IsBuiltIn",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "WB_FormSubmissions",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_FormSubmissions_FormComponentId",
        "unique": false,
        "columns": [
          "FormComponentId"
        ]
      },
      {
        "name": "IX_WB_FormSubmissions_PageId",
        "unique": false,
        "columns": [
          "PageId"
        ]
      },
      {
        "name": "IX_WB_FormSubmissions_SiteId",
        "unique": false,
        "columns": [
          "SiteId"
        ]
      },
      {
        "name": "IX_WB_FormSubmissions_SubmittedAt",
        "unique": false,
        "columns": [
          "SubmittedAt"
        ]
      },
      {
        "name": "IX_WB_FormSubmissions_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WB_FormSubmissions_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_FormSubmissions_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "SiteId",
        "def": "integer NOT NULL"
      },
      {
        "name": "PageId",
        "def": "integer"
      },
      {
        "name": "FormComponentId",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "FormLabel",
        "def": "varchar(200) DEFAULT '' NOT NULL"
      },
      {
        "name": "PageTitle",
        "def": "varchar(200) DEFAULT '' NOT NULL"
      },
      {
        "name": "DataJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "Source",
        "def": "varchar(50) DEFAULT 'website'"
      },
      {
        "name": "WebhookStatus",
        "def": "varchar(20)"
      },
      {
        "name": "WebhookResponse",
        "def": "text"
      },
      {
        "name": "SubmittedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "IpAddress",
        "def": "varchar(45)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_WB_FormSubmissions_Pages",
        "to": "WB_Pages",
        "col": "PageId"
      },
      {
        "from": "FK_WB_FormSubmissions_Sites",
        "to": "WB_Sites",
        "col": "SiteId"
      }
    ]
  },
  {
    "name": "WB_GlobalBlocks",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_GlobalBlocks_Category",
        "unique": false,
        "columns": [
          "Category"
        ]
      },
      {
        "name": "IX_WB_GlobalBlocks_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_WB_GlobalBlocks_Name",
        "unique": false,
        "columns": [
          "Name"
        ]
      },
      {
        "name": "IX_WB_GlobalBlocks_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WB_GlobalBlocks_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_GlobalBlocks_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "ComponentJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "Category",
        "def": "varchar(100)"
      },
      {
        "name": "Tags",
        "def": "text"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "WB_GlobalBlockUsages",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_GlobalBlockUsages_BlockId",
        "unique": false,
        "columns": [
          "GlobalBlockId"
        ]
      },
      {
        "name": "IX_WB_GlobalBlockUsages_SiteId",
        "unique": false,
        "columns": [
          "SiteId"
        ]
      },
      {
        "name": "IX_WB_GlobalBlockUsages_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WB_GlobalBlockUsages_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_GlobalBlockUsages_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "GlobalBlockId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SiteId",
        "def": "integer NOT NULL"
      },
      {
        "name": "PageId",
        "def": "integer"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_WB_GlobalBlockUsages_Blocks",
        "to": "WB_GlobalBlocks",
        "col": "GlobalBlockId"
      },
      {
        "from": "FK_WB_GlobalBlockUsages_Pages",
        "to": "WB_Pages",
        "col": "PageId"
      },
      {
        "from": "FK_WB_GlobalBlockUsages_Sites",
        "to": "WB_Sites",
        "col": "SiteId"
      }
    ]
  },
  {
    "name": "WB_Media",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_Media_ContentType",
        "unique": false,
        "columns": [
          "ContentType"
        ]
      },
      {
        "name": "IX_WB_Media_Folder",
        "unique": false,
        "columns": [
          "Folder"
        ]
      },
      {
        "name": "IX_WB_Media_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_WB_Media_SiteId",
        "unique": false,
        "columns": [
          "SiteId"
        ]
      },
      {
        "name": "IX_WB_Media_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_WB_Media_UploadedAt",
        "unique": false,
        "columns": [
          "UploadedAt"
        ]
      },
      {
        "name": "WB_Media_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_Media_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "SiteId",
        "def": "integer"
      },
      {
        "name": "FileName",
        "def": "varchar(255) NOT NULL"
      },
      {
        "name": "OriginalName",
        "def": "varchar(500) NOT NULL"
      },
      {
        "name": "FilePath",
        "def": "varchar(1000) NOT NULL"
      },
      {
        "name": "FileUrl",
        "def": "varchar(2000) NOT NULL"
      },
      {
        "name": "FileSize",
        "def": "bigint DEFAULT 0 NOT NULL"
      },
      {
        "name": "ContentType",
        "def": "varchar(100) DEFAULT 'image/jpeg' NOT NULL"
      },
      {
        "name": "Width",
        "def": "integer"
      },
      {
        "name": "Height",
        "def": "integer"
      },
      {
        "name": "Folder",
        "def": "varchar(200)"
      },
      {
        "name": "AltText",
        "def": "varchar(500)"
      },
      {
        "name": "UploadedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UploadedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_WB_Media_Sites",
        "to": "WB_Sites",
        "col": "SiteId"
      }
    ]
  },
  {
    "name": "WB_Pages",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_Pages_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_WB_Pages_IsHomePage",
        "unique": false,
        "columns": [
          "SiteId",
          "IsHomePage"
        ]
      },
      {
        "name": "IX_WB_Pages_SiteId",
        "unique": false,
        "columns": [
          "SiteId"
        ]
      },
      {
        "name": "IX_WB_Pages_Slug",
        "unique": false,
        "columns": [
          "SiteId",
          "Slug"
        ]
      },
      {
        "name": "IX_WB_Pages_SortOrder",
        "unique": false,
        "columns": [
          "SiteId",
          "SortOrder"
        ]
      },
      {
        "name": "IX_WB_Pages_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WB_Pages_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_Pages_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "SiteId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Title",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Slug",
        "def": "varchar(100) DEFAULT '' NOT NULL"
      },
      {
        "name": "ComponentsJson",
        "def": "jsonb DEFAULT '[]' NOT NULL"
      },
      {
        "name": "SeoJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "TranslationsJson",
        "def": "jsonb"
      },
      {
        "name": "IsHomePage",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "SortOrder",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_WB_Pages_Sites",
        "to": "WB_Sites",
        "col": "SiteId"
      }
    ]
  },
  {
    "name": "WB_PageVersions",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_PageVersions_CreatedAt",
        "unique": false,
        "columns": [
          "CreatedAt"
        ]
      },
      {
        "name": "IX_WB_PageVersions_PageId",
        "unique": false,
        "columns": [
          "PageId"
        ]
      },
      {
        "name": "IX_WB_PageVersions_SiteId",
        "unique": false,
        "columns": [
          "SiteId"
        ]
      },
      {
        "name": "IX_WB_PageVersions_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_WB_PageVersions_Version",
        "unique": false,
        "columns": [
          "PageId",
          "VersionNumber"
        ]
      },
      {
        "name": "WB_PageVersions_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_PageVersions_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "PageId",
        "def": "integer NOT NULL"
      },
      {
        "name": "SiteId",
        "def": "integer NOT NULL"
      },
      {
        "name": "VersionNumber",
        "def": "integer DEFAULT 1 NOT NULL"
      },
      {
        "name": "ComponentsJson",
        "def": "jsonb DEFAULT '[]' NOT NULL"
      },
      {
        "name": "ChangeMessage",
        "def": "varchar(500)"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_WB_PageVersions_Pages",
        "to": "WB_Pages",
        "col": "PageId"
      },
      {
        "from": "FK_WB_PageVersions_Sites",
        "to": "WB_Sites",
        "col": "SiteId"
      }
    ]
  },
  {
    "name": "WB_Sites",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_Sites_CreatedAt",
        "unique": false,
        "columns": [
          "CreatedAt"
        ]
      },
      {
        "name": "IX_WB_Sites_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_WB_Sites_Name",
        "unique": false,
        "columns": [
          "Name"
        ]
      },
      {
        "name": "IX_WB_Sites_Published",
        "unique": false,
        "columns": [
          "Published"
        ]
      },
      {
        "name": "IX_WB_Sites_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "UQ_WB_Sites_Slug",
        "unique": true,
        "columns": [
          "Slug"
        ]
      },
      {
        "name": "WB_Sites_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_Sites_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Slug",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Favicon",
        "def": "varchar(2000)"
      },
      {
        "name": "ThemeJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "Published",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "PublishedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "PublishedUrl",
        "def": "varchar(500)"
      },
      {
        "name": "DefaultLanguage",
        "def": "varchar(10) DEFAULT 'en'"
      },
      {
        "name": "LanguagesJson",
        "def": "jsonb"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "WB_Templates",
    "category": "Website Builder",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WB_Templates_Category",
        "unique": false,
        "columns": [
          "Category"
        ]
      },
      {
        "name": "IX_WB_Templates_IsBuiltIn",
        "unique": false,
        "columns": [
          "IsBuiltIn"
        ]
      },
      {
        "name": "IX_WB_Templates_IsDeleted",
        "unique": false,
        "columns": [
          "IsDeleted"
        ]
      },
      {
        "name": "IX_WB_Templates_IsPremium",
        "unique": false,
        "columns": [
          "IsPremium"
        ]
      },
      {
        "name": "IX_WB_Templates_SortOrder",
        "unique": false,
        "columns": [
          "SortOrder"
        ]
      },
      {
        "name": "IX_WB_Templates_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WB_Templates_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name \"WB_Templates_Id_seq\" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1)"
      },
      {
        "name": "Name",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Description",
        "def": "text"
      },
      {
        "name": "Category",
        "def": "varchar(100) DEFAULT 'general' NOT NULL"
      },
      {
        "name": "PreviewImageUrl",
        "def": "varchar(2000)"
      },
      {
        "name": "ThemeJson",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "PagesJson",
        "def": "jsonb DEFAULT '[]' NOT NULL"
      },
      {
        "name": "Tags",
        "def": "text"
      },
      {
        "name": "IsPremium",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "IsBuiltIn",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "SortOrder",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100) DEFAULT 'system' NOT NULL"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "DeletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "DeletedBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "WebhookForwardJobs",
    "category": "Platform",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WebhookForwardJobs_EndpointId",
        "unique": false,
        "columns": [
          "EndpointId"
        ]
      },
      {
        "name": "IX_WebhookForwardJobs_Status_NextAttemptAt",
        "unique": false,
        "columns": [
          "Status",
          "NextAttemptAt"
        ]
      },
      {
        "name": "IX_WebhookForwardJobs_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WebhookForwardJobs_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TenantId",
        "def": "integer NOT NULL"
      },
      {
        "name": "EndpointId",
        "def": "integer NOT NULL"
      },
      {
        "name": "LogId",
        "def": "integer"
      },
      {
        "name": "ForwardUrl",
        "def": "varchar(2048) NOT NULL"
      },
      {
        "name": "Body",
        "def": "text"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "Attempts",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "MaxAttempts",
        "def": "integer DEFAULT 5 NOT NULL"
      },
      {
        "name": "NextAttemptAt",
        "def": "timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL"
      },
      {
        "name": "LastAttemptAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "LastStatusCode",
        "def": "integer"
      },
      {
        "name": "LastError",
        "def": "text"
      },
      {
        "name": "ClaimedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "ClaimedBy",
        "def": "varchar(100)"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL"
      },
      {
        "name": "CompletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "Secret",
        "def": "varchar(128)"
      }
    ],
    "foreignKeys": [
      {
        "from": "FK_WebhookForwardJobs_ExternalEndpoints_EndpointId",
        "to": "ExternalEndpoints",
        "col": "EndpointId"
      }
    ]
  },
  {
    "name": "WorkflowApprovals",
    "category": "Workflow Engine",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WorkflowApprovals_ExecutionId",
        "unique": false,
        "columns": [
          "ExecutionId"
        ]
      },
      {
        "name": "IX_WorkflowApprovals_Status",
        "unique": false,
        "columns": [
          "Status"
        ]
      },
      {
        "name": "IX_WorkflowApprovals_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WorkflowApprovals_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ExecutionId",
        "def": "integer NOT NULL"
      },
      {
        "name": "NodeId",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Title",
        "def": "varchar(200) NOT NULL"
      },
      {
        "name": "Message",
        "def": "varchar(1000)"
      },
      {
        "name": "ApproverRole",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "ApprovedById",
        "def": "varchar(100)"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'pending' NOT NULL"
      },
      {
        "name": "ResponseNote",
        "def": "varchar(500)"
      },
      {
        "name": "TimeoutHours",
        "def": "integer DEFAULT 24 NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "RespondedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "ExpiresAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "WorkflowApprovals_ExecutionId_fkey",
        "to": "WorkflowExecutions",
        "col": "ExecutionId"
      }
    ]
  },
  {
    "name": "WorkflowDefinitions",
    "category": "Workflow Engine",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WorkflowDefinitions_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WorkflowDefinitions_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "Name",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "Description",
        "def": "varchar(500)"
      },
      {
        "name": "Nodes",
        "def": "jsonb DEFAULT '[]' NOT NULL"
      },
      {
        "name": "Edges",
        "def": "jsonb DEFAULT '[]' NOT NULL"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "Version",
        "def": "integer DEFAULT 1 NOT NULL"
      },
      {
        "name": "CreatedBy",
        "def": "varchar(100)"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "UpdatedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "ModifiedBy",
        "def": "varchar(100)"
      },
      {
        "name": "IsDeleted",
        "def": "boolean DEFAULT false NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "WorkflowExecutionLogs",
    "category": "Workflow Engine",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WorkflowExecutionLogs_ExecutionId",
        "unique": false,
        "columns": [
          "ExecutionId"
        ]
      },
      {
        "name": "IX_WorkflowExecutionLogs_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WorkflowExecutionLogs_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "ExecutionId",
        "def": "integer NOT NULL"
      },
      {
        "name": "NodeId",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "NodeType",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) NOT NULL"
      },
      {
        "name": "Input",
        "def": "jsonb"
      },
      {
        "name": "Output",
        "def": "jsonb"
      },
      {
        "name": "Error",
        "def": "varchar(500)"
      },
      {
        "name": "Duration",
        "def": "integer"
      },
      {
        "name": "Timestamp",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "WorkflowExecutionLogs_ExecutionId_fkey",
        "to": "WorkflowExecutions",
        "col": "ExecutionId"
      }
    ]
  },
  {
    "name": "WorkflowExecutions",
    "category": "Workflow Engine",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WorkflowExecutions_StartedAt",
        "unique": false,
        "columns": [
          "StartedAt"
        ]
      },
      {
        "name": "IX_WorkflowExecutions_Status",
        "unique": false,
        "columns": [
          "Status"
        ]
      },
      {
        "name": "IX_WorkflowExecutions_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_WorkflowExecutions_WorkflowId",
        "unique": false,
        "columns": [
          "WorkflowId"
        ]
      },
      {
        "name": "WorkflowExecutions_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "WorkflowId",
        "def": "integer NOT NULL"
      },
      {
        "name": "TriggerEntityType",
        "def": "varchar(30) NOT NULL"
      },
      {
        "name": "TriggerEntityId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'running' NOT NULL"
      },
      {
        "name": "CurrentNodeId",
        "def": "varchar(50)"
      },
      {
        "name": "Context",
        "def": "jsonb DEFAULT '{}' NOT NULL"
      },
      {
        "name": "Error",
        "def": "varchar(1000)"
      },
      {
        "name": "StartedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "CompletedAt",
        "def": "timestamp with time zone"
      },
      {
        "name": "TriggeredBy",
        "def": "varchar(100)"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "WorkflowExecutions_WorkflowId_fkey",
        "to": "WorkflowDefinitions",
        "col": "WorkflowId"
      }
    ]
  },
  {
    "name": "WorkflowProcessedEntities",
    "category": "Workflow Engine",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_workflow_processed_entity",
        "unique": false,
        "columns": [
          "EntityType",
          "EntityId"
        ]
      },
      {
        "name": "idx_workflow_processed_trigger",
        "unique": false,
        "columns": [
          "TriggerId"
        ]
      },
      {
        "name": "idx_workflow_processed_unique",
        "unique": true,
        "columns": [
          "TriggerId",
          "EntityType",
          "EntityId",
          "ProcessedStatus"
        ]
      },
      {
        "name": "IX_WorkflowProcessedEntities_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "WorkflowProcessedEntities_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "TriggerId",
        "def": "integer NOT NULL"
      },
      {
        "name": "EntityType",
        "def": "varchar(30) NOT NULL"
      },
      {
        "name": "EntityId",
        "def": "integer NOT NULL"
      },
      {
        "name": "ProcessedStatus",
        "def": "varchar(50)"
      },
      {
        "name": "ProcessedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "ExecutionId",
        "def": "integer"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "WorkflowProcessedEntities_TriggerId_fkey",
        "to": "WorkflowTriggers",
        "col": "TriggerId"
      }
    ]
  },
  {
    "name": "WorkflowReconciliationDetails",
    "category": "Workflow Engine",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_reconciliation_details_entity",
        "unique": false,
        "columns": [
          "EntityType",
          "EntityId"
        ]
      },
      {
        "name": "idx_reconciliation_details_run",
        "unique": false,
        "columns": [
          "RunId"
        ]
      },
      {
        "name": "WorkflowReconciliationDetails_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "RunId",
        "def": "integer NOT NULL"
      },
      {
        "name": "EntityType",
        "def": "varchar(30) NOT NULL"
      },
      {
        "name": "EntityId",
        "def": "integer NOT NULL"
      },
      {
        "name": "Action",
        "def": "varchar(100) NOT NULL"
      },
      {
        "name": "CreatedEntityType",
        "def": "varchar(30)"
      },
      {
        "name": "CreatedEntityId",
        "def": "integer"
      },
      {
        "name": "Details",
        "def": "varchar(500)"
      },
      {
        "name": "Timestamp",
        "def": "timestamp DEFAULT now() NOT NULL"
      }
    ],
    "foreignKeys": [
      {
        "from": "WorkflowReconciliationDetails_RunId_fkey",
        "to": "WorkflowReconciliationRuns",
        "col": "RunId"
      }
    ]
  },
  {
    "name": "WorkflowReconciliationRuns",
    "category": "Workflow Engine",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "idx_reconciliation_runs_started",
        "unique": false,
        "columns": [
          "StartedAt"
        ]
      },
      {
        "name": "WorkflowReconciliationRuns_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "StartedAt",
        "def": "timestamp DEFAULT now() NOT NULL"
      },
      {
        "name": "CompletedAt",
        "def": "timestamp"
      },
      {
        "name": "Status",
        "def": "varchar(20) DEFAULT 'running' NOT NULL"
      },
      {
        "name": "OffersFixed",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "SalesFixed",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "ServiceOrdersFixed",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "DispatchesFixed",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "TotalFixed",
        "def": "integer DEFAULT 0 NOT NULL"
      },
      {
        "name": "Error",
        "def": "varchar(1000)"
      },
      {
        "name": "TriggeredBy",
        "def": "varchar(50) DEFAULT 'scheduled' NOT NULL"
      }
    ],
    "foreignKeys": []
  },
  {
    "name": "WorkflowTriggers",
    "category": "Workflow Engine",
    "sources": [
      "FullDatabaseTable.sql"
    ],
    "primaryKey": [
      "Id"
    ],
    "uniques": [],
    "indexes": [
      {
        "name": "IX_WorkflowTriggers_EntityType",
        "unique": false,
        "columns": [
          "EntityType"
        ]
      },
      {
        "name": "IX_WorkflowTriggers_TenantId",
        "unique": false,
        "columns": [
          "TenantId"
        ]
      },
      {
        "name": "IX_WorkflowTriggers_WorkflowId",
        "unique": false,
        "columns": [
          "WorkflowId"
        ]
      },
      {
        "name": "WorkflowTriggers_pkey",
        "unique": true,
        "columns": [
          "Id"
        ]
      }
    ],
    "columns": [
      {
        "name": "Id",
        "def": "serial PRIMARY KEY"
      },
      {
        "name": "WorkflowId",
        "def": "integer NOT NULL"
      },
      {
        "name": "NodeId",
        "def": "varchar(50) NOT NULL"
      },
      {
        "name": "EntityType",
        "def": "varchar(30) NOT NULL"
      },
      {
        "name": "FromStatus",
        "def": "varchar(30)"
      },
      {
        "name": "ToStatus",
        "def": "varchar(30)"
      },
      {
        "name": "IsActive",
        "def": "boolean DEFAULT true NOT NULL"
      },
      {
        "name": "CreatedAt",
        "def": "timestamp with time zone DEFAULT now() NOT NULL"
      },
      {
        "name": "TenantId",
        "def": "integer DEFAULT 0 NOT NULL"
      }
    ],
    "foreignKeys": []
  }
];
