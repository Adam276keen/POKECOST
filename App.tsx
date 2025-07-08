import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { PokemonCard, CardSet, User, CollectionItem, Locale, TCGPlayerPrices } from './types';
import { fetchCards, fetchSets, fetchRarities, fetchTypes } from './services/pokemonService';
import { LOCALES, TRANSLATIONS } from './constants';

// ICONS (Heroicons)
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>;
const GlobeAltIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.953 11.953 0 0 0 12 13.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 0 3 12c0 .778.099 1.533.284 2.253m15.132 0A11.978 11.978 0 0 1 12 21.75c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;

// --- CONTEXTS ---

// Theme Context
const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
});
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
const useTheme = () => useContext(ThemeContext);

// Localization Context
const LocalizationContext = createContext({
  locale: 'en' as Locale,
  setLocale: (locale: Locale) => {},
  t: (key: string) => key,
  formatCurrency: (amount?: number): string => '',
  localeConfig: LOCALES.en
});
const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const savedLocale = localStorage.getItem('locale');
    return (savedLocale && LOCALES[savedLocale as Locale]) ? savedLocale as Locale : 'en';
  });
  
  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);
  
  const t = useCallback((key: string) => TRANSLATIONS[locale][key] || key, [locale]);
  const localeConfig = LOCALES[locale];

  const formatCurrency = useCallback((amount?: number) => {
    if (typeof amount !== 'number') return t('priceNotAvailable');
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: localeConfig.currency,
    }).format(amount * localeConfig.rate);
  }, [locale, localeConfig, t]);


  return (
    <LocalizationContext.Provider value={{ locale, setLocale, t, formatCurrency, localeConfig }}>
      {children}
    </LocalizationContext.Provider>
  );
};
const useLocalization = () => useContext(LocalizationContext);

// Auth Context
const AuthContext = createContext<{
  user: User | null;
  collection: CollectionItem[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, password: string) => Promise<void>;
  addToCollection: (card: PokemonCard) => void;
  decreaseInCollection: (cardId: string) => void;
  removeFromCollection: (cardId: string) => void;
  isInCollection: (cardId: string) => boolean;
  getCollectionQuantity: (cardId: string) => number;
}>({
  user: null,
  collection: [],
  login: async () => {},
  logout: () => {},
  register: async () => {},
  addToCollection: () => {},
  decreaseInCollection: () => {},
  removeFromCollection: () => {},
  isInCollection: () => false,
  getCollectionQuantity: () => 0,
});
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [collection, setCollection] = useState<CollectionItem[]>([]);

  useEffect(() => {
    const lastUser = localStorage.getItem('last_logged_in_user');
    if (lastUser) {
      setUser({ username: lastUser });
    }
  }, []);

  useEffect(() => {
    if (user) {
      const savedCollection = localStorage.getItem(`collection_${user.username}`);
      if (savedCollection) {
        const parsed = JSON.parse(savedCollection);
        if (parsed.length > 0 && parsed[0].quantity === undefined) {
          setCollection(parsed.map((item: Omit<CollectionItem, 'quantity'>) => ({ ...item, quantity: 1 })));
        } else {
          setCollection(parsed);
        }
      } else {
        setCollection([]);
      }
      localStorage.setItem('last_logged_in_user', user.username);
    } else {
      setCollection([]);
      localStorage.removeItem('last_logged_in_user');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`collection_${user.username}`, JSON.stringify(collection));
    }
  }, [collection, user]);

  const login = async (username: string, password: string) => {
    const db = localStorage.getItem('users_db');
    const users: User[] = db ? JSON.parse(db) : [];
    const foundUser = users.find(u => u.username === username);
    if (foundUser && foundUser.password === password) {
      setUser({ username });
    } else {
      throw new Error('invalidCredentials');
    }
  };

  const register = async (username: string, password: string) => {
    const db = localStorage.getItem('users_db');
    const users: User[] = db ? JSON.parse(db) : [];
    if (users.some(u => u.username === username)) {
      throw new Error('usernameTaken');
    }
    const newUser = { username, password };
    users.push(newUser);
    localStorage.setItem('users_db', JSON.stringify(users));
    setUser({ username });
  };

  const logout = () => setUser(null);
  
  const addToCollection = (card: PokemonCard) => {
    setCollection(prev => {
      const existingItem = prev.find(item => item.id === card.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === card.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const newItem: CollectionItem = { ...card, addedDate: new Date().toISOString(), quantity: 1 };
        return [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name));
      }
    });
  };

  const decreaseInCollection = (cardId: string) => {
    setCollection(prev => {
      const existingItem = prev.find(item => item.id === cardId);
      if (existingItem) {
        if (existingItem.quantity > 1) {
          return prev.map(item =>
            item.id === cardId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          );
        } else {
          return prev.filter(item => item.id !== cardId);
        }
      }
      return prev;
    });
  };

  const removeFromCollection = (cardId: string) => {
    setCollection(prev => prev.filter(item => item.id !== cardId));
  };

  const isInCollection = (cardId: string) => collection.some(item => item.id === cardId);
  
  const getCollectionQuantity = (cardId: string) => {
    return collection.find(item => item.id === cardId)?.quantity || 0;
  };

  return (
    <AuthContext.Provider value={{ user, collection, login, logout, register, addToCollection, decreaseInCollection, removeFromCollection, isInCollection, getCollectionQuantity }}>
      {children}
    </AuthContext.Provider>
  );
};
const useAuth = () => useContext(AuthContext);


// --- HELPER COMPONENTS ---

const Loader: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
      <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-poke-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-lg">{message || t('loading')}</p>
    </div>
  );
};

interface CardComponentProps {
    card: PokemonCard;
}

const CardComponent: React.FC<CardComponentProps> = ({ card }) => {
  const { user, addToCollection, decreaseInCollection, removeFromCollection, getCollectionQuantity } = useAuth();
  const { t, formatCurrency } = useLocalization();
  
  const getPrice = (c: PokemonCard) => {
    const prices = c.tcgplayer?.prices;
    if (!prices) return undefined;
    return prices.holofoil?.market || prices.normal?.market || prices.reverseHolofoil?.market || prices['1stEditionHolofoil']?.market || prices['1stEditionNormal']?.market || undefined;
  };

  const marketPrice = getPrice(card);
  const quantity = getCollectionQuantity(card.id);
  const inCollection = quantity > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group animate-fade-in">
      <div className="relative">
        <img src={card.images.large} alt={card.name} className="rounded-t-xl w-full aspect-[3/4] object-cover" loading="lazy" />
        <div className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80 p-1.5 rounded-full backdrop-blur-sm">
            <img src={card.set.images.symbol} alt={card.set.name} className="h-6 w-6"/>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{card.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{card.set.name}</p>
        <div className="flex justify-between items-center mt-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${card.rarity ? 'bg-poke-yellow/20 text-poke-gold dark:bg-poke-yellow/30 dark:text-poke-yellow' : ''}`}>
              {card.rarity || 'Common'}
          </span>
          <span className="text-lg font-bold text-poke-blue dark:text-poke-yellow">{formatCurrency(marketPrice)}</span>
        </div>
        {user && (
          <div className="mt-4 h-10 flex items-center">
            {inCollection ? (
                <div className="flex items-center justify-between space-x-2 w-full">
                    <button onClick={() => decreaseInCollection(card.id)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-bold w-10 h-10 flex items-center justify-center text-lg">-</button>
                    <span className="font-bold text-lg text-gray-800 dark:text-gray-200" aria-label={`Quantity: ${quantity}`}>{quantity}</span>
                    <button onClick={() => addToCollection(card)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-bold w-10 h-10 flex items-center justify-center text-lg">+</button>
                    <button onClick={() => removeFromCollection(card.id)} className="p-2 rounded-full text-red-500 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors" aria-label={t('removeAll')} title={t('removeAll')}>
                        <TrashIcon />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => addToCollection(card)}
                    className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-colors bg-green-500 hover:bg-green-600"
                >
                    {t('addToCollection')}
                </button>
            )}
            </div>
        )}
      </div>
    </div>
  );
};


// --- PAGES ---

const HomePage: React.FC = () => {
    const { t } = useLocalization();
    const [cards, setCards] = useState<PokemonCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sets, setSets] = useState<CardSet[]>([]);
    const [rarities, setRarities] = useState<string[]>([]);
    const [types, setTypes] = useState<string[]>([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSet, setSelectedSet] = useState('');
    const [selectedRarity, setSelectedRarity] = useState('');
    const [selectedType, setSelectedType] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const buildQuery = useCallback(() => {
        let q = [];
        if (searchTerm) q.push(`name:"${searchTerm}*"`);
        if (selectedSet) q.push(`set.id:${selectedSet}`);
        if (selectedRarity) q.push(`rarity:"${selectedRarity}"`);
        if (selectedType) q.push(`types:${selectedType}`);
        return q.join(' ') || `subtypes:Basic OR subtypes:Stage*`; // default query
    }, [searchTerm, selectedSet, selectedRarity, selectedType]);
    
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [setsData, raritiesData, typesData] = await Promise.all([
                    fetchSets(),
                    fetchRarities(),
                    fetchTypes()
                ]);
                setSets(setsData);
                setRarities(raritiesData);
                setTypes(typesData);
            } catch (err) {
                setError('Failed to load filter data.');
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const fetchCardData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const query = buildQuery();
                const response = await fetchCards(query, currentPage);
                setCards(response.data);
                setTotalPages(Math.ceil(response.totalCount / response.pageSize));
            } catch (err) {
                if (err instanceof Error) {
                  setError(err.message);
                } else {
                  setError('An unknown error occurred.');
                }
                setCards([]);
            } finally {
                setIsLoading(false);
            }
        };
        // Debounce search
        const handler = setTimeout(() => {
            fetchCardData();
        }, 500);

        return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buildQuery, currentPage]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        // The useEffect will trigger the search
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end animate-slide-in">
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                  <label htmlFor="search-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('searchByName')}</label>
                  <input
                      id="search-name"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('searchByName')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-poke-blue focus:ring-poke-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="filter-set" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('filterBySet')}</label>
                  <select id="filter-set" value={selectedSet} onChange={(e) => setSelectedSet(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-poke-blue focus:ring-poke-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="">{t('allSets')}</option>
                      {sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-rarity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('filterByRarity')}</label>
                  <select id="filter-rarity" value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-poke-blue focus:ring-poke-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="">{t('allRarities')}</option>
                      {rarities.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('filterByType')}</label>
                  <select id="filter-type" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-poke-blue focus:ring-poke-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="">{t('allTypes')}</option>
                      {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
            </form>
            
            {isLoading && <Loader />}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!isLoading && !error && cards.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-10 text-xl">{t('noCardsFound')}</p>
            )}

            {!isLoading && cards.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                        {cards.map(card => <CardComponent key={card.id} card={card} />)}
                    </div>
                    <div className="mt-8 flex justify-center">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                </>
            )}
        </div>
    );
};

const CollectionPage: React.FC = () => {
    const { user, collection } = useAuth();
    const { t, formatCurrency } = useLocalization();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [user, navigate]);

    const getPrice = (c: PokemonCard) => {
        const prices = c.tcgplayer?.prices;
        if (!prices) return 0;
        const marketPrice = prices.holofoil?.market || prices.normal?.market || prices.reverseHolofoil?.market || undefined;
        return marketPrice || 0;
    };
    
    const totalValue = useMemo(() => 
        collection.reduce((sum, item) => sum + (getPrice(item) * item.quantity), 0),
    [collection]);

    if (!user) return <Loader />;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 flex justify-between items-center animate-slide-in">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('myCollection')}</h1>
                <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">{t('collectionValue')}</p>
                    <p className="text-2xl font-bold text-poke-blue dark:text-poke-yellow">{formatCurrency(totalValue)}</p>
                </div>
            </div>

            {collection.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500 dark:text-gray-400">{t('emptyCollection')}</p>
                    <Link to="/" className="mt-4 inline-block bg-poke-blue text-white font-bold py-2 px-4 rounded hover:bg-poke-blue/90 transition-colors">
                        {t('home')}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {collection.map(card => <CardComponent key={card.id} card={card} />)}
                </div>
            )}
        </div>
    );
};

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const { t } = useLocalization();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (username.trim() && password) {
            try {
                await login(username.trim(), password);
                navigate('/collection');
            } catch (err) {
                if (err instanceof Error) {
                    setError(t(err.message));
                }
            }
        }
    };
    
    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg animate-fade-in">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {t('login')}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username">{t('username')}</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-poke-blue focus:border-poke-blue focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder={t('username')}
                            />
                        </div>
                        <div>
                            <label htmlFor="password">{t('password')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-poke-blue focus:border-poke-blue focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder={t('password')}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-poke-blue hover:bg-poke-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-poke-gold"
                        >
                            {t('login')}
                        </button>
                    </div>
                     <div className="text-sm text-center">
                        <Link to="/register" className="font-medium text-poke-blue hover:text-poke-gold dark:text-poke-yellow dark:hover:text-poke-yellow/80">
                            {t('dontHaveAccount')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RegisterPage: React.FC = () => {
    const { register } = useAuth();
    const { t } = useLocalization();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }
        if (username.trim() && password) {
            try {
                await register(username.trim(), password);
                navigate('/collection');
            } catch (err) {
                if (err instanceof Error) {
                    setError(t(err.message));
                }
            }
        }
    };
    
    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg animate-fade-in">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {t('register')}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username">{t('username')}</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-poke-blue focus:border-poke-blue focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder={t('username')}
                            />
                        </div>
                        <div>
                            <label htmlFor="password">{t('password')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-poke-blue focus:border-poke-blue focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder={t('password')}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password">{t('confirmPassword')}</label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-poke-blue focus:border-poke-blue focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder={t('confirmPassword')}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-poke-blue hover:bg-poke-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-poke-gold"
                        >
                            {t('register')}
                        </button>
                    </div>
                     <div className="text-sm text-center">
                        <Link to="/login" className="font-medium text-poke-blue hover:text-poke-gold dark:text-poke-yellow dark:hover:text-poke-yellow/80">
                            {t('alreadyHaveAccount')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Pagination: React.FC<{ currentPage: number, totalPages: number, onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage: number, endPage: number;
    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }
    
    if (totalPages <= 1) return null;

    return (
        <nav className="flex items-center space-x-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">&laquo;</button>
            {startPage > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300">1</button>
                    {startPage > 2 && <span className="px-3 py-1">...</span>}
                </>
            )}
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={`px-3 py-1 rounded-md ${currentPage === number ? 'bg-poke-blue text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{number}</button>
            ))}
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="px-3 py-1">...</span>}
                    <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300">{totalPages}</button>
                </>
            )}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">&raquo;</button>
        </nav>
    );
};

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, locale, setLocale } = useLocalization();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const location = useLocation();

    const getLinkClass = (path: string) => {
        return location.pathname === path
            ? 'bg-poke-yellow/20 text-poke-gold dark:text-poke-yellow'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
    };

    return (
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokeball" className="h-8 w-8"/>
              <span className="text-2xl font-bold text-poke-blue dark:text-poke-yellow">POKECOST</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-2">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${getLinkClass('/')}`}>{t('home')}</Link>
              {user && <Link to="/collection" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${getLinkClass('/collection')}`}>{t('myCollection')}</Link>}
            </nav>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-gray-800 dark:text-gray-200 hidden sm:block">{t('welcome')}, {user.username}</span>
                  <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">{t('logout')}</button>
                </>
              ) : (
                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium bg-poke-blue text-white hover:bg-poke-blue/90 transition-colors">{t('login')}</Link>
              )}
              <div className="relative">
                <select 
                    onChange={(e) => setLocale(e.target.value as Locale)} 
                    value={locale}
                    className="pl-8 pr-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-poke-blue"
                >
                    {Object.entries(LOCALES).map(([key, value]) => (
                        <option key={key} value={key}>{value.name}</option>
                    ))}
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-600 dark:text-gray-400">
                    <GlobeAltIcon />
                </div>
              </div>
              <button onClick={toggleDarkMode} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </div>
      </header>
    );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-inner">
        <div className="container mx-auto px-4 py-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                © Adam Meixner 2025
            </p>
        </div>
    </footer>
  );
};


// --- APP ---

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <LocalizationProvider>
            <AuthProvider>
                <HashRouter>
                    <div className="flex flex-col min-h-screen">
                        <Header />
                        <main className="flex-grow">
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/collection" element={<CollectionPage />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                            </Routes>
                        </main>
                        <Footer />
                    </div>
                </HashRouter>
            </AuthProvider>
        </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
