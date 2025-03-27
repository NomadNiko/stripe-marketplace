"use client";
import { useState, useEffect } from "react";
import { StripeConnectInstance } from "@stripe/connect-js";
import { loadConnectAndInitialize } from "@stripe/connect-js/pure";
import {
  useCreateConnectAccount,
  useCreateAccountSession,
  useUpdateBusinessStripeStatus,
} from "@/services/api/services/stripe";
import { useTranslation } from "@/services/i18n/client";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

export const useStripeConnect = (businessId: string) => {
  const { t } = useTranslation("stripe");
  const [stripeConnectInstance, setStripeConnectInstance] =
    useState<StripeConnectInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);

  const createConnectAccount = useCreateConnectAccount();
  const createAccountSession = useCreateAccountSession();
  const updateBusinessStripeStatus = useUpdateBusinessStripeStatus();

  useEffect(() => {
    const initializeStripeConnect = async () => {
      if (!businessId) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("Creating/Getting Stripe account...");

        // 1. Create/Get Stripe account for the business
        const accountResponse = await createConnectAccount(undefined, {
          businessId,
        });

        if (accountResponse.status !== HTTP_CODES_ENUM.OK) {
          throw new Error(t("onboarding.error.account"));
        }

        // Get the account ID string from the response
        const accountId = accountResponse.data.accountId;
        setStripeAccountId(accountId);

        console.log("Updating business with Stripe Connect ID...");

        // 2. Update the business with the Stripe account ID (immediate update)
        await updateBusinessStripeStatus(undefined, {
          accountId: accountId,
        });

        console.log("Creating account session...");

        // 3. Function to fetch client secret for Stripe Connect
        const fetchClientSecret = async () => {
          // Send accountId as a JSON object
          const sessionResponse = await createAccountSession({
            accountId: accountId,
          });

          if (sessionResponse.status !== HTTP_CODES_ENUM.OK) {
            throw new Error(t("onboarding.error.session"));
          }

          return sessionResponse.data.clientSecret;
        };

        console.log("Initializing Stripe Connect...");

        // 4. Initialize Stripe Connect with dark theme matching iXplor
        const stripeConnect = await loadConnectAndInitialize({
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
          fetchClientSecret,
          appearance: {
            overlays: "dialog", // Key change: use dialog overlay like iXplor
            variables: {
              colorPrimary: "#FFFFFF", // White primary color for buttons
              colorBackground: "#1C283A", // Dark background like iXplor
              colorText: "#FFFFFF", // White text
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              borderRadius: "8px",
              spacingUnit: "4px",
            },
          },
        });

        setStripeConnectInstance(stripeConnect);
        console.log("Stripe Connect initialized successfully");
      } catch (err) {
        console.error("Stripe Connect initialization error:", err);
        setError(
          err instanceof Error ? err.message : t("onboarding.error.generic")
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeStripeConnect();
  }, [
    businessId,
    t,
    createConnectAccount,
    createAccountSession,
    updateBusinessStripeStatus,
  ]);

  return {
    stripeConnectInstance,
    stripeAccountId,
    isLoading,
    error,
  };
};

export default useStripeConnect;
