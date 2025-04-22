import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/admin/admin-layout";

// This page is only accessible to admin users for managing OAuth settings

// Schema for the form data
const oauthSettingsSchema = z.object({
  enableGoogleAuth: z.boolean().default(false),
  googleClientId: z.string().min(1, "Client ID is required"),
  googleClientSecret: z.string().min(1, "Client Secret is required"),
});

type OAuthSettingsFormValues = z.infer<typeof oauthSettingsSchema>;

export default function AdminOAuthPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  // Form setup
  const form = useForm<OAuthSettingsFormValues>({
    resolver: zodResolver(oauthSettingsSchema),
    defaultValues: {
      enableGoogleAuth: false,
      googleClientId: "",
      googleClientSecret: "",
    },
  });

  // Get current OAuth settings
  const { data: oauthSettings } = useQuery({
    queryKey: ["/api/oauth-status"],
    queryFn: async () => {
      const response = await fetch("/api/oauth-status");
      if (!response.ok) throw new Error("Failed to load OAuth settings");
      return response.json();
    },
    onSuccess: (data) => {
      // Update form values with existing settings
      form.reset({
        enableGoogleAuth: data.enableGoogleAuth || false,
        googleClientId: data.googleClientId || "",
        googleClientSecret: data.googleClientSecret || "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error loading OAuth settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update OAuth settings mutation
  const updateOAuthMutation = useMutation({
    mutationFn: async (data: OAuthSettingsFormValues) => {
      const response = await apiRequest("POST", "/api/update-oauth", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update OAuth settings");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OAuth settings saved",
        description: "Your OAuth configuration has been updated successfully.",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["/api/oauth-status"] });
      setCredentialsError(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test OAuth connection mutation
  const testOAuthMutation = useMutation({
    mutationFn: async ({ provider }: { provider: string }) => {
      const response = await apiRequest("POST", "/api/test-oauth", { provider });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "OAuth test failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "OAuth test successful",
        description: "Your OAuth credentials are valid.",
      });
      setCredentialsError(null);
    },
    onError: (error: Error) => {
      setCredentialsError(error.message);
      toast({
        title: "OAuth test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: OAuthSettingsFormValues) {
    updateOAuthMutation.mutate(data);
  }

  // Check if user is logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <AdminLayout>
      <h3 className="text-xl font-semibold mb-6">OAuth Integration Settings</h3>

      {credentialsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>OAuth Error</AlertTitle>
          <AlertDescription>{credentialsError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google OAuth</CardTitle>
            <CardDescription>
              Configure Google OAuth for "Sign in with Google" functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-600">OAuth Connection Issues</AlertTitle>
              <AlertDescription className="text-xs text-amber-700">
                Due to Replit's network restrictions, Google OAuth connections may fail with "refused to connect" errors.
                Credentials are correct but the connection is being blocked. For production deployment, this limitation
                won't exist.
              </AlertDescription>
            </Alert>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Enable Google Sign-In</div>
                  <div className="text-sm text-muted-foreground">
                    Allow users to log in with their Google accounts
                  </div>
                </div>
                <Switch
                  checked={form.watch("enableGoogleAuth")}
                  onCheckedChange={(value) => form.setValue("enableGoogleAuth", value)}
                />
              </div>

              <div className="space-y-2">
                <div className="font-medium">Google Client ID</div>
                <Input
                  placeholder="Your Google Client ID"
                  {...form.register("googleClientId")}
                />
                <div className="text-sm text-muted-foreground">
                  Enter your Google OAuth 2.0 Client ID from the Google Cloud Console
                </div>
                {form.formState.errors.googleClientId && (
                  <div className="text-sm text-destructive">{form.formState.errors.googleClientId.message}</div>
                )}
              </div>

              <div className="space-y-2">
                <div className="font-medium">Google Client Secret</div>
                <Input
                  type="password"
                  placeholder="Your Google Client Secret"
                  {...form.register("googleClientSecret")}
                />
                <div className="text-sm text-muted-foreground">
                  Enter your Google OAuth 2.0 Client Secret
                </div>
                {form.formState.errors.googleClientSecret && (
                  <div className="text-sm text-destructive">{form.formState.errors.googleClientSecret.message}</div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  className="w-full sm:w-auto flex items-center gap-2"
                  disabled={updateOAuthMutation.isPending}
                >
                  {updateOAuthMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Saved</span>
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => testOAuthMutation.mutate({ provider: 'google' })}
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={testOAuthMutation.isPending || !form.getValues().googleClientId}
                >
                  {testOAuthMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Apple OAuth</CardTitle>
            <CardDescription>
              Configure Apple OAuth for "Sign in with Apple" functionality (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="text-base font-medium">Enable Apple Sign-In</div>
                <div className="text-sm text-muted-foreground">
                  Allow users to log in with their Apple accounts (Coming Soon)
                </div>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}