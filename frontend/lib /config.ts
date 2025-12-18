// frontend/lib/config.ts
export const contractAddresses = {
  propertyListing: `${process.env.NEXT_PUBLIC_PROPERTY_LISTING_ADDRESS}`,
  userRegistry: `${process.env.NEXT_PUBLIC_USER_REGISTRY_ADDRESS}`,
  rentalAgreement: `${process.env.NEXT_PUBLIC_RENTAL_AGREEMENT_ADDRESS}`,
  escrow: `${process.env.NEXT_PUBLIC_ESCROW_ADDRESS}`,
  maintenanceRequests: `${process.env.NEXT_PUBLIC_MAINTENANCE_REQUESTS_ADDRESS}`,
  propertyReviews: `${process.env.NEXT_PUBLIC_PROPERTY_REVIEWS_ADDRESS}`,
  disputeResolution: `${process.env.NEXT_PUBLIC_DISPUTE_RESOLUTION_ADDRESS}`,
} as const; // Use "as const" for better type safety

export const networkConfig = {
  chainId: 1337, // Ganache default chain ID
  rpcUrl: "http://0.0.0.0:7545", // Default Ganache RPC URL
} as const;

// Type helper for contract names
export type ContractName = keyof typeof contractAddresses; 
