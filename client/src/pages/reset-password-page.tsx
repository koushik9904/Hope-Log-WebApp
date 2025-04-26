import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setIsValidToken(false);
        setError("No reset token provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await apiRequest("GET", `/api/reset-password/${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setError(data.error || "Invalid or expired token");
          toast({
            variant: "destructive",
            title: "Invalid token",
            description: data.error || "The password reset link is invalid or has expired."
          });
        }
      } catch (error) {
        setIsValidToken(false);
        setError("An error occurred while validating your token");
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while validating your token"
        });
      } finally {
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token, toast]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <header className="w-full py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-center sm:justify-start">
          <HopeLogLogo className="h-8" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-md">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Validating your reset link...</p>
              </div>
            ) : isValidToken ? (
              <ResetPasswordForm token={token} />
            ) : (
              <div className="text-center py-10">
                <h2 className="text-2xl font-semibold mb-4">Invalid Reset Link</h2>
                <p className="text-muted-foreground mb-6">
                  {error || "The password reset link is invalid or has expired."}
                </p>
                <Button onClick={() => setLocation("/auth")}>
                  Return to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="mt-auto py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} HopeLog AI. All rights reserved.</p>
      </footer>
    </div>
  );
}