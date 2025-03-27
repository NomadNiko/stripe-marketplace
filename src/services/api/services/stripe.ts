// ./stripe-marketplace/src/services/api/services/stripe.ts
import { createPostService, createGetService } from "@/services/api/factory";

// Type definitions with improved documentation
export type AccountLinkDto = {
  refreshUrl: string;
  returnUrl: string;
  accountId?: string;
};

export type AccountLinkResponse = {
  url: string;
  expiresAt: number;
};

export type AccountStatusResponse = {
  id: string;
  onboardingComplete: boolean;
  paymentsEnabled: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsDisabled: boolean;
  requirements: string[];
};

export type AccountSessionResponse = {
  clientSecret: string;
};

export type StripeAccountResponse = {
  account: string; // Changed to match backend response
};

// API Services with corrected paths to match backend implementation
export const useCreateConnectAccount = createPostService<
  { businessId: string },
  StripeAccountResponse
>("/v1/stripe-connect/account");

export const useCreateAccountLink = createPostService<
  AccountLinkDto,
  AccountLinkResponse
>("/v1/stripe-connect/account-link");

export const useGetAccountStatus = createGetService<
  AccountStatusResponse,
  { accountId: string }
>((params) => `/v1/stripe-connect/status/${params.accountId}`);

export const useUpdateBusinessStripeStatus = createPostService<
  { id: string },
  void,
  { businessId: string }
>((params) => `/v1/stripe-connect/update-business/${params.businessId}`);

export const useCreateAccountSession = createPostService<
  { accountId: string },
  AccountSessionResponse
>("/v1/stripe-connect/account-session", {
  transformRequest: (data) => {
    return JSON.stringify(data);
  },
});

export const useCheckOnboardingStatus = createGetService<
  { isComplete: boolean },
  { businessId: string }
>((params) => `/v1/stripe-connect/onboarding-status/${params.businessId}`);
