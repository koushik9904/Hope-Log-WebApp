import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Redirect, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { Image, MessageCircle, Heart, BarChart, Lightbulb, Sparkles, BookOpen, AlertCircle } from "lucide-react";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema
  .extend({
    name: z.string().min(1, "Name is required"), 
    username: z.string().optional(), // Make username optional
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Define the login data with email instead of username
type LoginData = {
  email: string;
  password: string;
};

type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [location] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check for error in URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error');
    if (errorMsg) {
      setError(errorMsg);
      // Log the error for debugging
      console.error("Authentication error:", decodeURIComponent(errorMsg));
      // Show toast for error
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: errorMsg
      });
    }
  }, [location, toast]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterData) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  // This function is kept for future implementation but not currently used
  // since both Google and Apple login buttons are disabled with "Coming Soon" status
  const handleSocialLogin = (provider: string) => {
    if (provider === 'google') {
      toast({
        title: "Google Sign-In Coming Soon",
        description: "Google Sign-In is currently being configured and will be available soon.",
        className: "bg-blue-50 border-blue-200"
      });
    } else if (provider === 'apple') {
      toast({
        title: "Apple Sign-In Coming Soon",
        description: "Apple Sign-In will be available in a future update.",
        className: "bg-amber-50 border-amber-200"
      });
    }
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen max-w-full flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-black p-10 text-white flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6">
            <HopeLogLogo size="lg" withText className="w-auto" />
          </div>
          
          <h2 className="text-3xl font-bold mb-6">Your AI-powered mental wellness companion</h2>
          
          <p className="text-lg mb-8">
            Journal with our AI assistant, track your mood, and gain insights to improve your mental wellbeing.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-white bg-opacity-10 p-2 rounded-xl mr-4">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Conversational Journaling</h3>
                <p className="text-sm text-white text-opacity-90 mt-1">Get empathetic responses and guided reflection</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white bg-opacity-10 p-2 rounded-xl mr-4">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Mood Tracking</h3>
                <p className="text-sm text-white text-opacity-90 mt-1">Visualize your emotional patterns over time</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white bg-opacity-10 p-2 rounded-xl mr-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl">AI Insights</h3>
                <p className="text-sm text-white text-opacity-90 mt-1">Receive personalized mental wellness recommendations</p>
              </div>
            </div>
            
            <div className="mt-10 flex items-center">
              <div className="flex overflow-hidden -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-300 flex items-center justify-center text-xs font-bold text-white">JD</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-pink-400 flex items-center justify-center text-xs font-bold text-white">KL</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-green-400 flex items-center justify-center text-xs font-bold text-white">TM</div>
              </div>
              <div className="ml-3">
                <p className="text-sm">Join 25,000+ users using Hope Log</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-3 sm:p-4 md:p-10 bg-gray-900 min-h-screen md:min-h-0">
        <Card className="w-full max-w-md shadow-lg border-0 rounded-xl bg-white overflow-hidden my-2 md:my-0">
          <CardHeader className="space-y-1 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-center md:hidden mb-4">
              <div className="bg-black rounded-xl p-2">
                <HopeLogLogo size="md" withText className="w-auto" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Continue your mental wellness journey
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Error message if present */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {/* Check if it's a multiline error with instructions */}
                  {error.includes('\n') ? (
                    <div className="whitespace-pre-wrap text-xs">
                      {error}
                    </div>
                  ) : (
                    error
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Info Alert about OAuth Status */}
            <Alert className="mb-4 bg-blue-50 border-blue-200 text-xs">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700">
                <strong>Social login coming soon:</strong> Google and Apple Sign-In options will be available in a future update. Please use email/password login for now.
              </AlertDescription>
            </Alert>

            {/* Social Login Buttons */}
            <div className="mb-6">              
              <div className="flex flex-col gap-2 mt-3">
                <Button 
                  variant="outline" 
                  className="w-full bg-white hover:bg-gray-50 border border-gray-300 flex items-center justify-center gap-2 opacity-60 text-sm"
                  disabled
                  title="Google Sign-In coming soon"
                >
                  <FcGoogle size={18} />
                  <span className="truncate">Google Sign-In (Coming Soon)</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-white hover:bg-gray-50 border border-gray-300 flex items-center justify-center gap-2 opacity-60 text-sm"
                  disabled
                  title="Apple Sign-In coming soon"
                >
                  <SiApple size={18} />
                  <span className="truncate">Apple Sign-In (Coming Soon)</span>
                </Button>
              </div>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Continue with</span>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                {showForgotPassword ? (
                  <div className="py-2">
                    <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
                  </div>
                ) : (
                  <>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3 mb-1">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Email</FormLabel>
                              <FormControl>
                                <Input className="pi-input h-9" type="email" placeholder="Enter your email address" {...field} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Password</FormLabel>
                              <FormControl>
                                <Input className="pi-input h-9" type="password" placeholder="Enter your password" {...field} />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full bg-black hover:bg-black/80 text-white h-9 mt-1"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    </Form>
                    <div className="text-center mt-4">
                      <Button 
                        variant="link" 
                        className="text-xs text-muted-foreground hover:text-black p-0"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot your password?
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3 mb-1">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input className="pi-input h-9" placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Email</FormLabel>
                          <FormControl>
                            <Input className="pi-input h-9" type="email" placeholder="Enter your email address" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Password</FormLabel>
                          <FormControl>
                            <Input className="pi-input h-9" type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Confirm Password</FormLabel>
                          <FormControl>
                            <Input className="pi-input h-9" type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-black hover:bg-black/80 text-white h-9 mt-1"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col px-4 sm:px-6 py-4">
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
