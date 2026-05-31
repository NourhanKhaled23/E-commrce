export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  thumbnail: string;
  categoryId: number;
  category: string;
  stock: number;
  avgRating: number;
  reviewCount: number;
  sellerId: number;
  sellerName?: string;
  tags: string[];
  createdAt: string;
  brand?: string;
  active?: boolean;
}

export interface ProductResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface FilterState {
  categoryId: number | null;
  minPrice: number;
  maxPrice: number;
  sort: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  rating: number | null;
  inStock: boolean;
  search: string;
}

export interface Review {
  id: number;
  productId: number;
  userId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface ReviewResponse {
  reviews: Review[];
  total: number;
  skip: number;
  limit: number;
}