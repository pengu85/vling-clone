export interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface SearchParams {
  q?: string;
  category?: string;
  country?: string;
  subscriberMin?: number;
  subscriberMax?: number;
  sort?: string;
  page?: number;
  limit?: number;
}
