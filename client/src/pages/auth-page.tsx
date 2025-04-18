import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { Image, MessageCircle, Heart, BarChart, Lightbulb, Sparkles, BookOpen } from "lucide-react";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
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

  const handleSocialLogin = (provider: string) => {
    // In a real implementation, this would redirect to OAuth provider
    console.log(`Logging in with ${provider}`);
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
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
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-10 bg-gray-900">
        <Card className="w-full max-w-md shadow-lg border-0 rounded-xl bg-white">
          <CardHeader className="space-y-1">
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
          <CardContent>
            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <Button 
                variant="outline" 
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin('google')}
              >
                <FcGoogle size={20} />
                <span>Continue with Google</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2" 
                onClick={() => handleSocialLogin('apple')}
              >
                <SiApple size={20} />
                <span>Continue with Apple</span>
              </Button>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input className="pi-input" placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input className="pi-input" type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-black hover:bg-black/80 text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input className="pi-input" placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input className="pi-input" type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input className="pi-input" type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-black hover:bg-black/80 text-white"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-center text-xs text-muted-foreground mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
