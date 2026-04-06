import { LanguageCode } from './i18n';

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  language: LanguageCode;
  rating?: number;
  reviews?: number;
  shopLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  currency?: string;
  category: string;
  image: string;
  images?: string[];
  video?: string;
  videos?: string[];
  description: string;
  rating: number;
  reviews: number;
  colors?: string[];
  sizes?: string[];
  seller: Seller;
  isLive?: boolean;
  createdAt?: string;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}
