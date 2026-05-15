import { useTranslation } from "react-i18next";
import { UnifiedDocumentsSection } from "@/modules/shared/components/documents/UnifiedDocumentsSection";
import { Project } from "../../types";

interface ProjectDocumentsTabProps {
  project: Project | null;
}

export function ProjectDocumentsTab({ project }: ProjectDocumentsTabProps) {
  const { t } = useTranslation("tasks");

  if (!project) return null;

  return (
    <div>
      <UnifiedDocumentsSection
        entityType="project"
        entityId={project.id}
        moduleType="projects"
        showFileUpload={false}
      />
    </div>
  );
}
