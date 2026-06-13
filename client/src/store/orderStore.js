import { create } from 'zustand';
import api from '../lib/api';

export const useOrderStore = create((set, get) => ({
  openOrders: [],
  orderHistory: [],
  isLoading: false,
  error: null,

  // Fetch current open orders for the user
  fetchOpenOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/orders/open');
      set({ openOrders: res.data.orders, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  // Fetch filled/cancelled order history
  fetchHistory: async (symbol = '') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/orders/history?symbol=${symbol}`);
      set({ orderHistory: res.data.orders, isLoading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  // Submit a new order
  placeOrder: async (orderParams) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/orders', orderParams);
      const { order } = res.data;
      
      // Update open orders list immediately if Limit or Stop-Limit order
      if (order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED') {
        set((state) => ({
          openOrders: [order, ...state.openOrders],
        }));
      } else {
        // Market orders or filled orders go straight to history
        set((state) => ({
          orderHistory: [order, ...state.orderHistory],
        }));
      }

      set({ isLoading: false });
      return { success: true, order };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to place order';
      set({ error: errMsg, isLoading: false });
      return { success: false, error: errMsg };
    }
  },

  // Cancel an active open order
  cancelOrder: async (orderId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.delete(`/orders/${orderId}`);
      
      // Remove from open orders list
      set((state) => ({
        openOrders: state.openOrders.filter((o) => o._id !== orderId),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to cancel order';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  // Handle order fills pushed from Sockets
  handleOrderFilled: (fillData) => {
    const { orderId, remainingQty, status } = fillData;
    
    // Update local open orders
    set((state) => {
      const index = state.openOrders.findIndex((o) => o._id === orderId);
      if (index === -1) return state;

      const updatedOpen = [...state.openOrders];
      const orderToUpdate = { ...updatedOpen[index] };
      orderToUpdate.remainingQty = remainingQty;
      orderToUpdate.filledQty = orderToUpdate.quantity - remainingQty;
      orderToUpdate.status = status;

      if (status === 'FILLED') {
        // Remove from open orders and transfer to history
        return {
          openOrders: updatedOpen.filter((o) => o._id !== orderId),
          orderHistory: [orderToUpdate, ...state.orderHistory],
        };
      } else {
        updatedOpen[index] = orderToUpdate;
        return { openOrders: updatedOpen };
      }
    });
  },

  // Handle order cancellations pushed from Sockets
  handleOrderCancelled: (cancelData) => {
    const { orderId } = cancelData;
    set((state) => {
      const orderToCancel = state.openOrders.find((o) => o._id === orderId);
      if (!orderToCancel) return state;
      
      const cancelledOrder = { ...orderToCancel, status: 'CANCELLED' };
      return {
        openOrders: state.openOrders.filter((o) => o._id !== orderId),
        orderHistory: [cancelledOrder, ...state.orderHistory],
      };
    });
  },

  // Reset errors
  clearError: () => set({ error: null }),
}));
