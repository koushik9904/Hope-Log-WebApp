import { AdminLayout } from "@/components/admin/admin-layout";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertCircle, 
  CreditCard, 
  DollarSign, 
  ExternalLink, 
  Info, 
  Settings
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Form schema for PayPal settings
const paypalSettingsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  mode: z.enum(["sandbox", "live"], {
    required_error: "Mode is required",
  }),
  callbackUrl: z.string().url("Must be a valid URL").optional(),
});

type PayPalSettings = z.infer<typeof paypalSettingsSchema>;

// PayPal transaction type
type PayPalTransaction = {
  id: number;
  userId: number;
  username: string;
  amount: number;
  status: string;
  date: string;
  planName: string;
  paymentId: string;
};

export default function AdminPaypalPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("settings");

  // Query to get current PayPal settings
  const { 
    data: paypalSettings, 
    isLoading: settingsLoading 
  } = useQuery<PayPalSettings>({
    queryKey: ["/api/admin/paypal-settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paypal-settings");
      return await res.json();
    }
  });
  
  // Query to get recent transactions
  const { 
    data: transactions, 
    isLoading: transactionsLoading 
  } = useQuery<PayPalTransaction[]>({
    queryKey: ["/api/admin/paypal-transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/paypal-transactions");
      return await res.json();
    },
    enabled: activeTab === "transactions"
  });

  // Mutation to update PayPal settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: PayPalSettings) => {
      const res = await apiRequest("POST", "/api/admin/paypal-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "PayPal settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/paypal-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "There was an error updating the PayPal settings.",
        variant: "destructive",
      });
    }
  });
  
  // Set up form with default values from settings query
  const form = useForm<PayPalSettings>({
    resolver: zodResolver(paypalSettingsSchema),
    defaultValues: {
      clientId: paypalSettings?.clientId || "",
      clientSecret: paypalSettings?.clientSecret || "",
      mode: paypalSettings?.mode || "sandbox",
      callbackUrl: paypalSettings?.callbackUrl || "",
    },
    values: paypalSettings,
  });
  
  // Update form when settings are loaded
  /*useEffect(() => {
    if (paypalSettings) {
      form.reset(paypalSettings);
    }
  }, [paypalSettings, form]);*/
  
  // Handle form submission
  const onSubmit = (data: PayPalSettings) => {
    updateSettingsMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">PayPal Integration</h3>
          <a 
            href="https://developer.paypal.com/dashboard/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm flex items-center hover:underline"
          >
            PayPal Developer Dashboard 
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Setup Guide
            </TabsTrigger>
          </TabsList>
          
          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>PayPal API Settings</CardTitle>
                <CardDescription>
                  Configure your PayPal API credentials to enable subscription payments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Client ID
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Info className="h-4 w-4 ml-2 text-muted-foreground inline cursor-help" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <p className="text-sm">
                                    The Client ID is provided by PayPal when you create an app in your PayPal Developer Dashboard.
                                  </p>
                                </HoverCardContent>
                              </HoverCard>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter your PayPal Client ID" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="clientSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Client Secret
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Info className="h-4 w-4 ml-2 text-muted-foreground inline cursor-help" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <p className="text-sm">
                                    The Client Secret is provided alongside the Client ID and should be kept secure.
                                  </p>
                                </HoverCardContent>
                              </HoverCard>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                placeholder="Enter your PayPal Client Secret" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Environment Mode</FormLabel>
                            <FormControl>
                              <div className="flex gap-4">
                                <Button
                                  type="button"
                                  variant={field.value === "sandbox" ? "default" : "outline"}
                                  className="flex-1"
                                  onClick={() => field.onChange("sandbox")}
                                >
                                  Sandbox (Testing)
                                </Button>
                                <Button
                                  type="button"
                                  variant={field.value === "live" ? "default" : "outline"}
                                  className="flex-1"
                                  onClick={() => field.onChange("live")}
                                >
                                  Live (Production)
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Use Sandbox for testing and Live for real transactions.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="callbackUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Return URL (Optional)
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <Info className="h-4 w-4 ml-2 text-muted-foreground inline cursor-help" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <p className="text-sm">
                                    The URL where PayPal will redirect users after they complete or cancel the payment. If not specified, the app's main URL will be used.
                                  </p>
                                </HoverCardContent>
                              </HoverCard>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="https://example.com/subscription" 
                              />
                            </FormControl>
                            <FormDescription>
                              Where users will be redirected after payment.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Important Notes</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Your PayPal account must be verified and in good standing.</li>
                            <li>For live transactions, make sure you have completed all PayPal account requirements.</li>
                            <li>Sandbox mode does not process real money and is ideal for testing.</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateSettingsMutation.isPending}
                          className="min-w-32"
                        >
                          {updateSettingsMutation.isPending ? (
                            <>
                              <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                              Saving...
                            </>
                          ) : "Save Settings"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>
                  View recent subscription payments processed through PayPal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ))}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-5 gap-4 py-2 px-3 bg-muted rounded-sm text-xs font-medium text-muted-foreground">
                      <div>User</div>
                      <div>Date</div>
                      <div>Plan</div>
                      <div>Amount</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="grid grid-cols-5 gap-4 py-3 px-3 text-sm">
                          <div>{transaction.username}</div>
                          <div>{new Date(transaction.date).toLocaleDateString()}</div>
                          <div>{transaction.planName}</div>
                          <div>${transaction.amount.toFixed(2)}</div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No transactions yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Subscription payments will appear here once users upgrade to premium plans.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <div className="text-sm text-muted-foreground">
                  {transactions && transactions.length > 0 ? (
                    `Showing ${transactions.length} recent transactions`
                  ) : "No transaction data to display"}
                </div>
                {transactions && transactions.length > 0 && (
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Setup Guide Tab */}
          <TabsContent value="guide">
            <Card>
              <CardHeader>
                <CardTitle>PayPal Integration Guide</CardTitle>
                <CardDescription>
                  Step-by-step instructions for setting up PayPal for your Hope Log subscription payments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Create a PayPal Developer Account</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        If you don't already have one, sign up for a PayPal Developer account at <a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">developer.paypal.com</a>.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Create a PayPal App</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        In the Developer Dashboard, navigate to "My Apps & Credentials" and click "Create App". 
                        Select "Merchant" as the app type and provide a name like "Hope Log Subscription".
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Get API Credentials</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Once your app is created, you'll receive a Client ID and Secret. Copy these values to use in the Settings tab.
                        Make sure to get credentials for both Sandbox (testing) and Live (production) environments.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Configure Webhook (Optional but Recommended)</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Set up a webhook in your PayPal app to receive real-time notifications about payment events.
                        Use your app's URL + "/api/webhooks/paypal" as the webhook URL.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      5
                    </div>
                    <div>
                      <h4 className="font-medium">Test Your Integration</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use the Sandbox environment to test payments without real money. PayPal provides test accounts
                        you can use to simulate both buyer and seller roles.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      6
                    </div>
                    <div>
                      <h4 className="font-medium">Go Live</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Once testing is complete, switch to the Live environment by updating your credentials in the Settings tab.
                        Make sure your PayPal business account is verified and in good standing.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Additional Resources</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                      <li>
                        <a href="https://developer.paypal.com/docs/checkout/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                          PayPal Checkout Documentation
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </li>
                      <li>
                        <a href="https://developer.paypal.com/docs/api/orders/v2/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                          PayPal Orders API Reference
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </li>
                      <li>
                        <a href="https://developer.paypal.com/docs/subscriptions/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                          PayPal Subscriptions API
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}