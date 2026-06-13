import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { dealsApi, type CreateDealRequest } from "@/services/api/dealsApi";
import { DealForm } from "../components/DealForm";

export function AddDeal() {
  const { t } = useTranslation("deals");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  // When launched from a project ("New deal" in the project Deals tab), pre-link it.
  const projectIdParam = searchParams.get("projectId");
  const initial = projectIdParam ? { projectId: Number(projectIdParam) } : undefined;

  const handleSubmit = async (payload: CreateDealRequest) => {
    setSubmitting(true);
    try {
      const deal = await dealsApi.create(payload);
      toast.success(t("toast.created"));
      navigate(`/dashboard/deals/${deal.id}`);
    } catch {
      toast.error(t("toast.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  return <DealForm mode="add" initial={initial} submitting={submitting} onSubmit={handleSubmit} />;
}

export default AddDeal;
