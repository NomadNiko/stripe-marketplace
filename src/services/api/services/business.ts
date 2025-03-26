import { createGetService, createPostService } from "../factory";
import { Business } from "../types/business";

// Define business types right here
export type BusinessRegistration = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  business: {
    displayName: string;
    businessName: string;
    description?: string;
    logo?: { id: string; path: string } | null;
    website?: string;
    phone?: string;
  };
};

export type BusinessQueryParams = {
  page?: number;
  limit?: number;
};

export type BusinessListResponse = {
  data: Business[];
  hasNextPage: boolean;
};

export type BusinessResponse = Business;

// Create the API services with proper typing
export const useBusinessRegister = createPostService<
  BusinessRegistration,
  void
>("/v1/auth/business/register");

export const useGetBusinesses =
  createGetService<BusinessListResponse>("/v1/businesses");

// Make sure the path is correct - it should be what the backend expects
export const useGetMyBusinesses = createGetService<BusinessListResponse>(
  "/v1/businesses/user/me"
);

export const useGetBusiness = createGetService<
  BusinessResponse,
  { id: string }
>((params) => `/v1/businesses/${params.id}`);
