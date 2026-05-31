export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bank: string;
}

export type SellerStatus = 'pending' | 'approved' | 'suspended';

export interface SellerProfile {
  userId: number;
  shopName: string;
  description: string;
  logoUrl: string;
  bankDetails: BankDetails;
  rating: number;
  totalSales: number;
  totalEarnings: number;
  pendingPayout: number;
  status: SellerStatus;
}

export interface Payout {
  id: number;
  sellerId: number;
  amount: number;
  fee: number;
  net: number;
  status: 'paid' | 'pending' | 'processing';
  requestedAt: string;
  paidAt?: string;
  reference: string;
}

export interface MonthlyEarning {
  month: string;
  orders: number;
  revenue: number;
  platformFee: number;
  netPayout: number;
}
