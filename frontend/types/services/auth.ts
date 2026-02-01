export interface LoginRequest {
  phone: string;
  pass: string;
}

export interface LoginResponse {
  access_token: string;
}

// Matching SignupDto from backend
export interface RegisterRequest {
  storeName: string;
  name: string;
  phone: string;
  password: string;
  confirm_password: string;
}

