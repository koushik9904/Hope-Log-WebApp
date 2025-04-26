import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LoginResponse {
  message?: string;
  verificationRequired?: boolean;
  userId?: number;
  [key: string]: any; // For other user properties
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

interface VerifyEmailData {
  token: string;
}

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  isVerified: boolean; // New property to check if user is verified
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<LoginResponse, Error, InsertUser>;
  forgotPasswordMutation: UseMutationResult<{message: string}, Error, ForgotPasswordData>;
  resetPasswordMutation: UseMutationResult<{message: string}, Error, ResetPasswordData>;
  verifyEmailMutation: UseMutationResult<SelectUser, Error, VerifyEmailData>;
};

type LoginData = {
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Determine if the user is verified
  const isVerified = user?.isVerified ?? false;

  // Enhanced login mutation that handles verification check
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (response: LoginResponse) => {
      // Check if verification is required
      if (response.verificationRequired) {
        toast({
          title: "Verification required",
          description: "Please check your email to verify your account before logging in.",
          variant: "default",
        });
        return;
      }
      
      // User is verified, update the user data
      if (response.id) {
        queryClient.setQueryData(["/api/user"], response);
        toast({
          title: "Login successful",
          description: `Welcome back, ${response.firstName || response.email.split('@')[0]}!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enhanced registration that handles email verification flow
  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (response: LoginResponse) => {
      if (response.verificationRequired) {
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account before logging in.",
        });
      } else if (response.id) {
        // User is already verified (e.g., OAuth login)
        queryClient.setQueryData(["/api/user"], response);
        toast({
          title: "Registration successful",
          description: `Welcome to HopeLog AI, ${response.firstName || response.email.split('@')[0]}!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Standard logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      return await res.json();
    },
    onSuccess: (response: {message: string}) => {
      toast({
        title: "Reset link sent",
        description: response.message || "Please check your email for a password reset link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const res = await apiRequest("POST", `/api/reset-password/${data.token}`, { password: data.password });
      return await res.json();
    },
    onSuccess: (response: {message: string}) => {
      toast({
        title: "Password reset successful",
        description: response.message || "Your password has been reset. You can now log in with your new password.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async (data: VerifyEmailData) => {
      const res = await apiRequest("GET", `/api/verify-email/${data.token}`);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Email verified",
        description: "Your email has been verified. You are now logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Ensure all required properties are provided
  const contextValue: AuthContextType = {
    user: user ?? null,
    isLoading,
    error,
    isVerified,
    loginMutation,
    logoutMutation,
    registerMutation,
    forgotPasswordMutation,
    resetPasswordMutation,
    verifyEmailMutation,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
