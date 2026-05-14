import { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export type StaffUser = {
  id: number;
  username: string;
  displayName: string | null;
  role: "admin" | "staff";
};

type StaffAuthContextType = {
  staff: StaffUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refetch: () => void;
};

const StaffAuthContext = createContext<StaffAuthContextType>({
  staff: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  refetch: () => {},
});

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.staffAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const staff = data ?? null;

  return (
    <StaffAuthContext.Provider value={{
      staff,
      isLoading,
      isAuthenticated: !!staff,
      isAdmin: staff?.role === "admin",
      refetch,
    }}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  return useContext(StaffAuthContext);
}
