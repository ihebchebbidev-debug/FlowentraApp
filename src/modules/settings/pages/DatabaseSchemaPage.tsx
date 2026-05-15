import { useMemo, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { DB_SCHEMA, type DbTableSchema, type DbForeignKey } from "../data/dbSchema.generated";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Database,
  KeyRound,
  Link2,
  Search,
  Table as TableIcon,
  ExternalLink,
  Hash,
  Fingerprint,
  ChevronRight,
} from "lucide-react";

const MermaidDiagram = lazy(() => import("../components/MermaidDiagram"));

type IncomingFk = { fromTable: string; fromCol: string; toCol: string };

function buildIncomingMap(schema: DbTableSchema[]): Map<string, IncomingFk[]> {
  const map = new Map<string, IncomingFk[]>();
  for (const t of schema) {
    for (const fk of t.foreignKeys) {
      const arr = map.get(fk.to) ?? [];
      arr.push({ fromTable: t.name, fromCol: fk.from, toCol: fk.col });
      map.set(fk.to, arr);
    }
  }
  return map;
}

function parseColAttrs(def: string) {
  const upper = def.toUpperCase();
  const typeMatch = def.match(/^([A-Za-z]+(?:\s*\([^)]+\))?)/);
  const defaultMatch = def.match(/DEFAULT\s+([^,\s]+(?:\s*\([^)]*\))?)/i);
  return {
    type: typeMatch?.[1].trim() ?? def.split(/\s+/)[0],
    notNull: /NOT\s+NULL/.test(upper),
    isPk: /PRIMARY\s+KEY/.test(upper) || /SERIAL/.test(upper),
    isUnique: /\bUNIQUE\b/.test(upper),
    default: defaultMatch?.[1] ?? null,
  };
}

function buildErDiagram(tables: DbTableSchema[]) {
  const lines = ["erDiagram"];
  const known = new Set(tables.map((t) => t.name));
  for (const t of tables) {
    const safe = t.name.replace(/[^A-Za-z0-9_]/g, "_");
    const previewCols = t.columns.slice(0, 5).map((c) => {
      const a = parseColAttrs(c.def);
      const type = a.type.replace(/[^A-Za-z0-9]/g, "").toLowerCase() || "any";
      const name = c.name.replace(/[^A-Za-z0-9_]/g, "_");
      const marker = a.isPk ? " PK" : t.foreignKeys.find((f) => f.from === c.name) ? " FK" : "";
      return `    ${type} ${name}${marker}`;
    });
    lines.push(`  ${safe} {`);
    lines.push(...previewCols);
    if (t.columns.length > 5)
      lines.push(`    more _plus_${t.columns.length - 5}_more`);
    lines.push("  }");
  }
  for (const t of tables) {
    const from = t.name.replace(/[^A-Za-z0-9_]/g, "_");
    for (const fk of t.foreignKeys) {
      if (!known.has(fk.to)) continue;
      const to = fk.to.replace(/[^A-Za-z0-9_]/g, "_");
      lines.push(`  ${to} ||--o{ ${from} : "${fk.from}"`);
    }
  }
  return lines.join("\n");
}

export default function DatabaseSchemaPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showDiagram, setShowDiagram] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const incomingMap = useMemo(() => buildIncomingMap(DB_SCHEMA), []);
  const byName = useMemo(() => new Map(DB_SCHEMA.map((t) => [t.name, t])), []);

  const stats = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of DB_SCHEMA) m.set(t.category, (m.get(t.category) ?? 0) + 1);
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, []);

  const totals = useMemo(
    () => ({
      tables: DB_SCHEMA.length,
      columns: DB_SCHEMA.reduce((a, t) => a + t.columns.length, 0),
      fks: DB_SCHEMA.reduce((a, t) => a + t.foreignKeys.length, 0),
      indexes: DB_SCHEMA.reduce((a, t) => a + t.indexes.length, 0),
      modules: stats.length,
    }),
    [stats],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DB_SCHEMA.filter((t) => {
      if (activeCategory && t.category !== activeCategory) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q)) ||
        t.foreignKeys.some((f) => f.to.toLowerCase().includes(q))
      );
    });
  }, [query, activeCategory]);

  const grouped = useMemo(() => {
    const m = new Map<string, DbTableSchema[]>();
    for (const t of filtered) {
      const arr = m.get(t.category) ?? [];
      arr.push(t);
      m.set(t.category, arr);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const erMermaid = useMemo(
    () => buildErDiagram(activeCategory ? filtered : filtered.slice(0, 25)),
    [filtered, activeCategory],
  );

  const selectedTable = selected ? byName.get(selected) ?? null : null;
  const selectedIncoming = selected ? incomingMap.get(selected) ?? [] : [];

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden p-4 md:p-6 space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/settings/documentation">
            <ArrowLeft className="h-4 w-4 mr-1" /> Documentation
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Database Schema
          </h1>
          <p className="text-sm text-muted-foreground">
            Auto-generated from <code>Backend/**/*.sql</code>. Click any table to inspect every
            column attribute, foreign key, index, and incoming relationship.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Tables" value={totals.tables} icon={<TableIcon className="h-4 w-4" />} />
        <StatCard label="Columns" value={totals.columns} icon={<KeyRound className="h-4 w-4" />} />
        <StatCard label="Foreign keys" value={totals.fks} icon={<Link2 className="h-4 w-4" />} />
        <StatCard label="Indexes" value={totals.indexes} icon={<Hash className="h-4 w-4" />} />
        <StatCard label="Modules" value={totals.modules} icon={<Database className="h-4 w-4" />} />
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table, column, FK target, or module…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          variant={showDiagram ? "default" : "outline"}
          onClick={() => setShowDiagram((v) => !v)}
        >
          {showDiagram ? "Hide" : "Show"} ER diagram
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveCategory(null)}
        >
          All ({DB_SCHEMA.length})
        </Badge>
        {stats.map(([cat, count]) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
          >
            {cat} · {count}
          </Badge>
        ))}
      </div>

      {showDiagram && (
        <Card className="p-4 overflow-auto max-h-[70vh]">
          <p className="text-xs text-muted-foreground mb-2">
            {activeCategory
              ? `ER diagram — ${activeCategory} (${filtered.length} tables)`
              : `ER overview — first 25 of ${filtered.length} matching tables. Pick a module above to see its full diagram.`}
          </p>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading diagram…</p>}>
            <MermaidDiagram chart={erMermaid} />
          </Suspense>
        </Card>
      )}

      <div className="space-y-6">
        {grouped.map(([cat, list]) => (
          <section key={cat}>
            <h2 className="text-lg font-semibold mb-3 sticky top-0 bg-background/90 backdrop-blur z-10 py-1">
              {cat}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                · {list.length} {list.length === 1 ? "table" : "tables"}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((t) => {
                const incoming = incomingMap.get(t.name)?.length ?? 0;
                return (
                  <button
                    key={t.name}
                    onClick={() => setSelected(t.name)}
                    className="text-left border rounded-md bg-card hover:bg-accent/40 hover:border-primary/40 transition p-3 group min-w-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <code className="font-mono text-sm font-semibold truncate">{t.name}</code>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {t.columns.length} cols
                      </Badge>
                      {t.foreignKeys.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          → {t.foreignKeys.length} FK
                        </Badge>
                      )}
                      {incoming > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          ← {incoming} ref
                        </Badge>
                      )}
                      {t.indexes.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {t.indexes.length} idx
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {grouped.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            No tables match your filter.
          </p>
        )}
      </div>

      <TableDetailDialog
        table={selectedTable}
        incoming={selectedIncoming}
        onClose={() => setSelected(null)}
        onJump={(name) => byName.has(name) && setSelected(name)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-3 flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground truncate">{label}</div>
        <div className="text-xl font-semibold">{value.toLocaleString()}</div>
      </div>
    </Card>
  );
}

function TableDetailDialog({
  table,
  incoming,
  onClose,
  onJump,
}: {
  table: DbTableSchema | null;
  incoming: IncomingFk[];
  onClose: () => void;
  onJump: (name: string) => void;
}) {
  if (!table) return null;
  const fkByCol = new Map<string, DbForeignKey>();
  for (const fk of table.foreignKeys) fkByCol.set(fk.from, fk);
  const pkSet = new Set(table.primaryKey ?? []);

  return (
    <Dialog open={!!table} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="font-mono text-lg flex items-center gap-2 flex-wrap">
            <TableIcon className="h-5 w-5 text-primary" />
            {table.name}
            <Badge variant="secondary">{table.category}</Badge>
          </DialogTitle>
          <DialogDescription>
            {table.columns.length} columns · {table.foreignKeys.length} outgoing FK ·{" "}
            {incoming.length} incoming reference{incoming.length === 1 ? "" : "s"} ·{" "}
            {table.indexes.length} index{table.indexes.length === 1 ? "" : "es"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh]">
          <div className="p-4 space-y-5">
            {/* Columns */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Columns
              </h3>
              <div className="border rounded overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="text-left px-2 py-1.5 font-medium">Column</th>
                      <th className="text-left px-2 py-1.5 font-medium">Type</th>
                      <th className="text-left px-2 py-1.5 font-medium">Attributes</th>
                      <th className="text-left px-2 py-1.5 font-medium">Default</th>
                      <th className="text-left px-2 py-1.5 font-medium">References</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((c) => {
                      const a = parseColAttrs(c.def);
                      const fk = fkByCol.get(c.name);
                      const isPk = a.isPk || pkSet.has(c.name);
                      return (
                        <tr key={c.name} className="border-t align-top">
                          <td className="px-2 py-1.5 font-mono whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              {isPk && (
                                <KeyRound
                                  className="h-3 w-3 text-amber-500"
                                  aria-label="Primary key"
                                />
                              )}
                              {fk && (
                                <Link2
                                  className="h-3 w-3 text-blue-500"
                                  aria-label="Foreign key"
                                />
                              )}
                              {c.name}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 font-mono text-muted-foreground whitespace-nowrap">
                            {a.type}
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex flex-wrap gap-1">
                              {isPk && (
                                <Badge variant="outline" className="text-[9px] py-0">
                                  PK
                                </Badge>
                              )}
                              {a.notNull && (
                                <Badge variant="outline" className="text-[9px] py-0">
                                  NOT NULL
                                </Badge>
                              )}
                              {a.isUnique && (
                                <Badge variant="outline" className="text-[9px] py-0">
                                  UNIQUE
                                </Badge>
                              )}
                              {fk && (
                                <Badge variant="outline" className="text-[9px] py-0">
                                  FK
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1.5 font-mono text-muted-foreground">
                            {a.default ?? <span className="opacity-40">—</span>}
                          </td>
                          <td className="px-2 py-1.5">
                            {fk ? (
                              <button
                                onClick={() => onJump(fk.to)}
                                className="font-mono text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                {fk.to}.{fk.col}
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="opacity-40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Relationships */}
            <div className="grid md:grid-cols-2 gap-4">
              <section>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" /> Outgoing references
                </h3>
                {table.foreignKeys.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    This table doesn't reference any other table.
                  </p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {table.foreignKeys.map((fk, i) => (
                      <li key={i} className="font-mono">
                        <code>{fk.from}</code>{" "}
                        <span className="text-muted-foreground">→</span>{" "}
                        <button
                          onClick={() => onJump(fk.to)}
                          className="text-blue-600 hover:underline"
                        >
                          {fk.to}.{fk.col}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5 rotate-180" /> Referenced by
                </h3>
                {incoming.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No other table references this one.
                  </p>
                ) : (
                  <ul className="text-xs space-y-1 max-h-48 overflow-auto">
                    {incoming.map((inc, i) => (
                      <li key={i} className="font-mono">
                        <button
                          onClick={() => onJump(inc.fromTable)}
                          className="text-blue-600 hover:underline"
                        >
                          {inc.fromTable}.{inc.fromCol}
                        </button>{" "}
                        <span className="text-muted-foreground">→</span> <code>{inc.toCol}</code>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Indexes & Uniques */}
            <div className="grid md:grid-cols-2 gap-4">
              <section>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" /> Indexes
                </h3>
                {table.indexes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No declared indexes.</p>
                ) : (
                  <ul className="text-xs space-y-1">
                    {table.indexes.map((idx) => (
                      <li key={idx.name} className="font-mono">
                        <span className="text-muted-foreground">{idx.name}</span>
                        {idx.unique && (
                          <Badge variant="outline" className="ml-1 text-[9px] py-0">
                            UNIQUE
                          </Badge>
                        )}{" "}
                        <span className="opacity-60">({idx.columns.join(", ")})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-1">
                  <Fingerprint className="h-3.5 w-3.5" /> Constraints
                </h3>
                <ul className="text-xs space-y-1 font-mono">
                  {table.primaryKey && (
                    <li>
                      <Badge variant="outline" className="text-[9px] py-0 mr-1">
                        PK
                      </Badge>
                      ({table.primaryKey.join(", ")})
                    </li>
                  )}
                  {table.uniques.map((u, i) => (
                    <li key={i}>
                      <Badge variant="outline" className="text-[9px] py-0 mr-1">
                        UNIQUE
                      </Badge>
                      ({u.join(", ")})
                    </li>
                  ))}
                  {!table.primaryKey && table.uniques.length === 0 && (
                    <li className="text-muted-foreground italic">
                      No table-level constraints declared.
                    </li>
                  )}
                </ul>
              </section>
            </div>

            {/* Sources */}
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                Source files
              </h3>
              <ul className="text-[11px] text-muted-foreground space-y-0.5">
                {table.sources.map((s) => (
                  <li key={s} className="font-mono break-all">
                    Backend/{s}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
