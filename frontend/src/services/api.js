const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Events endpoints
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/event?${queryString}`);
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

  async enrollInEvent(eventId, enrollmentData) {
    return this.request(`/event/${eventId}/enroll`, {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    });
  }

  async getEventEnrollments(eventId) {
    return this.request(`/event/${eventId}/enrollments`);
  }

  async joinEvent(id) {
    return this.request(`/event/${id}/join`, {
      method: 'POST'
    });
  }

  async leaveEvent(id) {
    return this.request(`/event/${id}/leave`, {
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

  // Event locations endpoints
  async getEventLocations() {
    return this.request('/event-locations');
  }

  async getLocations() {
    return this.request('/locations');
  }

  async createLocation(locationData) {
    return this.request('/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async updateLocation(id, locationData) {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  async deleteLocation(id) {
    return this.request(`/locations/${id}`, {
      method: 'DELETE'
    });
  }

  // Tags endpoints
  async getTags() {
    return this.request('/tags');
  }

  // Users endpoints
  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 