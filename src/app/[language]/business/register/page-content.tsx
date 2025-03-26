"use client";
import { useTranslation } from "@/services/i18n/client";
import GuestRouteGuard from "@/services/auth/guest-route-guard";
import { Container, Title } from "@mantine/core";
import { BusinessRegistrationForm } from "@/components/business/registration-form";

function BusinessRegistrationContent() {
  const { t } = useTranslation("business");

  return (
    <Container size="sm">
      <Title order={2} mb="lg">
        {t("register.title")}
      </Title>
      <BusinessRegistrationForm />
    </Container>
  );
}

export default function BusinessRegistration() {
  return (
    <GuestRouteGuard>
      <BusinessRegistrationContent />
    </GuestRouteGuard>
  );
}
