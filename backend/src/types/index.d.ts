declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      facebookId: string;
      first_name?: string;
      last_name?: string;
    }

    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

export {};
