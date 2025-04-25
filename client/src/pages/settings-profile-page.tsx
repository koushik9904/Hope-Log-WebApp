import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Upload, Save, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

// Types
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsProfilePage() {
  const { user } = useAuth();
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

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 font-['Montserrat_Variable']">Profile Settings</h1>
          <p className="text-gray-500 font-['Inter_Variable']">
            Manage your profile information
          </p>
        </div>

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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Time Zone Settings</CardTitle>
            <CardDescription>Configure your preferred time zone for journal entries</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Select
                    value={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    onValueChange={(value) => {
                      // Save timezone preference
                      apiRequest("PATCH", "/api/user/preferences", {
                        timezone: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Intl.supportedValuesOf('timeZone').map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}