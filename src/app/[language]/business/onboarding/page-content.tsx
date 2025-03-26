// src/app/[language]/business/onboarding/page-content.tsx
"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import useAuth from "@/services/auth/use-auth";
import { Container, Title, Card, Text, Loader, Center } from "@mantine/core";
import { StripeOnboardingEmbed } from "@/components/stripe/onboarding-embed";
import { useGetMyBusinesses } from "@/services/api/services/business";
import { RoleEnum } from "@/services/api/types/role";
import BusinessRouteGuard from "@/services/auth/business-route-guard";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Business } from "@/services/api/types/business";

function BusinessOnboardingContent() {
  const { t } = useTranslation("business");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const getMyBusinesses = useGetMyBusinesses();

  // Get selected business ID from URL or use the first one
  useEffect(() => {
    const fetchBusinesses = async () => {
      console.log("Fetching businesses for user:", user?.id);
      try {
        const response = await getMyBusinesses();
        console.log("MyBusinesses API response:", response);

        // Handle the case where the API returns a direct array instead of {data, hasNextPage} format
        let businessesArray: Business[] = [];

        if (response.status === HTTP_CODES_ENUM.OK) {
          if (Array.isArray(response.data)) {
            businessesArray = response.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            businessesArray = response.data.data;
          }
        }

        if (!businessesArray.length) {
          console.error("No businesses found or API error", response);
          setError("noBusiness");
          setLoading(false);
          return;
        }

        const paramBusinessId = searchParams.get("businessId");
        if (paramBusinessId) {
          // Check if the user has access to this business
          const hasBusiness = businessesArray.some(
            (b: Business) => b.id === paramBusinessId
          );
          if (hasBusiness) {
            setBusinessId(paramBusinessId);
            console.log("Using business ID from URL:", paramBusinessId);
          } else {
            setBusinessId(businessesArray[0].id);
            console.log(
              "Using first available business:",
              businessesArray[0].id
            );
          }
        } else {
          // Use the first business
          setBusinessId(businessesArray[0].id);
          console.log("Using first business:", businessesArray[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching businesses:", error);
        setError("fetchError");
        setLoading(false);
      }
    };

    // Only fetch businesses if the user is logged in and has the business role
    if (
      user &&
      user.role?.id &&
      (user.role.id === RoleEnum.BUSINESS ||
        user.role.id === String(RoleEnum.BUSINESS))
    ) {
      fetchBusinesses();
    } else {
      console.log("User not logged in or not a business user:", user);
      setLoading(false);
    }
  }, [user, searchParams, getMyBusinesses]);

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="sm">
        <Title order={2} mb="lg">
          {t("onboarding.title")}
        </Title>
        <Card shadow="xs" p="md" withBorder>
          <Text color="red">{t(`onboarding.errors.${error}`)}</Text>
        </Card>
      </Container>
    );
  }

  if (!businessId) {
    return (
      <Container size="sm">
        <Title order={2} mb="lg">
          {t("onboarding.title")}
        </Title>
        <Card shadow="xs" p="md" withBorder>
          <Text>{t("onboarding.noBusiness")}</Text>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="md">
      <Title order={2} mb="lg">
        {t("onboarding.title")}
      </Title>
      <Card shadow="xs" p="md" withBorder mb="md">
        <Text>{t("onboarding.description")}</Text>
      </Card>
      <StripeOnboardingEmbed
        businessId={businessId}
        onComplete={() => router.push("/business/dashboard")}
      />
    </Container>
  );
}

export default function BusinessOnboarding() {
  return (
    <BusinessRouteGuard>
      <BusinessOnboardingContent />
    </BusinessRouteGuard>
  );
}
