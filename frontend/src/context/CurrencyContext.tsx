import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInInr: number) => number;
  formatPrice: (priceInInr: number) => string;
}

// Fallback exchange rates relative to INR (Used if API fails)
const FALLBACK_RATES: Record<Currency, number> = {
  INR: 1,
  USD: 0.012, 
  EUR: 0.011, 
  GBP: 0.0095 
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);

  useEffect(() => {
    const saved = localStorage.getItem('hampi-currency');
    if (saved && (saved === 'INR' || saved === 'USD' || saved === 'EUR' || saved === 'GBP')) {
      setCurrency(saved as Currency);
    } else {
      // Auto-detect based on timezone (simple heuristic for international users)
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz.includes('America')) setCurrency('USD');
        else if (tz.includes('Europe/London')) setCurrency('GBP');
        else if (tz.includes('Europe')) setCurrency('EUR');
        else setCurrency('INR');
      } catch (e) {
        setCurrency('INR');
      }
    }

    // Fetch real-time exchange rates
    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/INR');
        const data = await response.json();
        if (data && data.rates) {
          setRates({
            INR: 1,
            USD: data.rates.USD || FALLBACK_RATES.USD,
            EUR: data.rates.EUR || FALLBACK_RATES.EUR,
            GBP: data.rates.GBP || FALLBACK_RATES.GBP,
          });
        }
      } catch (error) {
        console.error('Failed to fetch real-time currency rates, using fallbacks:', error);
      }
    };

    fetchRates();
  }, []);

  const handleSetCurrency = (curr: Currency) => {
    setCurrency(curr);
    localStorage.setItem('hampi-currency', curr);
  };

  const convertPrice = (priceInInr: number) => {
    return priceInInr * rates[currency];
  };

  const formatPrice = (priceInInr: number) => {
    const converted = convertPrice(priceInInr);
    
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: currency === 'INR' ? 0 : 0
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, convertPrice, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
