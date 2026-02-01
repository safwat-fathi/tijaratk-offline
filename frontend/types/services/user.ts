export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
}

// Your UserFilters can now be used directly
export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: "admin" | "user";
  status?: "active" | "inactive";
  sortBy?: "name" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}
