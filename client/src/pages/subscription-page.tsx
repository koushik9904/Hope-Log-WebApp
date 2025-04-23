import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CalendarDays, CheckCircle, CreditCard, DollarSign, LockIcon, ShieldCheck } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

// Subscription plan type
type SubscriptionPlan = {
  id: number;
  name: string;
  displayName: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  isActive: boolean;
  featureLimits: {
    maxJournalEntries: number | null;
    maxGoals: number | null;
    aiResponsesPerDay: number | null;
    insightsAccess: boolean;
    customPromptsAccess: boolean;
    weeklyDigestAccess: boolean;
    moodTrackingAccess: boolean;
    exportAccess: boolean;
    communityAccess: boolean;
  } | null;
};

// Active subscription type
type ActiveSubscription = {
  active: boolean;
  subscription: {
    subscription: {
      id: number;
      status: string;
      startDate: string;
      endDate: string;
      cancelAtPeriodEnd: boolean;
      cancelledAt: string | null;
    },
    plan: {
      name: string;
      displayName: string;
      price: number;
      interval: 'month' | 'year';
    }
  } | null;
};

// Payment history type
type PaymentHistory = {
  subscription: {
    id: number;
    startDate: string;
    endDate: string;
    status: string;
  };
  plan: {
    name: string;
    displayName: string;
    price: number;
    interval: 'month' | 'year';
  };
  payment: {
    id: number;
    amount: number;
    paymentMethod: string;
    paymentId: string;
    status: string;
    paymentDate: string;
  } | null;
}[];

const SubscriptionPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("plans");
  const [processingPayPal, setProcessingPayPal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  
  // Fetch subscription plans
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription/plans");
      return await res.json();
    }
  });
  
  // Fetch current subscription
  const { 
    data: currentSubscription, 
    isLoading: subscriptionLoading,
    refetch: refetchSubscription
  } = useQuery<ActiveSubscription>({
    queryKey: ["/api/subscription/current"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription/current");
      return await res.json();
    }
  });
  
  // Fetch payment history
  const { 
    data: paymentHistory, 
    isLoading: historyLoading 
  } = useQuery<PaymentHistory>({
    queryKey: ["/api/subscription/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription/history");
      return await res.json();
    },
    enabled: currentTab === "history" // Only fetch when tab is selected
  });
  
  // Create PayPal order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (planName: string) => {
      const res = await apiRequest("POST", "/api/subscription/create-order", { planName });
      return await res.json();
    },
    onSuccess: (data) => {
      // Redirect to PayPal checkout
      if (data.links) {
        const approvalLink = data.links.find((link: any) => link.rel === "approve");
        if (approvalLink) {
          setProcessingPayPal(true);
          window.location.href = approvalLink.href;
        }
      }
    },
    onError: (error: any) => {
      console.error('[PayPal] Order creation error:', error);
      
      // Create a more detailed error message
      let errorMessage = error.message || "Failed to create payment.";
      
      // Add sandbox testing information
      errorMessage += " Note: For PayPal sandbox testing, please see our sandbox testing instructions.";
      
      toast({
        title: "Error creating order",
        description: errorMessage,
        variant: "destructive"
      });
      setProcessingPayPal(false);
    }
  });
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const res = await apiRequest("POST", "/api/subscription/cancel", { subscriptionId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled but will remain active until the end of your current billing period.",
      });
      // Refetch the subscription data to update the UI
      refetchSubscription();
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error cancelling subscription",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Check for PayPal redirect with order ID (token)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    // PayPal returns the token parameter with the order ID
    const token = queryParams.get("token");
    // Our custom planName parameter that we sent with the return URL
    const planName = queryParams.get("planName");
    // PayPal token parameter from approval URL
    const paypalOrderId = token;
    const cancelled = queryParams.get("cancelled");
    
    console.log('[PayPal] Redirect params:', { token, paypalOrderId, planName, cancelled });
    
    // Clear query params immediately to prevent reprocessing on page refresh
    if (token || planName || cancelled) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (cancelled === "true") {
      // Handle cancellation
      toast({
        title: "Payment cancelled",
        description: "Your payment process was cancelled. You can try again when you're ready.",
        variant: "default"
      });
      setProcessingPayPal(false);
      return;
    }
    
    // If we have either token or paypalOrderId, and we have the planName, we can capture the order
    if ((token || paypalOrderId) && planName) {
      // Handle PayPal redirect with token/orderId
      const captureOrder = async () => {
        try {
          setProcessingPayPal(true);
          const orderId = token || paypalOrderId;
          console.log('[PayPal] Capturing order with token/orderId:', orderId);
          
          const res = await apiRequest("POST", "/api/subscription/capture-order", { 
            orderId, // Use token/paypalOrderId as the orderId
            planName 
          });
          
          if (res.ok) {
            toast({
              title: "Payment successful!",
              description: "Your subscription has been activated. Thank you for your support!",
            });
            // Refetch subscription data
            refetchSubscription();
            queryClient.invalidateQueries({ queryKey: ["/api/subscription/history"] });
            setCurrentTab("subscription");
          } else {
            const errorData = await res.json();
            console.error('[PayPal] Error response:', errorData);
            throw new Error(errorData.message || "Failed to process payment");
          }
        } catch (error: any) {
          console.error('[PayPal] Capture error:', error);
          
          // Create a more detailed error message
          let errorDescription = error.message || "There was an error processing your payment.";
          
          // Add helpful information about sandbox testing
          errorDescription += " For PayPal sandbox testing, use test account credentials from the PayPal Developer Dashboard.";
          
          toast({
            title: "Payment processing failed",
            description: errorDescription,
            variant: "destructive"
          });
        } finally {
          setProcessingPayPal(false);
        }
      };
      
      captureOrder();
    }
  }, [toast, queryClient, refetchSubscription]);
  
  // Handle subscription purchase
  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    createOrderMutation.mutate(plan.name);
    setProcessingPayPal(true);
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = () => {
    if (currentSubscription?.subscription?.subscription?.id) {
      cancelSubscriptionMutation.mutate(currentSubscription.subscription.subscription.id);
    }
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Check if the user has an active subscription
  const hasActiveSubscription = currentSubscription?.active;
  const isPro = user?.subscriptionTier === 'pro' && user?.subscriptionStatus === 'active';
  
  // Loading state
  const isLoading = plansLoading || subscriptionLoading || processingPayPal;
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 md:ml-64 min-h-screen bg-background">
        <div className="container max-w-5xl py-8">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-semibold mb-2">Subscription Management</h1>
              <p className="text-muted-foreground">Manage your subscription and payment information</p>
            </div>
        
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                <TabsTrigger value="subscription">Current Subscription</TabsTrigger>
                <TabsTrigger value="history">Payment History</TabsTrigger>
              </TabsList>
              
              {/* Subscription Plans Tab */}
              <TabsContent value="plans" className="space-y-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <Card key={i} className="h-96">
                        <CardHeader>
                          <Skeleton className="h-8 w-24 mb-2" />
                          <Skeleton className="h-6 w-full" />
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <Skeleton className="h-5 w-full mb-2" />
                          <Skeleton className="h-5 w-full mb-2" />
                          <Skeleton className="h-5 w-full mb-2" />
                          <Skeleton className="h-5 w-full mb-2" />
                          <Skeleton className="h-5 w-full mb-2" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-10 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans?.map((plan) => (
                      <Card key={plan.id} className={`flex flex-col ${plan.name === 'pro' ? 'border-primary/50 shadow-lg' : ''}`}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle>{plan.displayName}</CardTitle>
                            {plan.name === 'pro' && (
                              <Badge variant="default" className="bg-primary">Recommended</Badge>
                            )}
                          </div>
                          <CardDescription>
                            ${plan.price}/{plan.interval}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="mb-4">{plan.description}</p>
                          <h4 className="font-medium mb-2">Features:</h4>
                          <ul className="space-y-2">
                            {plan.featureLimits && (
                              <>
                                <li className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  {plan.featureLimits.maxJournalEntries === null 
                                    ? "Unlimited journal entries" 
                                    : `${plan.featureLimits.maxJournalEntries} journal entries`}
                                </li>
                                <li className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  {plan.featureLimits.maxGoals === null 
                                    ? "Unlimited goals" 
                                    : `${plan.featureLimits.maxGoals} goals`}
                                </li>
                                <li className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  {plan.featureLimits.aiResponsesPerDay === null 
                                    ? "Unlimited AI responses daily" 
                                    : `${plan.featureLimits.aiResponsesPerDay} AI responses per day`}
                                </li>
                                {plan.featureLimits.insightsAccess && (
                                  <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Advanced insights and analytics
                                  </li>
                                )}
                                {plan.featureLimits.customPromptsAccess && (
                                  <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Custom journal prompts
                                  </li>
                                )}
                                {plan.featureLimits.exportAccess && (
                                  <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Data export capability
                                  </li>
                                )}
                                {plan.featureLimits.weeklyDigestAccess && (
                                  <li className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Weekly email digests
                                  </li>
                                )}
                              </>
                            )}
                          </ul>
                        </CardContent>
                        <CardFooter>
                          {plan.name === 'free' ? (
                            isPro ? (
                              <Button variant="outline" className="w-full" disabled>
                                Current Plan
                              </Button>
                            ) : (
                              <Button variant="outline" className="w-full" disabled>
                                Free Plan
                              </Button>
                            )
                          ) : (
                            isPro ? (
                              <Button variant="outline" className="w-full" disabled>
                                {currentSubscription?.subscription?.plan?.name === plan.name 
                                  ? "Current Plan" 
                                  : "Already Subscribed"}
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                className="w-full"
                                onClick={() => handleSubscribe(plan)}
                                disabled={createOrderMutation.isPending || processingPayPal}
                              >
                                {createOrderMutation.isPending || processingPayPal ? (
                                  <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Processing...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Subscribe Now
                                  </span>
                                )}
                              </Button>
                            )
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
                
                <div className="mt-8 space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium mb-1">Secure Subscription</h3>
                        <p className="text-sm text-muted-foreground">
                          All payments are processed securely through PayPal. Your subscription can be cancelled anytime from your account dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Sandbox testing info in development only */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium mb-1 text-blue-700">PayPal Sandbox Testing</h3>
                        <p className="text-sm text-blue-600">
                          This is running in PayPal sandbox mode. For testing, use a PayPal sandbox account or these test credit card details:
                        </p>
                        <ul className="text-sm text-blue-600 mt-2 list-disc pl-5 space-y-1">
                          <li>Card: 4111 1111 1111 1111 (Visa)</li>
                          <li>Expiry: Any future date</li>
                          <li>CVV: Any 3 digits</li>
                        </ul>
                        <p className="text-sm text-blue-600 mt-2">
                          <strong>Note:</strong> Real PayPal accounts and real credit cards will not work in sandbox mode.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Current Subscription Tab */}
              <TabsContent value="subscription" className="space-y-6">
                {subscriptionLoading ? (
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-5 w-full mb-3" />
                      <Skeleton className="h-5 w-3/4 mb-3" />
                      <Skeleton className="h-5 w-1/2 mb-3" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-36" />
                    </CardFooter>
                  </Card>
                ) : hasActiveSubscription && currentSubscription?.subscription ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">
                          {currentSubscription.subscription.plan.displayName} Subscription
                        </CardTitle>
                        <Badge variant={currentSubscription.subscription.subscription.status === 'active' ? 'default' : 'secondary'}>
                          {currentSubscription.subscription.subscription.status === 'active'
                            ? currentSubscription.subscription.subscription.cancelAtPeriodEnd
                              ? 'Cancelling'
                              : 'Active'
                            : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Billing: ${currentSubscription.subscription.plan.price}/{currentSubscription.subscription.plan.interval}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Start Date:
                          </span>
                          <span className="font-medium">
                            {formatDate(currentSubscription.subscription.subscription.startDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            End Date:
                          </span>
                          <span className="font-medium">
                            {formatDate(currentSubscription.subscription.subscription.endDate)}
                          </span>
                        </div>
                        {currentSubscription.subscription.subscription.cancelAtPeriodEnd && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              Cancelled On:
                            </span>
                            <span className="font-medium">
                              {currentSubscription.subscription.subscription.cancelledAt 
                                ? formatDate(currentSubscription.subscription.subscription.cancelledAt)
                                : 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      {/* Usage stats */}
                      <div>
                        <h3 className="font-medium mb-3">Current Usage</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span>Journal Entries</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="text-muted-foreground h-4 w-4">?</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Total number of journal entries you have created</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <span className="text-sm font-medium">
                                {/* These would be replaced with actual values */}
                                {isPro ? "Unlimited" : "15/20"}
                              </span>
                            </div>
                            {!isPro && <Progress value={75} />}
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span>AI Responses Today</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="text-muted-foreground h-4 w-4">?</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Number of AI responses you have used today</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <span className="text-sm font-medium">
                                {/* These would be replaced with actual values */}
                                {isPro ? "Unlimited" : "8/10"}
                              </span>
                            </div>
                            {!isPro && <Progress value={80} />}
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span>Goals</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="text-muted-foreground h-4 w-4">?</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Total number of goals you can create and track</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <span className="text-sm font-medium">
                                {/* These would be replaced with actual values */}
                                {isPro ? "Unlimited" : "3/5"}
                              </span>
                            </div>
                            {!isPro && <Progress value={60} />}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {currentSubscription.subscription.subscription.status === 'active' && 
                       !currentSubscription.subscription.subscription.cancelAtPeriodEnd && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">Cancel Subscription</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Your subscription will remain active until the end of your current billing period. After that, you'll be downgraded to the free plan with limited features.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelSubscription}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Yes, Cancel
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </CardFooter>
                  </Card>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Active Subscription</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      You're currently on the free plan. Upgrade to a premium plan to unlock additional features and higher usage limits.
                    </p>
                    <Button onClick={() => setCurrentTab("plans")} variant="default">
                      View Subscription Plans
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Payment History Tab */}
              <TabsContent value="history">
                {historyLoading ? (
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-6 w-36 mb-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="border-b pb-4 last:border-0">
                            <Skeleton className="h-5 w-full mb-2" />
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-5 w-1/2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : paymentHistory && paymentHistory.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {paymentHistory.map((item, index) => (
                          <div key={index} className="border-b pb-6 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">
                                  {item.plan.displayName} Subscription
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(item.subscription.startDate)} - {formatDate(item.subscription.endDate)}
                                </p>
                              </div>
                              <Badge variant={item.payment?.status === 'completed' ? 'outline' : 'secondary'}>
                                {item.payment?.status || 'No payment'}
                              </Badge>
                            </div>
                            
                            {item.payment && (
                              <div className="mt-2 space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Amount:</span>
                                  <span>${item.payment.amount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Payment Method:</span>
                                  <span className="capitalize">{item.payment.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Date:</span>
                                  <span>{formatDate(item.payment.paymentDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Transaction ID:</span>
                                  <span className="text-xs truncate max-w-[180px]">{item.payment.paymentId}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Payment History</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      You haven't made any payments yet. Subscribe to a plan to get started.
                    </p>
                    <Button onClick={() => setCurrentTab("plans")} variant="default">
                      View Subscription Plans
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;