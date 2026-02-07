declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      HTTP_SERVER_PORT: number;
      DB_NAME: string;
      DB_USER: string;
      DB_PASS: string;
      DB_HOST: string;
      DB_PORT: number;
      APP_URL: string;
      JWT_SECRET: string;
      CSRF_SECRET: string;
      FACEBOOK_GRAPH_API_BASE_URL: string;
      FACEBOOK_APP_ID: string;
      FACEBOOK_APP_SECRET: string;
      FACEBOOK_CALLBACK_URL: string;
      CLIENT_URL: string;
      WHATS_APP_API_KEY: string;
      WHATS_APP_BASE_URL: string;
      WHATS_APP_SENDER: string;
      TWILIO_CONTENT_SID_NEW_ORDER_MERCHANT: string;
      TWILIO_CONTENT_SID_ORDER_RECEIVED_CUSTOMER: string;
      TWILIO_CONTENT_SID_ORDER_OUT_FOR_DELIVERY: string;
      TWILIO_CONTENT_SID_ORDER_STATUS_UPDATE_CUSTOMER: string;
    }
  }
}

export {};
