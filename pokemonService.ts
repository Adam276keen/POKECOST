
import { API_BASE_URL, API_KEY } from '../constants';
import { PokemonCard, CardSet } from '../types';

interface FetchResponse<T> {
  data: T;
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

const fetchApi = async <T,>(endpoint: string, params?: URLSearchParams): Promise<FetchResponse<T>> => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);
  if (params) {
    url.search = params.toString();
  }

  const response = await fetch(url.toString(), {
    headers: {
      'X-Api-Key': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch data from Pokémon TCG API.');
  }

  return response.json();
};

export const fetchCards = async (query: string, page: number, pageSize: number = 24): Promise<FetchResponse<PokemonCard[]>> => {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    pageSize: pageSize.toString(),
    orderBy: 'set.releaseDate,name',
  });
  return fetchApi<PokemonCard[]>('cards', params);
};

export const fetchSets = async (): Promise<CardSet[]> => {
  const response = await fetchApi<CardSet[]>('sets');
  return response.data.sort((a,b) => a.name.localeCompare(b.name));
};

export const fetchRarities = async (): Promise<string[]> => {
  const response = await fetchApi<string[]>('rarities');
  return response.data;
};

export const fetchTypes = async (): Promise<string[]> => {
  const response = await fetchApi<string[]>('types');
  return response.data;
};
