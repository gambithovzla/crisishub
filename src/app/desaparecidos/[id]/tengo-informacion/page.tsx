import { getTranslations } from "next-intl/server";

import { PagePlaceholder } from "@/components/page-placeholder";

export default async function TipPage() {
  const t = await getTranslations("missing");
  return <PagePlaceholder title={t("haveInfo")} />;
}
