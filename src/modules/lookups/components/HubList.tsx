import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GROUP_CATEGORIES, Category, getCategoryIcon, getCategoryTitle, Group } from "../types";
import { Link } from 'react-router-dom';

export function HubList({
  group,
  counts,
  onSelect,
}: {
  group: Group;
  counts: Record<Category, number>;
  onSelect: (c: Category) => void;
}) {
  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <Card className="shadow-card border-0 bg-card">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {GROUP_CATEGORIES[group].map((c) => {
                const Icon = getCategoryIcon(c);
                const count = counts[c];
                return (
                  <button
                    key={c}
                    className="w-full text-left p-3 sm:p-4 lg:p-6 hover:bg-muted/50 transition-colors"
                    onClick={() => onSelect(c)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground truncate">{getCategoryTitle(c)}</h4>
                            <Badge variant="secondary" className="text-xs">{count}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              <span className="text-foreground dark:text-white">Manage</span> {getCategoryTitle(c).toLowerCase()}
                            </p>
                            <Link to={`/dashboard/lookups?category=${c}&mode=category`} className="text-sm text-primary underline ml-2">Open</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
