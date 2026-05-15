import { useMemo } from "react";
import { ArticlesService } from "../services/articles.service";

export function useArticleDetail(id?: string) {
  const article = id ? ArticlesService.getById(id) : undefined;

  const derived = useMemo(() => {
    if (!article) return { stockPercentage: 0, isLowStock: false, margin: 0, marginPercentage: "0" };
    const stockPercentage = (article.stock / (article as any).maxStock) * 100;
    const isLowStock = article.stock <= (article as any).minStock;
    const margin = article.sellPrice - article.price;
    const marginPercentage = (((margin / article.price) * 100) || 0).toFixed(1);
    return { stockPercentage, isLowStock, margin, marginPercentage };
  }, [article]);

  return { article, ...derived } as const;
}
