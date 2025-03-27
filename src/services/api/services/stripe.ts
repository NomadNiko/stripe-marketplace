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
  accountId: string;
};

// API Services with improved error handling
export const useCreateConnectAccount = createPostService<
  void,
  StripeAccountResponse,
  { businessId: string }
>((params) => `/v1/stripe/connect-account/${params.businessId}`);

export const useCreateAccountLink = createPostService<
  AccountLinkDto,
  AccountLinkResponse
>("/v1/stripe/account-link");

export const useGetAccountStatus = createGetService<
  AccountStatusResponse,
  { accountId: string }
>((params) => `/v1/stripe/account-status/${params.accountId}`);

export const useUpdateBusinessStripeStatus = createPostService<
  void,
  void,
  { accountId: string }
>((params) => `/v1/stripe/update-status/${params.accountId}`);

// Improved account session service with better JSON serialization
export const useCreateAccountSession = createPostService<
  { accountId: string },
  AccountSessionResponse
>("/v1/stripe/account-session", {
  transformRequest: (data) => {
    // Ensure proper JSON formatting to avoid issues
    return JSON.stringify(data);
  },
});

// New service to check if onboarding is already complete - to avoid unnecessary setup
export const useCheckOnboardingStatus = createGetService<
  { isComplete: boolean },
  { businessId: string }
>((params) => `/v1/stripe/onboarding-status/${params.businessId}`);
