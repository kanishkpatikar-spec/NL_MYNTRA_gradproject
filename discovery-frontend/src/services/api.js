import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },
  getItemDetails: async (itemId) => {
    const response = await api.get(`/wishlist/${itemId}`);
    return response.data;
  },
};

export const moduleService = {
  getModules: async (itemId, modules = null) => {
    const payload = modules ? { modules } : {};
    const response = await api.post(`/modules/${itemId}`, payload);
    return response.data;
  },
  compareItems: async (itemIds) => {
    const response = await api.post('/compare', { item_ids: itemIds });
    return response.data;
  },
  analyzeSandbox: async (itemIds) => {
    const response = await api.post('/modules/sandbox', { item_ids: itemIds });
    return response.data;
  },
};

export default api;
