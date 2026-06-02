import api from '../api/axios';

export interface TestimonialData {
  id?: number;
  user_id?: number;
  name?: string;
  email?: string;
  message: string;
  rating: number;
  is_displayed?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar?: string;
  };
}

export interface TestimonialResponse {
  testimonials: TestimonialData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const testimonialApi = {
  /**
   * Get public testimonials (landing page)
   */
  getPublic: async (page = 1, limit = 20) => {
    return api.get<{ success: boolean; data: TestimonialResponse }>('/testimonials/public', {
      params: { page, limit },
    });
  },

  /**
   * Get user's testimonials
   */
  getUserTestimonials: async () => {
    return api.get<{ success: boolean; data: { testimonials: TestimonialData[] } }>('/testimonials/user/me');
  },

  /**
   * Create testimonial
   */
  create: async (data: Pick<TestimonialData, 'message' | 'rating'>) => {
    return api.post<{ success: boolean; data: { testimonial: TestimonialData } }>('/testimonials', data);
  },

  /**
   * Update testimonial
   */
  update: async (id: number, data: Partial<TestimonialData>) => {
    return api.patch<{ success: boolean; data: { testimonial: TestimonialData } }>(`/testimonials/${id}`, data);
  },

  /**
   * Delete testimonial
   */
  delete: async (id: number) => {
    return api.delete<{ success: boolean; message: string }>(`/testimonials/${id}`);
  },

  /**
   * Get all testimonials (admin only)
   */
  getAll: async (page = 1, limit = 20, is_displayed?: boolean | string) => {
    return api.get<{ success: boolean; data: TestimonialResponse }>('/testimonials', {
      params: { page, limit, is_displayed },
    });
  },

  /**
   * Update display status (admin only)
   */
  updateDisplay: async (id: number, is_displayed: boolean) => {
    return api.patch<{ success: boolean; data: { testimonial: TestimonialData } }>(
      `/testimonials/${id}/display`,
      { is_displayed }
    );
  },
};

export default testimonialApi;
