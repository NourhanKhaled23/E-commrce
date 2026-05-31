import { CartItem } from './cart.model';
import { Address } from './user.model';

export interface PromoCode {
  id?: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount: number;
  description: string;
  active?: boolean;
  expiry?: string;
}

export type PaymentMethod = 'card' | 'paypal' | 'cod' | 'wallet';

export type OrderStatus =
  | 'placed' | 'confirmed' | 'processing' | 'shipped'
  | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface SavedCardInfo {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export interface TimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
  completed: boolean;
}

export interface OrderRequest {
  userId: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  promoCode?: string;
}

export interface Order {
  id: number;
  userId: number;
  sellerId?: number;
  items: CartItem[];
  status: OrderStatus;
  timeline: TimelineEvent[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  createdAt: string;
  estimatedDelivery?: string;
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'placed', 'confirmed', 'processing', 'shipped',
  'out_for_delivery', 'delivered'
];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string; canCancel: boolean; canReview: boolean }> = {
  placed:           { label: 'Placed',           color: '#1565C0', icon: 'bi-receipt',           canCancel: true,  canReview: false },
  confirmed:        { label: 'Confirmed',        color: '#7B1FA2', icon: 'bi-check2-circle',     canCancel: true,  canReview: false },
  processing:       { label: 'Processing',       color: '#F57F17', icon: 'bi-gear',              canCancel: false, canReview: false },
  shipped:          { label: 'Shipped',          color: '#00695C', icon: 'bi-truck',             canCancel: false, canReview: false },
  out_for_delivery: { label: 'Out for Delivery', color: '#E65100', icon: 'bi-bicycle',           canCancel: false, canReview: false },
  delivered:        { label: 'Delivered',        color: '#2E7D32', icon: 'bi-check-circle-fill', canCancel: false, canReview: true  },
  cancelled:        { label: 'Cancelled',        color: '#C62828', icon: 'bi-x-circle-fill',    canCancel: false, canReview: false },
};