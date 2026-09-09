import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useRef, useState } from "react";

const ADMIN_SESSION_KEY = "meltcookies_admin_id";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn: convexSignIn, signOut: convexSignOut } = useAuthActions();
  const syncUser = useMutation(api.admins.syncUser);
  const syncPending = useRef(false);

  // Admin session from localStorage
  const adminId = getStoredAdminId();
  const admin = useQuery(
    api.admins.getAdmin,
    adminId ? { adminId: adminId as Id<"admins"> } : "skip",
  );

  const isLoading = isAuthLoading || (adminId !== null && admin === undefined);

  // Admin is authenticated if we have a stored adminId and the admin exists
  const isAdminAuthenticated = adminId !== null && admin !== null && admin !== undefined;

  const signIn = useCallback(
    async (method: string, formData?: any) => {
      // For admin auth, we sign in anonymously to establish a Convex session,
      // then store the adminId in localStorage
      if (method === "admin") {
        const { adminId: id } = formData;
        await convexSignIn("anonymous");
        storeAdminId(id);
        // Re-link the business to the new anonymous Convex user so dashboard data
        // persists across logout/login cycles.
        if (!syncPending.current) {
          syncPending.current = true;
          syncUser({ adminId: id as Id<"admins"> }).catch((err) => {
            console.error("syncUser failed:", err);
          }).finally(() => { syncPending.current = false; });
        }
        return;
      }
      return convexSignIn(method, formData);
    },
    [convexSignIn, syncUser],
  );

  const signOut = useCallback(async () => {
    clearAdminId();
    try {
      await convexSignOut();
    } catch {
      // Ignore Convex sign-out errors
    }
  }, [convexSignOut]);

  return {
    isLoading,
    isAuthenticated: isAdminAuthenticated || isAuthenticated,
    user: admin ?? user,
    signIn,
    signOut,
    admin,
  };
}

function getStoredAdminId(): string | null {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY);
  } catch {
    return null;
  }
}

function storeAdminId(id: string) {
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, id);
  } catch {
    // localStorage unavailable
  }
}

function clearAdminId() {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // localStorage unavailable
  }
}
