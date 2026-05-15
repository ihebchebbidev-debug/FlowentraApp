import { useMemo, useState, useEffect } from "react";
import { ArticlesService, type InventoryArticle } from "../services/articles.service";
import { Package, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { useLookups } from "@/shared/contexts/LookupsContext";
import { usePreferences } from "@/hooks/usePreferences";

export type ListViewMode = "grid" | "list";

export function useArticlesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { preferences } = usePreferences();
  
  // Initialize viewMode from user preferences
  const getInitialViewMode = (): ListViewMode => {
    try {
      const localPrefs = localStorage.getItem('user-preferences');
      if (localPrefs) {
        const prefs = JSON.parse(localPrefs);
        // Map 'table' preference to 'list' for this component
        if (prefs.dataView === 'table' || prefs.dataView === 'list') return 'list';
        if (prefs.dataView === 'grid') return 'grid';
      }
    } catch (e) {}
    return 'list';
  };
  
  const [viewMode, setViewMode] = useState<ListViewMode>(getInitialViewMode);
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [filterCategory, setFilterCategory] = useState<"all" | string>("all");
  
  // Update viewMode when preferences change
  useEffect(() => {
    if (preferences?.dataView) {
      const newMode = preferences.dataView === 'grid' ? 'grid' : 'list';
      setViewMode(newMode as ListViewMode);
    }
  }, [preferences?.dataView]);
  
  const { articleCategories, serviceCategories, locations } = useLookups();

  const rawArticles = ArticlesService.list();
  
  // Map category and location IDs to names
  const allArticles = useMemo(() => {
    const allCategories = [...articleCategories, ...serviceCategories];
    
    return rawArticles.map(article => {
      // Find category name by ID (handle both string and number IDs)
      const categoryId = parseInt(article.category, 10);
      const categoryLookup = !isNaN(categoryId) 
        ? allCategories.find(c => Number(c.id) === categoryId)
        : null;
      
      // Find location name by ID
      const locationId = parseInt(article.location || '', 10);
      const locationLookup = !isNaN(locationId) 
        ? locations.find(l => Number(l.id) === locationId)
        : null;
      
      return {
        ...article,
        category: categoryLookup?.name || article.category,
        location: locationLookup?.name || article.location,
      };
    });
  }, [rawArticles, articleCategories, serviceCategories, locations]);

  const filteredArticles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allArticles.filter((article) => {
      const matchesSearch =
        article.name.toLowerCase().includes(term) ||
        article.sku.toLowerCase().includes(term) ||
        article.category.toLowerCase().includes(term) ||
        (article.supplier?.toLowerCase().includes(term) ?? false);
      const matchesStatus = filterStatus === "all" || article.status === filterStatus;
      const matchesCategory = filterCategory === "all" || article.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allArticles, searchTerm, filterStatus, filterCategory]);

  const stats = useMemo(() => {
    const totalValue = allArticles.reduce((sum, a) => sum + a.stock * a.sellPrice, 0);
    return [
      { label: "stats.total_articles", value: allArticles.length, change: "+12%", icon: Package, color: "chart-1" },
      { label: "stats.available", value: allArticles.filter(a => a.status === "available").length, change: "+8%", icon: CheckCircle, color: "chart-2" },
      { label: "stats.low_stock", value: allArticles.filter(a => a.status === "low_stock").length, change: "+3%", icon: AlertTriangle, color: "chart-3" },
      { label: "stats.total_value", value: `${totalValue.toLocaleString()} TND`, change: "+15%", icon: DollarSign, color: "chart-4" },
    ];
  }, [allArticles]);

  return {
    // state
    searchTerm, setSearchTerm,
    viewMode, setViewMode,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,

    // data
    allArticles,
    filteredArticles,
    stats,
  } as const;
}
