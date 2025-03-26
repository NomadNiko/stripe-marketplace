import type { Metadata } from "next";
import { getServerTranslation } from "@/services/i18n";
import BusinessOnboarding from "./page-content";

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, "business");
  return {
    title: t("onboarding.title"),
  };
}

export default function Page() {
  return <BusinessOnboarding />;
}
