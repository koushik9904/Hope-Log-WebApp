import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { useAuth } from "@/hooks/use-auth";

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { verifyEmailMutation } = useAuth();

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setError("No verification token provided");
        return;
      }

      try {
        verifyEmailMutation.mutate({ token }, {
          onSuccess: () => {
            setStatus("success");
            // Redirect to home page after 3 seconds
            setTimeout(() => {
              setLocation("/");
            }, 3000);
          },
          onError: (error: Error) => {
            setStatus("error");
            setError(error.message || "Invalid or expired verification token");
            toast({
              variant: "destructive",
              title: "Verification failed",
              description: error.message || "The verification link is invalid or has expired."
            });
          }
        });
      } catch (error) {
        setStatus("error");
        setError("An error occurred while verifying your email");
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while verifying your email"
        });
      }
    }

    verifyEmail();
  }, [token, toast, verifyEmailMutation, setLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <header className="w-full py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-center sm:justify-start">
          <HopeLogLogo className="h-8" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-md">
          <CardContent className="pt-6 pb-8 text-center">
            {status === "loading" && (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-xl font-medium mb-2">Verifying your email</p>
                <p className="text-muted-foreground">Please wait a moment...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-green-700">Email Verified!</h2>
                <p className="text-muted-foreground mb-6">
                  Your email has been successfully verified. You'll be redirected to the dashboard in a few seconds.
                </p>
                <Button onClick={() => setLocation("/")}>
                  Go to Dashboard
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-red-700">Verification Failed</h2>
                <p className="text-muted-foreground mb-6">
                  {error || "The verification link is invalid or has expired."}
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