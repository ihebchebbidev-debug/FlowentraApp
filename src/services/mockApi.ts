// Mock API service - no real API calls
// Simulates network delays for realistic UX

const mockDelay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Mock axios-like interface but returns mock data
  create: () => api,
  
  interceptors: {
    request: {
      use: () => {}, // No-op
    },
    response: {
      use: () => {}, // No-op
    }
  },
  
  // All HTTP methods return mock responses
  get: async (url: string, config?: any) => {
    await mockDelay();
    return { data: {}, status: 200, statusText: 'OK' };
  },
  
  post: async (url: string, data?: any, config?: any) => {
    await mockDelay();
    return { data: { success: true }, status: 201, statusText: 'Created' };
  },
  
  put: async (url: string, data?: any, config?: any) => {
    await mockDelay();
    return { data: { success: true }, status: 200, statusText: 'OK' };
  },
  
  delete: async (url: string, config?: any) => {
    await mockDelay();
    return { data: { success: true }, status: 200, statusText: 'OK' };
  },
  
  patch: async (url: string, data?: any, config?: any) => {
    await mockDelay();
    return { data: { success: true }, status: 200, statusText: 'OK' };
  }
};

export default api;