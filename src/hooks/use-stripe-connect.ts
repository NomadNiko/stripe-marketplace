// src/hooks/use-stripe-connect.ts
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
        const accountResponse = await createConnectAccount(
          { businessId }, // Send businessId in the request body
          undefined // No path params needed here
        );

        if (
          accountResponse.status !== HTTP_CODES_ENUM.OK &&
          accountResponse.status !== HTTP_CODES_ENUM.CREATED
        ) {
          throw new Error(t("onboarding.error.account"));
        }

        // Get the account ID string from the response
        const accountId = accountResponse.data.account;
        console.log("Got account ID:", accountId);
        setStripeAccountId(accountId);

        console.log("Updating business with Stripe Connect ID...");
        // 2. Update the business with the Stripe account ID (immediate update)
        await updateBusinessStripeStatus(
          { id: accountId }, // Request body
          { businessId } // Path param
        );

        console.log("Creating account session...");
        // 3. Create account session and get client secret
        try {
          const sessionResponse = await createAccountSession({
            accountId: accountId,
          });

          if (
            sessionResponse.status !== HTTP_CODES_ENUM.OK &&
            sessionResponse.status !== HTTP_CODES_ENUM.CREATED
          ) {
            console.error("Error creating session:", sessionResponse);
            throw new Error(t("onboarding.error.session"));
          }

          console.log("Session created successfully");

          // 4. Initialize Stripe Connect
          console.log("Initializing Stripe Connect...");
          const stripePublishableKey =
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

          if (!stripePublishableKey) {
            throw new Error("Missing Stripe publishable key");
          }

          const stripeConnect = await loadConnectAndInitialize({
            publishableKey: stripePublishableKey,
            fetchClientSecret: async () => {
              // This function should return just the client secret as a string
              return sessionResponse.data.clientSecret;
            },
            appearance: {
              overlays: "dialog",
              variables: {
                colorPrimary: "#FFFFFF",
                colorBackground: "#1C283A",
                colorText: "#FFFFFF",
                fontFamily:
                  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                borderRadius: "8px",
                spacingUnit: "4px",
              },
            },
          });

          setStripeConnectInstance(stripeConnect);
          console.log("Stripe Connect initialized successfully");
        } catch (sessionError) {
          console.error("Session creation error:", sessionError);
          throw sessionError;
        }
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
