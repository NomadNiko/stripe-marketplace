import { useState, useCallback, useEffect, useRef } from "react";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { StepChange } from "@stripe/connect-js";
import {
  Card,
  Text,
  Button,
  Loader,
  Center,
  Alert,
  Box,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import useStripeConnect from "@/hooks/use-stripe-connect";
import {
  useUpdateBusinessStripeStatus,
  useGetAccountStatus,
} from "@/services/api/services/stripe";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

interface StripeConnectOnboardingProps {
  businessId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export const StripeConnectOnboarding: React.FC<
  StripeConnectOnboardingProps
> = ({ businessId, onComplete, onClose }) => {
  const { t } = useTranslation("stripe");
  const [isCompleted, setIsCompleted] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [resumingSession, setResumingSession] = useState(false);
  const mountedRef = useRef(true);

  const { stripeConnectInstance, stripeAccountId, isLoading, error } =
    useStripeConnect(businessId);
  const updateBusinessStripeStatus = useUpdateBusinessStripeStatus();
  const getAccountStatus = useGetAccountStatus();

  // Improved status check with significant step detection
  const checkAccountStatus = useCallback(
    async (isSignificantStep = false) => {
      if (!stripeAccountId) return;

      try {
        // Only log on significant steps to reduce noise
        if (isSignificantStep) {
          console.log("Checking account status after significant step...");
        }

        const response = await getAccountStatus({ accountId: stripeAccountId });

        if (response.status === HTTP_CODES_ENUM.OK) {
          const { detailsSubmitted, chargesEnabled, payoutsEnabled } =
            response.data;

          // Log status information for debugging
          if (isSignificantStep) {
            console.log("Account status:", {
              detailsSubmitted,
              chargesEnabled,
              payoutsEnabled,
            });
          }

          // Check if account has submitted details and has payments enabled
          if (detailsSubmitted && (chargesEnabled || payoutsEnabled)) {
            if (mountedRef.current) {
              setIsCompleted(true);
            }

            // Update business status
            await updateBusinessStripeStatus(undefined, {
              accountId: stripeAccountId,
            });

            // Call onComplete after a short delay to show success
            if (onComplete) {
              setTimeout(() => {
                if (mountedRef.current) {
                  onComplete();
                }
              }, 2000);
            }
          }
        }
      } catch (err) {
        console.error("Error checking account status:", err);
      }
    },
    [stripeAccountId, getAccountStatus, updateBusinessStripeStatus, onComplete]
  );

  // Improved step change handler that matches iXplor's approach
  const handleStepChange = useCallback(
    (change: StepChange) => {
      if (!mountedRef.current) return;

      // Log the entire change object like iXplor does
      console.log("Step change:", change);

      // Instead of trying to access specific properties that TypeScript doesn't recognize,
      // we'll use a simpler approach to detect significant steps

      // Check if the stringified object contains certain keywords
      const changeString = JSON.stringify(change).toLowerCase();
      const isSignificantStep =
        changeString.includes("complet") ||
        changeString.includes("finish") ||
        changeString.includes("submit") ||
        changeString.includes("verify") ||
        changeString.includes("confirm");

      if (isSignificantStep) {
        console.log("Significant step detected");
        // Wait longer for Stripe API to update on significant steps
        setTimeout(() => {
          if (mountedRef.current) {
            checkAccountStatus(true);
          }
        }, 2000);
      } else {
        // Still check status but with less logging
        checkAccountStatus(false);
      }
    },
    [checkAccountStatus]
  );

  // Improved exit handler - like iXplor
  const handleExit = useCallback(() => {
    if (!mountedRef.current) return;

    console.log("Onboarding exited by user");
    setOnboardingExited(true);

    // Still update status but don't disrupt user flow
    if (stripeAccountId) {
      updateBusinessStripeStatus(undefined, {
        accountId: stripeAccountId,
      }).catch((err) =>
        console.error("Error updating business status on exit:", err)
      );
    }

    // Automatically check status on exit
    checkAccountStatus(true);
  }, [stripeAccountId, updateBusinessStripeStatus, checkAccountStatus]);

  // Effect for cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Only check status periodically when onboarding is active (not exited or completed)
  useEffect(() => {
    if (!isCompleted && stripeAccountId && !onboardingExited) {
      // Initial status check
      checkAccountStatus(true);

      // Less frequent polling than before
      const intervalId = setInterval(() => {
        if (mountedRef.current) {
          checkAccountStatus(false);
        }
      }, 30000); // Check every 30 seconds instead of 5

      return () => clearInterval(intervalId);
    }
  }, [isCompleted, stripeAccountId, onboardingExited, checkAccountStatus]);

  // Loading state
  if (isLoading || resumingSession) {
    return (
      <Card
        shadow="sm"
        p="lg"
        radius="md"
        withBorder
        style={{ backgroundColor: "#1C283A" }}
      >
        <Center py="xl">
          <Box style={{ textAlign: "center" }}>
            <Loader size="lg" mb="md" color="blue" />
            <Text c="white">
              {resumingSession
                ? t("onboarding.resuming")
                : t("onboarding.loading")}
            </Text>
          </Box>
        </Center>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card
        shadow="sm"
        p="lg"
        radius="md"
        withBorder
        style={{ backgroundColor: "#1C283A" }}
      >
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={t("onboarding.error.title")}
          color="red"
          mb="md"
        >
          {error}
        </Alert>
        <Button fullWidth onClick={onClose || (() => window.location.reload())}>
          {t("onboarding.retryButton")}
        </Button>
      </Card>
    );
  }

  // Completed state
  if (isCompleted) {
    return (
      <Card
        shadow="sm"
        p="lg"
        radius="md"
        withBorder
        style={{ backgroundColor: "#1C283A" }}
      >
        <Center py="md">
          <Box style={{ textAlign: "center" }}>
            <IconCircleCheck
              size={48}
              color="green"
              style={{ marginBottom: "16px" }}
            />
            <Title order={4} mb="sm">
              <Text c="white">{t("onboarding.completedTitle")}</Text>
            </Title>
            <Text mb="lg" c="white">
              {t("onboarding.completedDescription")}
            </Text>
            <Button onClick={onComplete || onClose}>
              {t("onboarding.continueButton")}
            </Button>
          </Box>
        </Center>
      </Card>
    );
  }

  // Exited state - improved with resume functionality like iXplor
  if (onboardingExited) {
    return (
      <Card
        shadow="sm"
        p="lg"
        radius="md"
        withBorder
        style={{ backgroundColor: "#1C283A" }}
      >
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={t("onboarding.exitedTitle")}
          color="yellow"
          mb="md"
        >
          {t("onboarding.exitedMessage")}
        </Alert>
        <Button
          fullWidth
          onClick={() => {
            setResumingSession(true);
            // Brief delay to show loading state before resuming
            setTimeout(() => {
              setOnboardingExited(false);
              setResumingSession(false);
            }, 1000);
          }}
        >
          {t("onboarding.resumeButton")}
        </Button>
      </Card>
    );
  }

  // Active onboarding with improved styling
  return (
    <Card
      shadow="sm"
      p="lg"
      radius="md"
      withBorder
      style={{ backgroundColor: "#1C283A" }}
    >
      <Title order={4} mb="md">
        <Text c="white">{t("onboarding.embedTitle")}</Text>
      </Title>
      <Text mb="lg" c="white">
        {t("onboarding.embedDescription")}
      </Text>

      {stripeConnectInstance && (
        <Box
          style={{
            minHeight: "600px", // Increased height for better experience
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: "#1C283A",
          }}
          className="connect-onboarding-container"
        >
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding
              onExit={handleExit}
              onStepChange={handleStepChange}
            />
          </ConnectComponentsProvider>
        </Box>
      )}
    </Card>
  );
};

export default StripeConnectOnboarding;
