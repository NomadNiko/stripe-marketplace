"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/services/i18n/client";
import {
  Card,
  Button,
  Text,
  Stack,
  Progress,
  Center,
  Loader,
  Alert,
  Box,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import {
  useCreateConnectAccount,
  useCreateAccountLink,
  useGetAccountStatus,
  useUpdateBusinessStripeStatus,
  AccountStatusResponse,
} from "@/services/api/services/stripe";
import { useGetBusiness } from "@/services/api/services/business";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useGlobalLoading from "@/services/loading/use-global-loading";
import useLanguage from "@/services/i18n/use-language";

type StripeOnboardingEmbedProps = {
  businessId: string;
  onComplete?: () => void;
};

type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "checking"
  | "completed"
  | "error";

export function StripeOnboardingEmbed({
  businessId,
  onComplete,
}: StripeOnboardingEmbedProps) {
  const { t } = useTranslation("stripe");
  const language = useLanguage();
  const { setLoading } = useGlobalLoading();
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus>("checking");
  const [accountLinkUrl, setAccountLinkUrl] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [statusDetails, setStatusDetails] =
    useState<AccountStatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingInterval, setCheckingInterval] = useState<number | null>(null);

  // API hooks
  const createConnectAccount = useCreateConnectAccount();
  const createAccountLink = useCreateAccountLink();
  const getAccountStatus = useGetAccountStatus();
  const updateBusinessStripeStatus = useUpdateBusinessStripeStatus();
  const getBusiness = useGetBusiness();

  // Function to check Stripe account status
  const checkStripeAccountStatus = useCallback(
    async (accountId: string) => {
      try {
        const response = await getAccountStatus({ accountId });

        if (response.status !== HTTP_CODES_ENUM.OK) {
          setErrorMessage(t("onboarding.errors.checkingStripeStatus"));
          setOnboardingStatus("error");
          return;
        }

        setStatusDetails(response.data);

        // Update business with latest status from Stripe
        await updateBusinessStripeStatus(undefined, { accountId });

        // If onboarding is complete
        if (
          response.data.detailsSubmitted &&
          response.data.chargesEnabled &&
          response.data.payoutsEnabled
        ) {
          setOnboardingStatus("completed");

          if (onComplete) {
            onComplete();
          }
        } else {
          // Onboarding is not complete
          setOnboardingStatus("in_progress");
        }
      } catch (error) {
        console.error("Error checking Stripe account status:", error);
        setErrorMessage(t("onboarding.errors.checkingStripeStatus"));
        setOnboardingStatus("error");
      }
    },
    [getAccountStatus, t, updateBusinessStripeStatus, onComplete]
  );

  // Function to create Stripe account and start onboarding
  const startOnboarding = useCallback(async () => {
    setLoading(true);

    try {
      // Create Stripe Connect account if not exists
      if (!stripeAccountId) {
        const accountResponse = await createConnectAccount(undefined, {
          businessId,
        });

        if (accountResponse.status !== HTTP_CODES_ENUM.OK) {
          setErrorMessage(t("onboarding.errors.creatingAccount"));
          setOnboardingStatus("error");
          setLoading(false);
          return;
        }

        setStripeAccountId(accountResponse.data);
      }

      // Create account link for onboarding
      const baseUrl = window.location.origin;
      const response = await createAccountLink({
        accountId: stripeAccountId || "",
        refreshUrl: `${baseUrl}/${language}/business/onboarding?businessId=${businessId}&refresh=true`,
        returnUrl: `${baseUrl}/${language}/business/onboarding?businessId=${businessId}&completed=true`,
      });

      if (response.status !== HTTP_CODES_ENUM.OK) {
        setErrorMessage(t("onboarding.errors.creatingAccountLink"));
        setOnboardingStatus("error");
        setLoading(false);
        return;
      }

      // Redirect to onboarding URL
      if (accountLinkUrl) {
        console.log("redirecting to " + accountLinkUrl);
      }
      setAccountLinkUrl(response.data.url);
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error starting onboarding:", error);
      setErrorMessage(t("onboarding.errors.startingOnboarding"));
      setOnboardingStatus("error");
    } finally {
      setLoading(false);
    }
  }, [
    businessId,
    createAccountLink,
    createConnectAccount,
    language,
    setLoading,
    stripeAccountId,
    t,
    accountLinkUrl,
  ]);

  // Function to check the business Stripe account status
  const checkBusinessStatus = useCallback(async () => {
    try {
      const businessResponse = await getBusiness({ id: businessId });

      if (businessResponse.status !== HTTP_CODES_ENUM.OK) {
        setErrorMessage(t("onboarding.errors.businessNotFound"));
        setOnboardingStatus("error");
        return;
      }

      const business = businessResponse.data;

      if (business.active) {
        // Business is already fully onboarded and active
        setOnboardingStatus("completed");

        if (onComplete) {
          onComplete();
        }
        return;
      }

      // If the business has a Stripe account ID
      if (business.stripeAccountId) {
        setStripeAccountId(business.stripeAccountId);

        // Check the Stripe account status
        await checkStripeAccountStatus(business.stripeAccountId);
      } else {
        // No Stripe account yet, start onboarding
        setOnboardingStatus("not_started");
      }
    } catch (error) {
      console.error("Error checking business status:", error);
      setErrorMessage(t("onboarding.errors.checkingStatus"));
      setOnboardingStatus("error");
    }
  }, [businessId, checkStripeAccountStatus, getBusiness, onComplete, t]);

  // Effect to check business status on mount
  useEffect(() => {
    checkBusinessStatus();

    // Clean up interval on unmount
    return () => {
      if (checkingInterval) {
        window.clearInterval(checkingInterval);
      }
    };
  }, [businessId, checkBusinessStatus, checkingInterval]);

  // Effect to handle URL parameters (refresh, completed)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isRefresh = urlParams.get("refresh") === "true";
    const isCompleted = urlParams.get("completed") === "true";

    if (isRefresh && stripeAccountId) {
      // If refreshing, create a new account link
      startOnboarding();
    }

    if (isCompleted && stripeAccountId) {
      // If completed, start checking status periodically
      setOnboardingStatus("checking");

      // Check status immediately
      checkStripeAccountStatus(stripeAccountId);

      // Then check every 5 seconds until onboarding is completed
      const interval = window.setInterval(() => {
        if (onboardingStatus === "completed") {
          window.clearInterval(interval);
          return;
        }

        checkStripeAccountStatus(stripeAccountId);
      }, 5000);

      setCheckingInterval(interval);

      // Clean up interval after 2 minutes (to avoid infinite checks)
      setTimeout(
        () => {
          window.clearInterval(interval);
        },
        2 * 60 * 1000
      );
    }
  }, [
    stripeAccountId,
    onboardingStatus,
    startOnboarding,
    checkStripeAccountStatus,
  ]);

  // Render UI based on onboarding status
  const renderContent = () => {
    switch (onboardingStatus) {
      case "checking":
        return (
          <Center py="xl">
            <Stack align="center">
              <Loader size="lg" />
              <Text>{t("onboarding.checking")}</Text>
            </Stack>
          </Center>
        );

      case "not_started":
        return (
          <Stack>
            <Text>{t("onboarding.notStartedDescription")}</Text>
            <Button onClick={startOnboarding}>
              {t("onboarding.startButton")}
            </Button>
          </Stack>
        );

      case "in_progress":
        return (
          <Stack>
            <Text>{t("onboarding.inProgressDescription")}</Text>

            {statusDetails && (
              <Stack>
                <Box>
                  <Text size="sm" mb="xs">
                    {t("onboarding.steps.detailsSubmitted")}
                  </Text>
                  <Progress
                    value={statusDetails.detailsSubmitted ? 100 : 0}
                    size="md"
                    mb="xs"
                  />
                </Box>

                <Box>
                  <Text size="sm" mb="xs">
                    {t("onboarding.steps.chargesEnabled")}
                  </Text>
                  <Progress
                    value={statusDetails.chargesEnabled ? 100 : 0}
                    size="md"
                    mb="xs"
                  />
                </Box>

                <Box>
                  <Text size="sm" mb="xs">
                    {t("onboarding.steps.payoutsEnabled")}
                  </Text>
                  <Progress
                    value={statusDetails.payoutsEnabled ? 100 : 0}
                    size="md"
                    mb="xs"
                  />
                </Box>
              </Stack>
            )}

            <Button onClick={startOnboarding}>
              {t("onboarding.continueButton")}
            </Button>
          </Stack>
        );

      case "completed":
        return (
          <Stack align="center">
            <IconCheck size={48} color="green" />
            <Text fw={500} ta="center">
              {t("onboarding.completedTitle")}
            </Text>
            <Text ta="center">{t("onboarding.completedDescription")}</Text>
            <Button component="a" href="/business/dashboard">
              {t("onboarding.goToDashboardButton")}
            </Button>
          </Stack>
        );

      case "error":
        return (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title={t("onboarding.errors.title")}
            color="red"
          >
            {errorMessage || t("onboarding.errors.unknown")}
            <Button variant="outline" onClick={checkBusinessStatus} mt="md">
              {t("onboarding.retryButton")}
            </Button>
          </Alert>
        );

      default:
        return null;
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Text size="lg" fw={500}>
          {t("onboarding.cardTitle")}
        </Text>
        {renderContent()}
      </Stack>
    </Card>
  );
}
