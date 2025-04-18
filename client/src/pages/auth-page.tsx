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

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-primary p-10 text-white flex-col justify-center">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white mr-4">
              <i className="ri-mental-health-line text-2xl"></i>
            </div>
            <h1 className="text-3xl font-bold font-nunito">HopeLog AI</h1>
          </div>
          
          <h2 className="text-3xl font-bold mb-6">Your AI-powered mental wellness companion</h2>
          
          <p className="text-lg mb-8">
            Journal with our AI assistant, track your mood, and gain insights to improve your mental wellbeing.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white bg-opacity-10 p-2 rounded-full mr-4">
                <i className="ri-chat-smile-3-line"></i>
              </div>
              <div>
                <h3 className="font-bold">Conversational Journaling</h3>
                <p className="text-sm text-white text-opacity-80">Get empathetic responses and guided reflection</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white bg-opacity-10 p-2 rounded-full mr-4">
                <i className="ri-emotion-line"></i>
              </div>
              <div>
                <h3 className="font-bold">Mood Tracking</h3>
                <p className="text-sm text-white text-opacity-80">Visualize your emotional patterns over time</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-white bg-opacity-10 p-2 rounded-full mr-4">
                <i className="ri-lightbulb-line"></i>
              </div>
              <div>
                <h3 className="font-bold">AI Insights</h3>
                <p className="text-sm text-white text-opacity-80">Receive personalized mental wellness recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center md:hidden mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                <i className="ri-mental-health-line text-xl"></i>
              </div>
              <h1 className="text-2xl font-bold font-nunito">HopeLog AI</h1>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Start your mental wellness journey today
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                            <Input placeholder="Enter your username" {...field} />
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
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-dark"
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
                            <Input placeholder="Choose a username" {...field} />
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
                            <Input type="password" placeholder="Create a password" {...field} />
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
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary-dark"
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
            <p className="text-center text-sm text-muted-foreground mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
