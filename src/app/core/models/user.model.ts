export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface SavedCard {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export type UserStatus = 'active' | 'restricted' | 'pending';

export interface User {
  id: number;
  email: string;
  phone: string;
  name: string;
  role: 'customer' | 'seller' | 'admin';
  address: Address;
  savedCards: SavedCard[];
  walletBalance: number;
  loyaltyPoints: number;
  wishlist: number[];
  pendingVerification?: boolean;
  password?: string;
  token?: string;
  avatar?: string;
  status?: UserStatus;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}