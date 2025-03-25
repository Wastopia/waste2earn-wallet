import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";

// Cache the auth client instance
let authClient: AuthClient | null = null;

// Get the auth client, creating it if needed
export const getAuthClient = async (): Promise<AuthClient> => {
  if (!authClient) {
    authClient = await AuthClient.create();
    // Set the user principal on window for easy access
    const isAuthenticated = await authClient.isAuthenticated();
    if (isAuthenticated) {
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal().toString();
      window.userPrincipal = principal;
    }
  }
  return authClient;
};

// Login function
export const login = async (): Promise<boolean> => {
  const client = await getAuthClient();
  
  // Check if already logged in
  const isAuthenticated = await client.isAuthenticated();
  if (isAuthenticated) {
    return true;
  }
  
  // For development, we'll simulate a successful login
  if (process.env.NODE_ENV !== 'production') {
    // This would normally be handled by a real auth flow
    // But for development, we'll just fake it
    await client.login({
      identityProvider: process.env.II_URL || 'https://identity.ic0.app',
      onSuccess: () => {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal().toString();
        window.userPrincipal = principal;
      },
    });
    return true;
  }
  
  return new Promise<boolean>((resolve) => {
    client.login({
      identityProvider: process.env.II_URL || 'https://identity.ic0.app',
      onSuccess: () => {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal().toString();
        window.userPrincipal = principal;
        resolve(true);
      },
      onError: () => {
        resolve(false);
      },
    });
  });
};

// Logout function
export const logout = async (): Promise<void> => {
  const client = await getAuthClient();
  await client.logout();
  window.userPrincipal = '';
};

// Get the current user's principal
export const getUserPrincipal = async (): Promise<Principal | undefined> => {
  const client = await getAuthClient();
  const isAuthenticated = await client.isAuthenticated();
  if (isAuthenticated) {
    const identity = client.getIdentity();
    return identity.getPrincipal();
  }
  return undefined;
};

// Check if the user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const client = await getAuthClient();
  return await client.isAuthenticated();
};

// For development, initialize with a mock user
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  getAuthClient().then(async (client) => {
    const isAuthenticated = await client.isAuthenticated();
    if (!isAuthenticated) {
      window.userPrincipal = 'aaaaa-aa'; // A mock principal for development
    }
  });
} 