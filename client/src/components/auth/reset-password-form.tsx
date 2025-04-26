import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

// Password reset validation schema
const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { resetPasswordMutation } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [, setLocation] = useLocation();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(
      { token, password: data.password },
      {
        onSuccess: () => {
          setSubmitted(true);
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            setLocation("/auth");
          }, 3000);
        },
      }
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
        <p className="text-sm text-muted-foreground">
          Create a new password for your account
        </p>
      </div>

      {submitted ? (
        <div className="text-center py-6 bg-green-50 rounded-lg p-6 border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">Password successfully reset!</h4>
          <p className="text-sm text-green-600 mb-4">
            Your password has been updated. You'll be redirected to the login page in a few seconds.
          </p>
          <Button variant="outline" onClick={() => setLocation("/auth")}>
            Go to login
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">New Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      className="pi-input h-9" 
                      placeholder="Enter your new password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      className="pi-input h-9" 
                      placeholder="Confirm your new password" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-black hover:bg-black/80 text-white h-9 mt-2"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}