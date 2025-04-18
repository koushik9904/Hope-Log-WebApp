import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  Bell, 
  Shield, 
  Download, 
  Mail, 
  LogOut, 
  Save,
  Upload,
  Moon,
  Sun,
  Laptop,
  UserCircle,
  FileText,
  Phone,
  Lock,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

// Profile form schema
const profileFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters."
  }),
  email: z.string().email({
    message: "Please enter a valid email address."
  }),
  fullName: z.string().optional(),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters."
  }).optional()
});

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Please enter your current password."
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters."
  }),
  confirmPassword: z.string().min(8, {
    message: "Please confirm your new password."
  })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

// Types
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const { toast } = useToast();
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      email: "user@example.com", // This would come from the user object in a real app
      fullName: "",
      bio: ""
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("POST", `/api/users/${user?.id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  // Handle password form submission
  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Export data (placeholder function)
  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your data export is being processed. You'll receive a download link shortly."
    });
  };
  
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-64 flex-shrink-0">
          <Tabs
            orientation="vertical"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="flex flex-col items-start h-auto bg-transparent space-y-1 p-0">
              <TabsTrigger
                value="profile"
                className="w-full justify-start px-3 py-2 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <UserCircle className="h-5 w-5 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="w-full justify-start px-3 py-2 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <Lock className="h-5 w-5 mr-2" />
                Password
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="w-full justify-start px-3 py-2 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="w-full justify-start px-3 py-2 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <Shield className="h-5 w-5 mr-2" />
                Privacy
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="w-full justify-start px-3 py-2 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <Sun className="h-5 w-5 mr-2" />
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="data"
                className="w-full justify-start px-3 py-2 rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
              >
                <Download className="h-5 w-5 mr-2" />
                Data & Export
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="mt-8">
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
        
        <div className="flex-1">
          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your public profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                        <User className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="font-medium">Profile Picture</h3>
                        <p className="text-sm text-gray-500 mb-2">PNG, JPG or GIF, max 2MB</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex gap-1">
                            <Upload className="h-4 w-4" />
                            Upload
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your username will be visible to others
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email address" {...field} />
                          </FormControl>
                          <FormDescription>
                            Your email is only used for notifications and won't be shared
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="A brief description about yourself" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Max 160 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="pi-button"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="password" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your new password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 8 characters long
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="pi-button"
                      disabled={updatePasswordMutation.isPending}
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label htmlFor="reminder-email" className="font-medium">Daily Reminders</Label>
                        <p className="text-sm text-gray-500">
                          Receive daily reminders to journal
                        </p>
                      </div>
                      <Switch id="reminder-email" />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label htmlFor="weekly-email" className="font-medium">Weekly Summary</Label>
                        <p className="text-sm text-gray-500">
                          Receive your weekly journal analysis
                        </p>
                      </div>
                      <Switch id="weekly-email" defaultChecked />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label htmlFor="marketing-email" className="font-medium">Product Updates</Label>
                        <p className="text-sm text-gray-500">
                          Receive updates about new features
                        </p>
                      </div>
                      <Switch id="marketing-email" />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Push Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label htmlFor="journal-push" className="font-medium">Journal Reminders</Label>
                        <p className="text-sm text-gray-500">
                          Reminders to write in your journal
                        </p>
                      </div>
                      <Switch id="journal-push" defaultChecked />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label htmlFor="habit-push" className="font-medium">Habit Tracking</Label>
                        <p className="text-sm text-gray-500">
                          Reminders to complete your daily habits
                        </p>
                      </div>
                      <Switch id="habit-push" defaultChecked />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label htmlFor="insight-push" className="font-medium">New Insights</Label>
                        <p className="text-sm text-gray-500">
                          Notifications about new AI insights
                        </p>
                      </div>
                      <Switch id="insight-push" />
                    </div>
                  </div>
                </div>
                
                <Button className="pi-button">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Control your data privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Data Collection</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label htmlFor="analytics" className="font-medium">Usage Analytics</Label>
                        <p className="text-sm text-gray-500">
                          Allow us to collect anonymous usage data to improve the app
                        </p>
                      </div>
                      <Switch id="analytics" defaultChecked />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label htmlFor="personalization" className="font-medium">AI Personalization</Label>
                        <p className="text-sm text-gray-500">
                          Use your journal content to improve AI responses
                        </p>
                      </div>
                      <Switch id="personalization" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Security</h3>
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-medium">Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Badge variant="outline">Coming Soon</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-medium">Connected Devices</Label>
                        <p className="text-sm text-gray-500">
                          Manage devices that have access to your account
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-medium">API Access</Label>
                        <p className="text-sm text-gray-500">
                          Manage third-party access to your data
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all your data. This action cannot be undone.
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-red-600">Delete Account</DialogTitle>
                          <DialogDescription>
                            This action is permanent and cannot be undone. All your data will be permanently erased.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="font-medium">To confirm, type "delete my account" below:</p>
                          <Input placeholder="delete my account" />
                        </div>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button variant="destructive">
                            I understand, delete my account
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="cursor-pointer border-2 border-blue-500">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <Sun className="h-8 w-8 text-amber-500 mb-2" />
                        <h4 className="font-medium">Light</h4>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <Moon className="h-8 w-8 text-indigo-500 mb-2" />
                        <h4 className="font-medium">Dark</h4>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer">
                      <CardContent className="flex flex-col items-center justify-center p-6">
                        <Laptop className="h-8 w-8 text-gray-500 mb-2" />
                        <h4 className="font-medium">System</h4>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Font Size</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" size="sm" className="text-xs">Small</Button>
                      <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700">Medium</Button>
                      <Button variant="outline" size="sm" className="text-base">Large</Button>
                      <Button variant="outline" size="sm" className="text-lg">Extra Large</Button>
                    </div>
                  </div>
                </div>
                
                <Button className="pi-button">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Data & Export</CardTitle>
                <CardDescription>
                  Download your data or delete specific information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Export Your Data</h3>
                  <p className="text-gray-500">
                    You can download all of your data in various formats. This includes your journal entries, mood tracking data, goals, and all other content you've created.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Complete Export</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                          Download all of your Hope Log data in a single file.
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-sm"
                            onClick={handleExportData}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            JSON
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-sm"
                            onClick={handleExportData}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-sm"
                            onClick={handleExportData}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            CSV
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Specific Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                          Select specific data types to export
                        </p>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select data type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="journal">Journal Entries</SelectItem>
                            <SelectItem value="mood">Mood Tracking</SelectItem>
                            <SelectItem value="goals">Goals & Habits</SelectItem>
                            <SelectItem value="insights">AI Insights</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Data Retention</h3>
                  <p className="text-gray-500">
                    Control how long your data is stored in the system
                  </p>
                  
                  <div className="grid gap-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="font-medium">Automatic Backup</Label>
                        <p className="text-sm text-gray-500">
                          Back up your data to secure cloud storage
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div>
                      <Label className="font-medium mb-2 block">Data Retention Period</Label>
                      <Select defaultValue="indefinite">
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6months">6 Months</SelectItem>
                          <SelectItem value="1year">1 Year</SelectItem>
                          <SelectItem value="3years">3 Years</SelectItem>
                          <SelectItem value="indefinite">Indefinite</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500 mt-1">
                        Data older than this period will be automatically deleted
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="pi-button">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </div>
    </div>
  );
}