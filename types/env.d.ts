declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_AZURE_CLIENT_ID: string;
      EXPO_PUBLIC_AZURE_CLIENT_SECRET: string;
      EXPO_PUBLIC_AZURE_TENANT_ID: string;
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_CANVAS_API_TOKEN: string;
    }
  }
}

// Ensure this file is treated as a module
export {};