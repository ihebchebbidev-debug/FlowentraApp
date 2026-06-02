import { UnifiedDocumentsSection } from "@/modules/shared/components/documents/UnifiedDocumentsSection";

interface InstallationDocumentsTabProps {
  installationId: number;
  installationName?: string;
}

export function InstallationDocumentsTab({ installationId, installationName }: InstallationDocumentsTabProps) {
  return (
    <UnifiedDocumentsSection
      entityType="installation"
      entityId={installationId}
      moduleType="field"
      moduleName={installationName || `Installation-${installationId}`}
      showFileUpload={true}
    />
  );
}
