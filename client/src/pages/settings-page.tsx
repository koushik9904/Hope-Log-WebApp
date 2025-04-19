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
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 font-['Montserrat_Variable']">Settings</h1>
          <p className="text-gray-500 font-['Inter_Variable']">
            Manage your account settings and preferences
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-64 flex-shrink-0">
            <div className="w-full">
              <div className="flex flex-col items-start h-auto bg-transparent space-y-1 p-0">
                <Button
                  variant={activeTab === "profile" ? "secondary" : "ghost"}
                  className={`w-full justify-start px-3 py-2 rounded-md ${activeTab === "profile" ? "bg-[#FFF8E8] text-gray-800" : ""}`}
                  onClick={() => setActiveTab("profile")}
                >
                  <UserCircle className={`h-5 w-5 mr-2 ${activeTab === "profile" ? "text-[#F5B8DB]" : ""}`} />
                  Profile
                </Button>
                <Button
                  variant={activeTab === "password" ? "secondary" : "ghost"}
                  className={`w-full justify-start px-3 py-2 rounded-md ${activeTab === "password" ? "bg-[#FFF8E8] text-gray-800" : ""}`}
                  onClick={() => setActiveTab("password")}
                >
                  <Lock className={`h-5 w-5 mr-2 ${activeTab === "password" ? "text-[#9AAB63]" : ""}`} />
                  Password
                </Button>
                <Button
                  variant={activeTab === "notifications" ? "secondary" : "ghost"}
                  className={`w-full justify-start px-3 py-2 rounded-md ${activeTab === "notifications" ? "bg-[#FFF8E8] text-gray-800" : ""}`}
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className={`h-5 w-5 mr-2 ${activeTab === "notifications" ? "text-[#F5D867]" : ""}`} />
                  Notifications
                </Button>
                <Button
                  variant={activeTab === "privacy" ? "secondary" : "ghost"}
                  className={`w-full justify-start px-3 py-2 rounded-md ${activeTab === "privacy" ? "bg-[#FFF8E8] text-gray-800" : ""}`}
                  onClick={() => setActiveTab("privacy")}
                >
                  <Shield className={`h-5 w-5 mr-2 ${activeTab === "privacy" ? "text-[#B6CAEB]" : ""}`} />
                  Privacy
                </Button>
                <Button
                  variant={activeTab === "appearance" ? "secondary" : "ghost"}
                  className={`w-full justify-start px-3 py-2 rounded-md ${activeTab === "appearance" ? "bg-[#FFF8E8] text-gray-800" : ""}`}
                  onClick={() => setActiveTab("appearance")}
                >
                  <Sun className={`h-5 w-5 mr-2 ${activeTab === "appearance" ? "text-[#F5D867]" : ""}`} />
                  Appearance
                </Button>
                <Button
                  variant={activeTab === "data" ? "secondary" : "ghost"}
                  className={`w-full justify-start px-3 py-2 rounded-md ${activeTab === "data" ? "bg-[#FFF8E8] text-gray-800" : ""}`}
                  onClick={() => setActiveTab("data")}
                >
                  <Download className={`h-5 w-5 mr-2 ${activeTab === "data" ? "text-[#F5B8DB]" : ""}`} />
                  Data & Export
                </Button>
              </div>
            </div>
            
            <div className="mt-8">
              <Button
                variant="outline"
                className="w-full text-red-600 bg-white border-red-200 hover:bg-red-50 hover:text-red-700 justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
          
          <div className="flex-1">
            {activeTab === "profile" && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Profile Information</CardTitle>
                  <CardDescription>
                    Manage your public profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#FFF8E8] flex items-center justify-center text-[#F5B8DB]">
                          <User className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="font-medium">Profile Picture</h3>
                          <p className="text-sm text-gray-500 mb-2">PNG, JPG or GIF, max 2MB</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex gap-1 bg-white">
                              <Upload className="h-4 w-4" />
                              Upload
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 bg-white">
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
                              <Input placeholder="Username" {...field} className="bg-white" />
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
                              <Input placeholder="Email address" {...field} className="bg-white" />
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
                              <Input placeholder="Your full name" {...field} value={field.value || ""} className="bg-white" />
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
                              <Input placeholder="A brief description about yourself" {...field} value={field.value || ""} className="bg-white" />
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
                        className="bg-[#F5B8DB] hover:bg-[#f096c9] text-white"
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
            )}
            
            {activeTab === "password" && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your current password" {...field} className="bg-white" />
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
                              <Input type="password" placeholder="Enter your new password" {...field} className="bg-white" />
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
                              <Input type="password" placeholder="Confirm your new password" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="bg-[#9AAB63] hover:bg-[#8a9a56] text-white"
                        disabled={updatePasswordMutation.isPending}
                      >
                        {updatePasswordMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
            
            {activeTab === "notifications" && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Notification Settings</CardTitle>
                  <CardDescription>
                    Choose what updates you receive and how
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <h3 className="font-medium font-['Montserrat_Variable']">Email Notifications</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="journal-reminders">Journal Reminders</Label>
                          <p className="text-sm text-gray-500">
                            Get reminders to update your journal
                          </p>
                        </div>
                        <Switch id="journal-reminders" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weekly-summary">Weekly Summary</Label>
                          <p className="text-sm text-gray-500">
                            Receive a weekly summary of your progress
                          </p>
                        </div>
                        <Switch id="weekly-summary" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="goal-updates">Goal Updates</Label>
                          <p className="text-sm text-gray-500">
                            Notifications about your goal progress
                          </p>
                        </div>
                        <Switch id="goal-updates" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="news-updates">News & Product Updates</Label>
                          <p className="text-sm text-gray-500">
                            Hear about new features and improvements
                          </p>
                        </div>
                        <Switch id="news-updates" />
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <h3 className="font-medium font-['Montserrat_Variable']">Push Notifications</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="push-journal">Journal Reminders</Label>
                          <p className="text-sm text-gray-500">
                            Get push notifications to remind you to journal
                          </p>
                        </div>
                        <Switch id="push-journal" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="push-habits">Habit Reminders</Label>
                          <p className="text-sm text-gray-500">
                            Reminders to complete your daily habits
                          </p>
                        </div>
                        <Switch id="push-habits" defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <Button className="bg-[#F5D867] hover:bg-[#e9c640] text-gray-800">
                    <Bell className="h-4 w-4 mr-2" />
                    Save Notification Preferences
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {activeTab === "privacy" && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Privacy Settings</CardTitle>
                  <CardDescription>
                    Control your data and privacy preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <h3 className="font-medium font-['Montserrat_Variable']">Data Collection</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="usage-data">Usage Data</Label>
                          <p className="text-sm text-gray-500">
                            Allow us to collect anonymous usage data to improve the app
                          </p>
                        </div>
                        <Switch id="usage-data" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="personalization">Personalization</Label>
                          <p className="text-sm text-gray-500">
                            Personalize your experience based on your usage patterns
                          </p>
                        </div>
                        <Switch id="personalization" defaultChecked />
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <h3 className="font-medium font-['Montserrat_Variable']">Privacy Controls</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-500">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="bg-white">
                          Enable
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="delete-account">Delete Account</Label>
                          <p className="text-sm text-gray-500">
                            Permanently delete your account and all data
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="bg-white text-red-600 hover:bg-red-50">
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="bg-[#B6CAEB] hover:bg-[#99b7e2] text-gray-800">
                    <Shield className="h-4 w-4 mr-2" />
                    Save Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {activeTab === "appearance" && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <h3 className="font-medium font-['Montserrat_Variable']">Theme</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className={`border rounded-xl p-4 cursor-pointer bg-white flex flex-col items-center gap-2 border-[#F5D867]`}>
                        <Sun className="h-6 w-6 text-[#F5D867]" />
                        <span className="text-sm font-medium">Light</span>
                      </div>
                      
                      <div className={`border rounded-xl p-4 cursor-pointer flex flex-col items-center gap-2`}>
                        <Moon className="h-6 w-6 text-gray-400" />
                        <span className="text-sm">Dark</span>
                      </div>
                      
                      <div className={`border rounded-xl p-4 cursor-pointer flex flex-col items-center gap-2`}>
                        <Laptop className="h-6 w-6 text-gray-400" />
                        <span className="text-sm">System</span>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <h3 className="font-medium font-['Montserrat_Variable']">Color Scheme</h3>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="w-full aspect-square rounded-xl bg-[#F5B8DB] cursor-pointer ring-2 ring-offset-2 ring-[#F5B8DB]"></div>
                      <div className="w-full aspect-square rounded-xl bg-[#9AAB63] cursor-pointer"></div>
                      <div className="w-full aspect-square rounded-xl bg-[#B6CAEB] cursor-pointer"></div>
                      <div className="w-full aspect-square rounded-xl bg-[#F5D867] cursor-pointer"></div>
                    </div>
                  </div>
                  
                  <Button className="bg-[#F5D867] hover:bg-[#e9c640] text-gray-800">
                    <Sun className="h-4 w-4 mr-2" />
                    Save Appearance Settings
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {activeTab === "data" && (
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="font-['Montserrat_Variable']">Data & Export</CardTitle>
                  <CardDescription>
                    Manage and export your data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <h3 className="font-medium font-['Montserrat_Variable']">Export Data</h3>
                    
                    <div className="p-4 rounded-xl bg-[#FFF8E8] space-y-4">
                      <div className="flex items-start space-x-4">
                        <FileText className="h-6 w-6 text-[#F5B8DB] mt-1" />
                        <div>
                          <h4 className="font-medium">Export Your Journal Data</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Download a copy of all your journal entries, goals, and mood tracking data in JSON or CSV format.
                          </p>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-white"
                              onClick={handleExportData}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              JSON
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-white"
                              onClick={handleExportData}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              CSV
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <h3 className="font-medium font-['Montserrat_Variable']">Import Data</h3>
                    
                    <div className="p-4 rounded-xl bg-[#FFF8E8] space-y-2">
                      <div className="flex items-start space-x-4">
                        <Upload className="h-6 w-6 text-[#9AAB63] mt-1" />
                        <div>
                          <h4 className="font-medium">Import Journal Data</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Import your journal entries from another platform or a previous export.
                          </p>
                          <Button variant="outline" size="sm" className="bg-white">
                            <Upload className="h-4 w-4 mr-1" />
                            Select File to Import
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Mail className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Your data exports will be sent to your email address. Make sure your email is up to date in your profile settings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}