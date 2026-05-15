import { Routes, Route } from "react-router-dom";
import { ArticlesList } from "./components/ArticlesList";
import ArticleDetail from "./pages/ArticleDetail";
import AddArticle from "./pages/AddArticle";
import { PluginGate } from "@/modules/shared/plugins";

export function ArticlesModule() {
  return (
    <PluginGate code="PL0008INVSERVICES">
      <Routes>
        <Route index element={<ArticlesList />} />
        <Route path="add" element={<AddArticle />} />
        <Route path=":id" element={<ArticleDetail />} />
      </Routes>
    </PluginGate>
  );
}
