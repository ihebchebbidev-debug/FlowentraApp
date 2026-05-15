import { Routes, Route } from "react-router-dom";
import ArticlesPage from "./pages/ArticlesPage";
import AddArticle from "./pages/AddArticle";
import ArticleDetail from "./pages/ArticleDetail";
import EditArticle from "./pages/EditArticle";
import { PluginGate } from "@/modules/shared/plugins";

export function ArticlesModule() {
  return (
    <PluginGate code="PL0007ARTICLES">
      <Routes>
        <Route index element={<ArticlesPage />} />
        <Route path="add" element={<AddArticle />} />
        <Route path=":id" element={<ArticleDetail />} />
        <Route path=":id/edit" element={<EditArticle />} />
      </Routes>
      </PluginGate>
  );
}