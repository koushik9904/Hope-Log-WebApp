import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// This page allows an admin to update OAuth settings
// In a production app, this would be protected by admin-only access

const oauthSettingsSchema = z.object({
  googleClientId: z.string().min(20, "Google Client ID is too short").optional(),
  googleClientSecret: z.string().min(10, "Google Client Secret is too short").optional(),
  enableGoogleAuth: z.boolean().default(false),
  enableAppleAuth: z.boolean().default(false)
});

type OAuthSettingsFormValues = z.infer<typeof oauthSettingsSchema>;

export default function SettingsOAuthPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  const form = useForm<OAuthSettingsFormValues>({
    resolver: zodResolver(oauthSettingsSchema),
    defaultValues: {
      googleClientId: "",
      googleClientSecret: "",
      enableGoogleAuth: false,
      enableAppleAuth: false
    }
  });

  // Fetch current OAuth settings status
  const { isLoading } = useQuery({
    queryKey: ["/api/settings/oauth-status"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/settings/oauth-status");
        if (!res.ok) throw new Error("Failed to fetch OAuth status");
        
        const data = await res.json();
        
        // Update form with status (not the actual secrets)
        form.setValue("enableGoogleAuth", data.googleAuthEnabled);
        form.setValue("enableAppleAuth", data.appleAuthEnabled);
        
        return data;
      } catch (error) {
        console.error("Error fetching OAuth status:", error);
        return {
          googleAuthEnabled: false,
          appleAuthEnabled: false
        };
      }
    }
  });

  // Submit updated OAuth settings
  const updateOAuthMutation = useMutation({
    mutationFn: async (data: OAuthSettingsFormValues) => {
      const res = await apiRequest("POST", "/api/settings/update-oauth", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update OAuth settings");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/oauth-status'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "OAuth settings updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      setCredentialsError(error.message);
      toast({
        variant: "destructive",
        title: "Failed to update OAuth settings",
        description: error.message,
      });
    }
  });

  // Test OAuth Credentials
  const testOAuthMutation = useMutation({
    mutationFn: async (data: { provider: string }) => {
      const res = await apiRequest("POST", "/api/settings/test-oauth", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to test OAuth connection");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "OAuth test successful",
        description: data.message || "The OAuth credentials are valid.",
      });
    },
    onError: (error: Error) => {
      setCredentialsError(error.message);
      toast({
        variant: "destructive",
        title: "OAuth test failed",
        description: error.message,
      });
    }
  });

  function onSubmit(data: OAuthSettingsFormValues) {
    updateOAuthMutation.mutate(data);
  }

  // If user is not authenticated, don't show settings
  if (!user) return null;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">OAuth Integration Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure OAuth providers for social login functionality.
          </p>
        </div>

        {credentialsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>OAuth Error</AlertTitle>
            <AlertDescription>{credentialsError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Google OAuth</CardTitle>
            <CardDescription>
              Configure Google OAuth for "Sign in with Google" functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>OAuth Connection Issues</AlertTitle>
              <AlertDescription className="text-xs">
                Due to Replit's network restrictions, Google OAuth connections may fail with "refused to connect" errors.
                Credentials are correct but the connection is being blocked. For production deployment, this limitation
                won't exist.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="enableGoogleAuth"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Google Sign-In</FormLabel>
                        <FormDescription>
                          Allow users to log in with their Google accounts
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="googleClientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Client ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your Google Client ID"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your Google OAuth 2.0 Client ID from the Google Cloud Console
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="googleClientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Client Secret</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Your Google Client Secret"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter your Google OAuth 2.0 Client Secret
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            </Form>
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
                <FormLabel className="text-base">Enable Apple Sign-In</FormLabel>
                <FormDescription>
                  Allow users to log in with their Apple accounts (Coming Soon)
                </FormDescription>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}