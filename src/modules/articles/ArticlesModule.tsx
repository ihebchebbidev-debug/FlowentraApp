import { Routes, Route } from "react-router-dom";
import ArticlesPage from "./pages/ArticlesPage";
import AddArticle from "./pages/AddArticle";
import ArticleDetail from "./pages/ArticleDetail";
import EditArticle from "./pages/EditArticle";
import { PluginGate } from "@/modules/shared/plugins";
import { PermissionRoute } from "@/components/permissions/PermissionRoute";

export function ArticlesModule() {
  return (
    <PluginGate code="PL0007ARTICLES">
      <Routes>
        <Route index element={<PermissionRoute module="articles" action="read"><ArticlesPage /></PermissionRoute>} />
        <Route path="add" element={<PermissionRoute module="articles" action="create"><AddArticle /></PermissionRoute>} />
        <Route path=":id" element={<PermissionRoute module="articles" action="read"><ArticleDetail /></PermissionRoute>} />
        <Route path=":id/edit" element={<PermissionRoute module="articles" action="update"><EditArticle /></PermissionRoute>} />
      </Routes>
    </PluginGate>
  );
}