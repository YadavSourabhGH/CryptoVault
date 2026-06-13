import { create } from 'zustand';
import api from '../lib/api';
import { subscribeToTicker, subscribeToOrderBook } from '../lib/socket';

export const useMarketStore = create((set, get) => ({
  selectedPair: 'BTCUSDT',
  tickers: {},
  allPairs: [],
  isLoading: false,
  error: null,

  // Load supported pairs from REST API
  fetchPairs: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/market/pairs');
      set({ allPairs: res.data.pairs, isLoading: false });
      
      // Auto subscribe to the selected pair when pairs load
      const { selectedPair } = get();
      subscribeToTicker(selectedPair);
      subscribeToOrderBook(selectedPair);
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  // Load current ticker snapshot
  fetchTickers: async () => {
    try {
      const res = await api.get('/market/tickers');
      set({ tickers: res.data.tickers });
    } catch (err) {
      console.error('Failed to fetch tickers:', err.message);
    }
  },

  // Switch selected trade pair
  setSelectedPair: (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    set({ selectedPair: upperSymbol });
    
    // Subscribe socket to new channels
    subscribeToTicker(upperSymbol);
    subscribeToOrderBook(upperSymbol);
  },

  // Update specific ticker price dynamically (via Socket.io streams)
  updateTicker: (symbol, tickerData) => {
    set((state) => ({
      tickers: {
        ...state.tickers,
        [symbol.toUpperCase()]: tickerData,
      },
    }));
  },

  // Batch update all tickers
  updateAllTickers: (tickersMap) => {
    set({ tickers: tickersMap });
  },
}));
