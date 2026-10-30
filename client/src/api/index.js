import api from './client.js';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const driverApi = {
  register: (data) => api.post('/driver/register', data),
  getStats: () => api.get('/driver/stats'),
  getProfile: (driverId) => api.get(`/driver/${driverId}/profile`),
  getMyProfile: () => api.get('/driver/profile'),
};

export const vehicleApi = {
  list: () => api.get('/vehicles'),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const rideApi = {
  search: (params) => api.get('/rides/search', { params }),
  womenOnly: (params) => api.get('/rides/women-only', { params }),
  myRides: (params) => api.get('/rides/my', { params }),
  get: (id) => api.get(`/rides/${id}`),
  create: (data) => api.post('/rides', data),
  update: (id, data) => api.put(`/rides/${id}`, data),
  cancel: (id) => api.post(`/rides/${id}/cancel`),
  duplicate: (id) => api.post(`/rides/${id}/duplicate`),
  saveRoute: (data) => api.post('/rides/saved-routes', data),
  getSavedRoutes: () => api.get('/rides/saved-routes'),
  deleteSavedRoute: (id) => api.delete(`/rides/saved-routes/${id}`),
};

export const bookingApi = {
  create: (data) => api.post('/bookings', data),
  myBookings: (params) => api.get('/bookings/my', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  rideRequests: (rideId) => api.get(`/bookings/ride/${rideId}`),
  allRequests: (params) => api.get('/bookings/driver/all', { params }),
  action: (id, action) => api.post(`/bookings/${id}/action`, { action }),
  cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const paymentApi = {
  history: () => api.get('/payments'),
  update: (id, data) => api.put(`/payments/${id}`, data),
};

export const reviewApi = {
  create: (data) => api.post('/reviews', data),
  driverReviews: (driverId) => api.get(`/reviews/driver/${driverId}`),
  myReview: (bookingId) => api.get(`/reviews/booking/${bookingId}/mine`),
};

export const userApi = {
  getEmergencyContact: () => api.get('/users/emergency-contact'),
  upsertEmergencyContact: (data) => api.put('/users/emergency-contact', data),
  deleteEmergencyContact: () => api.delete('/users/emergency-contact'),
  getFavouriteDrivers: () => api.get('/users/favourite-drivers'),
  addFavouriteDriver: (driver_id) => api.post('/users/favourite-drivers', { driver_id }),
  removeFavouriteDriver: (driverId) => api.delete(`/users/favourite-drivers/${driverId}`),
  getFavouriteLocations: () => api.get('/users/favourite-locations'),
  addFavouriteLocation: (data) => api.post('/users/favourite-locations', data),
  removeFavouriteLocation: (id) => api.delete(`/users/favourite-locations/${id}`),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  rides: (params) => api.get('/admin/rides', { params }),
  reports: () => api.get('/admin/reports'),
  updateReport: (id, data) => api.put(`/admin/reports/${id}`, data),
  tickets: () => api.get('/admin/support-tickets'),
  updateTicket: (id, data) => api.put(`/admin/support-tickets/${id}`, data),
  createReport: (data) => api.post('/admin/reports', data),
  createTicket: (data) => api.post('/admin/support-tickets', data),
  myTickets: () => api.get('/admin/support-tickets/mine'),
};
