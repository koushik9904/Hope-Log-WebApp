import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Check, Loader2, Award, BarChart, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema for the form data
const openaiSettingsSchema = z.object({
  openAiApiKey: z.string().min(20, "API key must be at least 20 characters"),
  enableTokenLimit: z.boolean().default(true),
  monthlyTokenLimit: z.coerce.number().min(0, "Token limit must be a positive number").default(100000),
});

type OpenAISettingsFormValues = z.infer<typeof openaiSettingsSchema>;

// Mock data for user token usage
const mockUserTokenUsage = [
  { id: 1, username: "james_parker", tokensUsed: 34500, lastUsed: "2025-04-18T15:32:00Z" },
  { id: 2, username: "emilywrites", tokensUsed: 29800, lastUsed: "2025-04-20T09:17:00Z" },
  { id: 3, username: "admin", tokensUsed: 5200, lastUsed: "2025-04-21T11:45:00Z" },
  { id: 4, username: "journaluser", tokensUsed: 18600, lastUsed: "2025-04-19T22:30:00Z" },
  { id: 5, username: "mindfulme", tokensUsed: 42100, lastUsed: "2025-04-21T16:12:00Z" },
];

export default function AdminOpenAIPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  // Form setup
  const form = useForm<OpenAISettingsFormValues>({
    resolver: zodResolver(openaiSettingsSchema),
    defaultValues: {
      openAiApiKey: "",
      enableTokenLimit: true,
      monthlyTokenLimit: 100000,
    },
  });

  // Get current OpenAI settings
  const { data: openaiSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/openai-status"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings/openai-status");
        if (!response.ok) throw new Error("Failed to load OpenAI settings");
        return response.json();
      } catch (error) {
        console.error("Error loading OpenAI settings:", error);
        return {
          openAiApiKeyConfigured: false,
          enableTokenLimit: true,
          monthlyTokenLimit: 100000,
          currentTokenUsage: 0
        };
      }
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (openaiSettings) {
      form.reset({
        openAiApiKey: "",  // We don't want to display the actual API key for security
        enableTokenLimit: openaiSettings.enableTokenLimit ?? true,
        monthlyTokenLimit: openaiSettings.monthlyTokenLimit ?? 100000,
      });
    }
  }, [openaiSettings, form]);

  // Update OpenAI settings mutation
  const updateOpenAIMutation = useMutation({
    mutationFn: async (data: OpenAISettingsFormValues) => {
      try {
        const response = await fetch("/api/settings/update-openai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update OpenAI settings");
          } else {
            throw new Error("Server error: " + response.status);
          }
        }
        
        return await response.json();
      } catch (error: any) {
        throw new Error(error?.message || "Failed to communicate with server");
      }
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your OpenAI configuration has been updated successfully.",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ["/api/settings/openai-status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: OpenAISettingsFormValues) {
    updateOpenAIMutation.mutate(data);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Check if user is logged in and is admin
  if (!user?.isAdmin) {
    return <Redirect to="/auth" />;
  }

  // Calculate total token usage
  const totalTokensUsed = mockUserTokenUsage.reduce((sum, user) => sum + user.tokensUsed, 0);
  const usagePercentage = openaiSettings?.monthlyTokenLimit 
    ? Math.min(100, (totalTokensUsed / openaiSettings.monthlyTokenLimit) * 100)
    : 0;

  return (
    <AdminLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">OpenAI Integration</h3>
          
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage OpenAI API settings and token limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <div className="font-medium">OpenAI API Key</div>
                  <Input
                    type="password"
                    placeholder={openaiSettings?.openAiApiKeyConfigured ? "••••••••••••••••••••••" : "Enter your OpenAI API key"}
                    {...form.register("openAiApiKey")}
                  />
                  <div className="text-sm text-muted-foreground">
                    {openaiSettings?.openAiApiKeyConfigured 
                      ? "API key is configured. Enter a new key only if you want to change it." 
                      : "Enter your API key from OpenAI to enable AI features"}
                  </div>
                  {form.formState.errors.openAiApiKey && (
                    <div className="text-sm text-destructive">{form.formState.errors.openAiApiKey.message}</div>
                  )}
                </div>

                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="text-base font-medium">Enable Token Limits</div>
                    <div className="text-sm text-muted-foreground">
                      Restrict monthly token usage across all users
                    </div>
                  </div>
                  <Switch
                    checked={form.watch("enableTokenLimit")}
                    onCheckedChange={(value) => form.setValue("enableTokenLimit", value)}
                  />
                </div>

                {form.watch("enableTokenLimit") && (
                  <div className="space-y-2">
                    <div className="font-medium">Monthly Token Limit</div>
                    <Input
                      type="number"
                      {...form.register("monthlyTokenLimit")}
                    />
                    <div className="text-sm text-muted-foreground">
                      Maximum tokens to use per month (across all users)
                    </div>
                    {form.formState.errors.monthlyTokenLimit && (
                      <div className="text-sm text-destructive">{form.formState.errors.monthlyTokenLimit.message}</div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full sm:w-auto flex items-center gap-2"
                  disabled={updateOpenAIMutation.isPending}
                >
                  {updateOpenAIMutation.isPending ? (
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
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <h3 className="text-xl font-semibold mb-4">Token Usage Analytics</h3>
          
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Monthly Usage Overview</CardTitle>
              <CardDescription>Current usage relative to monthly limit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">
                    {totalTokensUsed.toLocaleString()} / {openaiSettings?.monthlyTokenLimit.toLocaleString()} tokens
                  </span>
                  <span className="text-sm font-medium">
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                
                <div className="flex justify-between items-center pt-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>9 days remaining in billing cycle</span>
                  </div>
                  <div className="flex items-center">
                    <BarChart className="w-4 h-4 mr-1" />
                    <span>Avg: ~{Math.round(totalTokensUsed / mockUserTokenUsage.length).toLocaleString()} per user</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Token Usage</CardTitle>
              <CardDescription>Token usage by individual users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-right">Tokens Used</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                    <TableHead className="text-right">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUserTokenUsage.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell className="font-medium">{userData.username}</TableCell>
                      <TableCell className="text-right">{userData.tokensUsed.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {((userData.tokensUsed / totalTokensUsed) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDate(userData.lastUsed)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  <div className="flex items-center justify-center gap-1 pt-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>Top user: {mockUserTokenUsage.sort((a, b) => b.tokensUsed - a.tokensUsed)[0].username}</span>
                  </div>
                </TableCaption>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}