export interface Business {
  id: string;
  displayName: string;
  businessName: string;
  description?: string;
  logo?: {
    id: string;
    path: string;
  } | null;
  website?: string;
  phone?: string;
  active: boolean;
  stripeAccountId?: string;
  stripeAccountStatus?: {
    onboardingComplete: boolean;
    paymentsEnabled: boolean;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    requirementsDisabled: boolean;
  };
  owners: string[];
  primaryOwner: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessRegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  business: {
    displayName: string;
    businessName: string;
    description?: string;
    logo?: {
      id: string;
      path: string;
    } | null;
    website?: string;
    phone?: string;
  };
}
