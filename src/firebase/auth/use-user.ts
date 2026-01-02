'use client';
import { useAuthContext } from '@/lib/auth';

/**
 * A hook to get the current authenticated application user.
 * This is a convenience hook that wraps `useAuthContext`.
 * @returns An object containing the user, loading state, and any auth error.
 */
export const useUser = () => {
  const { user, loading, authError } = useAuthContext();
  return { user, loading, error: authError };
};
