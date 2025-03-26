// src/services/api/services/stripe.ts
import { createPostService, createGetService } from "@/services/api/factory";

// Type definitions
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

// API Services
export const useCreateConnectAccount = createPostService<
  void,
  string,
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
