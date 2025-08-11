const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async register(userData) {
    return this.request('/user/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const sep = queryString ? `?${queryString}` : '';
    return this.request(`/events${sep}`);
  }

  async getEventById(id) {
    return this.request(`/event/${id}`);
  }

  async createEvent(eventData) {
    return this.request('/event', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id, eventData) {
    return this.request(`/event/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id) {
    return this.request(`/event/${id}`, {
      method: 'DELETE'
    });
  }

  async enrollInEvent(eventId) {
    return this.request(`/event/${eventId}/enrollment`, {
      method: 'POST'
    });
  }

  async unenrollFromEvent(eventId) {
    return this.request(`/event/${eventId}/enrollment`, {
      method: 'DELETE'
    });
  }

  async joinEvent(id) {
    return this.request(`/event/${id}/enrollment`, {
      method: 'POST'
    });
  }

  async leaveEvent(id) {
    return this.request(`/event/${id}/enrollment`, {
      method: 'DELETE'
    });
  }

  async getEventParticipants(id) {
    return this.request(`/event/${id}/participants`);
  }

  async getUserCreatedEvents() {
    return this.request('/users/me/events/created');
  }

  async getUserJoinedEvents() {
    return this.request('/users/me/events/joined');
  }

  async getEventLocations() {
    return this.request('/event/locations');
  }

  async getLocations() {
    return this.request('/locations');
  }

  async getEventLocationById(id) {
    return this.request(`/event-location/${id}`);
  }

  async createEventLocation(eventLocationData) {
    return this.request('/event-location', {
      method: 'POST',
      body: JSON.stringify(eventLocationData),
    });
  }

  async updateEventLocation(id, eventLocationData) {
    return this.request('/event-location', {
      method: 'PUT',
      body: JSON.stringify({ id, ...eventLocationData }),
    });
  }

  async deleteEventLocation(id) {
    return this.request(`/event-location/${id}`, {
      method: 'DELETE'
    });
  }

  async getTags() {
    return this.request('/event/tags');
  }

  async getEventCategories() {
    return this.request('/event/categories');
  }

  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async getProfile() {
    const res = await this.request('/user/profile');
    return res.user;
  }

  async healthCheck() {
    return this.request('/health');
  }
}

const apiService = new ApiService();
export default apiService; 