export interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    updatedAt: string;
    prices: TCGPlayerPrices;
  };
  set: {
    id:string;
    name: string;
    series: string;
    printedTotal: number;
    total: number;
    images: {
      symbol: string;
      logo: string;
    };
  };
  rarity?: string;
}

export interface TCGPlayerPrices {
  normal?: PriceDetail;
  holofoil?: PriceDetail;
  reverseHolofoil?: PriceDetail;
  '1stEditionHolofoil'?: PriceDetail;
  '1stEditionNormal'?: PriceDetail;
}

export interface PriceDetail {
  low: number;
  mid: number;
  high: number;
  market: number;
  directLow: number | null;
}

export interface CardSet {
  id: string;
  name: string;
  series: string;
}

export interface User {
  username: string;
  password?: string;
}

export interface CollectionItem extends PokemonCard {
  addedDate: string;
  quantity: number;
}

export type Locale = 'en' | 'cs' | 'sk';

export interface LocaleConfig {
  currency: 'USD' | 'CZK' | 'EUR';
  symbol: '$' | 'Kč' | '€';
  rate: number;
  name: string;
}