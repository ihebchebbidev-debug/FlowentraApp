import { useEffect, useMemo, useState } from "react";
import { ArticlesService, type InventoryArticle } from "../services/articles.service";

/**
 * Fetches the article asynchronously from the backend on mount / id change so
 * detail pages don't render blank on first paint (previous sync cache path
 * returned `undefined` until listAsync populated the module-level cache) and
 * stay fresh instead of showing up-to-30s stale data.
 */
export function useArticleDetail(id?: string) {
  const [article, setArticle] = useState<InventoryArticle | undefined>(() =>
    id ? ArticlesService.getById(id) : undefined
  );
  const [loading, setLoading] = useState<boolean>(!!id);

  useEffect(() => {
    if (!id) {
      setArticle(undefined);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    ArticlesService.getByIdAsync(id)
      .then((a) => {
        if (!cancelled) setArticle(a);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const derived = useMemo(() => {
    if (!article) return { stockPercentage: 0, isLowStock: false, margin: 0, marginPercentage: "0" };
    const stockPercentage = (article.stock / (article as any).maxStock) * 100;
    const isLowStock = article.stock <= (article as any).minStock;
    const margin = article.sellPrice - article.price;
    const marginPercentage = (((margin / article.price) * 100) || 0).toFixed(1);
    return { stockPercentage, isLowStock, margin, marginPercentage };
  }, [article]);

  return { article, loading, ...derived } as const;
}
