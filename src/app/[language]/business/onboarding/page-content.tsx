"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/services/i18n/client";
import { useRouter, useSearchParams } from "next/navigation";
import useAuth from "@/services/auth/use-auth";
import {
  Container,
  Title,
  Card,
  Text,
  Loader,
  Center,
  Button,
  Alert,
  Stack,
} from "@mantine/core";
import StripeConnectOnboarding from "@/components/stripe/connect-onboarding";
import { useGetMyBusinesses } from "@/services/api/services/business";
import { RoleEnum } from "@/services/api/types/role";
import BusinessRouteGuard from "@/services/auth/business-route-guard";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { Business } from "@/services/api/types/business";
import { useCheckOnboardingStatus } from "@/services/api/services/stripe";

function BusinessOnboardingContent() {
  const { t } = useTranslation("business");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyComplete, setAlreadyComplete] = useState(false);

  const getMyBusinesses = useGetMyBusinesses();
  const checkOnboardingStatus = useCheckOnboardingStatus();

  // Get selected business ID from URL or use the first one
  useEffect(() => {
    const fetchBusinesses = async () => {
      console.log("Fetching businesses for user:", user?.id);
      try {
        setLoading(true);
        const response = await getMyBusinesses();
        console.log("MyBusinesses API response:", response);

        // Handle standardized response format
        let businessesArray: Business[] = [];
        if (response.status === HTTP_CODES_ENUM.OK) {
          if (response.data.data && Array.isArray(response.data.data)) {
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
        let selectedBusinessId: string;

        if (paramBusinessId) {
          // Check if the user has access to this business
          const hasBusiness = businessesArray.some(
            (b: Business) => b.id === paramBusinessId
          );

          if (hasBusiness) {
            selectedBusinessId = paramBusinessId;
            console.log("Using business ID from URL:", paramBusinessId);
          } else {
            selectedBusinessId = businessesArray[0].id;
            console.log(
              "Using first available business:",
              businessesArray[0].id
            );
          }
        } else {
          // Use the first business
          selectedBusinessId = businessesArray[0].id;
          console.log("Using first business:", businessesArray[0].id);
        }

        setBusinessId(selectedBusinessId);

        // Check if onboarding is already complete
        try {
          const statusResponse = await checkOnboardingStatus({
            businessId: selectedBusinessId,
          });

          if (
            statusResponse.status === HTTP_CODES_ENUM.OK &&
            statusResponse.data.isComplete
          ) {
            setAlreadyComplete(true);
          }
        } catch (statusError) {
          console.error("Error checking onboarding status:", statusError);
          // If status check fails, continue with onboarding flow
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
      String(user.role.id) === String(RoleEnum.BUSINESS)
    ) {
      fetchBusinesses();
    } else {
      console.log("User not logged in or not a business user:", user);
      setLoading(false);
    }
  }, [user, searchParams, getMyBusinesses, checkOnboardingStatus]);

  const handleOnboardingComplete = () => {
    router.push("/business/dashboard");
  };

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
        <Card
          shadow="xs"
          p="md"
          withBorder
          style={{ backgroundColor: "#1C283A", color: "white" }}
        >
          <Alert color="red">{t(`onboarding.errors.${error}`)}</Alert>
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
        <Card
          shadow="xs"
          p="md"
          withBorder
          style={{ backgroundColor: "#1C283A", color: "white" }}
        >
          <Text color="white">{t("onboarding.noBusiness")}</Text>
        </Card>
      </Container>
    );
  }

  // Already completed view
  if (alreadyComplete) {
    return (
      <Container size="md">
        <Stack gap="md">
          <Title order={2} mb="lg">
            {t("onboarding.title")}
          </Title>
          <Card
            shadow="xs"
            p="md"
            withBorder
            style={{ backgroundColor: "#1C283A", color: "white" }}
          >
            <Center py="md">
              <Stack align="center" gap="md">
                <Text size="lg" ta="center" c="white">
                  {t("onboarding.alreadyComplete")}
                </Text>
                <Button onClick={() => router.push("/business/dashboard")}>
                  {t("onboarding.goToDashboard")}
                </Button>
              </Stack>
            </Center>
          </Card>
        </Stack>
      </Container>
    );
  }

  // Main onboarding view - always show onboarding instead of toggle
  return (
    <Container size="md">
      <Title order={2} mb="lg">
        {t("onboarding.title")}
      </Title>
      <Card
        shadow="xs"
        p="md"
        withBorder
        style={{ backgroundColor: "#1C283A", color: "white" }}
        mb="md"
      >
        <Text color="white">{t("onboarding.description")}</Text>
      </Card>
      {/* Always display the onboarding component when businessId is set */}
      <StripeConnectOnboarding
        businessId={businessId}
        onComplete={handleOnboardingComplete}
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
