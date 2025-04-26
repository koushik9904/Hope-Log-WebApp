import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Upload, Save, RefreshCw, Calendar, MapPin, X, Tag, Heart } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { AvatarSelector } from "@/components/profile/avatar-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Common hobby suggestions
const HOBBY_SUGGESTIONS = [
  "Reading", "Writing", "Hiking", "Biking", "Swimming", "Cooking", "Baking", 
  "Gardening", "Photography", "Painting", "Drawing", "Music", "Dancing", 
  "Yoga", "Meditation", "Fitness", "Running", "Travel", "Movies", "Gaming", 
  "Knitting", "Crafting", "Woodworking", "Coding", "Blogging"
];

// Common interest suggestions
const INTEREST_SUGGESTIONS = [
  "Technology", "Science", "Art", "Music", "Literature", "History", "Philosophy", 
  "Psychology", "Sociology", "Politics", "Economics", "Business", "Finance", 
  "Health", "Wellness", "Fitness", "Sports", "Nature", "Environment", "Animals", 
  "Travel", "Culture", "Languages", "Food", "Fashion", "Film", "Television", 
  "Theater", "Dance", "Architecture", "Design", "Education", "Personal Growth"
];

// Pronoun options
const PRONOUN_OPTIONS = [
  "he/him", "she/her", "they/them", "he/they", "she/they", "ze/zir", 
  "xe/xem", "prefer not to say", "other"
];

// Profile form schema
const profileFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters."
  }),
  email: z.string().email({
    message: "Please enter a valid email address."
  }),
  name: z.string().min(1, "Name is required"),
  displayName: z.string().optional(),
  bio: z.string().max(160, {
    message: "Bio must not be longer than 160 characters."
  }).optional(),
  pronouns: z.string().optional(),
  dateOfBirth: z.date().optional(),
  location: z.string().optional(),
  hobbies: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  avatar: z.string().optional(),
});

// Types
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [newHobby, setNewHobby] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [filteredHobbies, setFilteredHobbies] = useState<string[]>([]);
  const [filteredInterests, setFilteredInterests] = useState<string[]>([]);
  
  // Filter hobby suggestions based on input
  useEffect(() => {
    if (newHobby) {
      setFilteredHobbies(
        HOBBY_SUGGESTIONS.filter(hobby => 
          hobby.toLowerCase().includes(newHobby.toLowerCase())
        )
      );
    } else {
      setFilteredHobbies(HOBBY_SUGGESTIONS);
    }
  }, [newHobby]);
  
  // Filter interest suggestions based on input
  useEffect(() => {
    if (newInterest) {
      setFilteredInterests(
        INTEREST_SUGGESTIONS.filter(interest => 
          interest.toLowerCase().includes(newInterest.toLowerCase())
        )
      );
    } else {
      setFilteredInterests(INTEREST_SUGGESTIONS);
    }
  }, [newInterest]);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      name: user?.name || "",
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      pronouns: user?.pronouns || "",
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      location: user?.location || "",
      hobbies: user?.hobbies || [],
      interests: user?.interests || [],
      avatar: user?.avatar || "",
    },
  });

  // Handle avatar upload
  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File size validation (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive"
      });
      return;
    }
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
    
    // Create FormData and upload
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await fetch(`/api/users/${user?.id}/avatar`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload avatar');
      
      const data = await response.json();
      profileForm.setValue('avatar', data.avatarUrl);
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated",
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };
  
  // Handle avatar remove
  const handleRemoveAvatar = async () => {
    try {
      await apiRequest("DELETE", `/api/users/${user?.id}/avatar`);
      setAvatarPreview(null);
      setAvatarFile(null);
      profileForm.setValue('avatar', '');
      
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed"
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
    } catch (error) {
      toast({
        title: "Failed to remove avatar",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };
  
  // Add a hobby
  const addHobby = (hobby: string) => {
    const currentHobbies = profileForm.getValues("hobbies") || [];
    if (hobby && !currentHobbies.includes(hobby)) {
      profileForm.setValue("hobbies", [...currentHobbies, hobby]);
      setNewHobby("");
    }
  };
  
  // Remove a hobby
  const removeHobby = (hobby: string) => {
    const currentHobbies = profileForm.getValues("hobbies") || [];
    profileForm.setValue(
      "hobbies", 
      currentHobbies.filter(h => h !== hobby)
    );
  };
  
  // Add an interest
  const addInterest = (interest: string) => {
    const currentInterests = profileForm.getValues("interests") || [];
    if (interest && !currentInterests.includes(interest)) {
      profileForm.setValue("interests", [...currentInterests, interest]);
      setNewInterest("");
    }
  };
  
  // Remove an interest
  const removeInterest = (interest: string) => {
    const currentInterests = profileForm.getValues("interests") || [];
    profileForm.setValue(
      "interests", 
      currentInterests.filter(i => i !== interest)
    );
  };

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
      <div className="space-y-6 pb-8">
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
                {/* Use our enhanced AvatarSelector component */}
                <AvatarSelector 
                  userId={user.id} 
                  currentAvatar={avatarPreview || user?.avatar || undefined}
                  onAvatarChange={(newAvatarUrl: string) => {
                    if (newAvatarUrl) {
                      setAvatarPreview(newAvatarUrl);
                      profileForm.setValue('avatar', newAvatarUrl);
                    } else {
                      setAvatarPreview(null);
                      profileForm.setValue('avatar', '');
                    }
                  }}
                />

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} value={field.value || ""} className="bg-white" />
                        </FormControl>
                        <FormDescription>
                          Required - Used for addressing you in the app
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="How you want to be addressed" {...field} value={field.value || ""} className="bg-white" />
                        </FormControl>
                        <FormDescription>
                          Used in preference to Name if provided
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={profileForm.control}
                    name="pronouns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pronouns (Optional)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select your pronouns" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRONOUN_OPTIONS.map((pronoun) => (
                              <SelectItem key={pronoun} value={pronoun}>
                                {pronoun}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How you'd like to be referred to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal bg-white ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Your date of birth helps personalize your experience
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="City, Country" 
                            {...field} 
                            value={field.value || ""} 
                            className="bg-white pl-9" 
                          />
                          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Where you're based
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="hobbies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hobbies (Optional)</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(field.value || []).map((hobby) => (
                          <Badge 
                            key={hobby} 
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#FFF8E8] text-[#9AAB63] border border-[#9AAB63]/20"
                          >
                            {hobby}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1 text-[#9AAB63] hover:text-[#9AAB63]/80 hover:bg-transparent"
                              onClick={() => removeHobby(hobby)}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove {hobby}</span>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                placeholder="Add hobbies"
                                value={newHobby}
                                onChange={(e) => setNewHobby(e.target.value)}
                                className="bg-white pl-9"
                              />
                              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search hobbies..." />
                              <CommandList>
                                <CommandEmpty>No hobbies found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredHobbies.map((hobby) => (
                                    <CommandItem
                                      key={hobby}
                                      onSelect={() => {
                                        addHobby(hobby);
                                      }}
                                    >
                                      {hobby}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <div className="flex items-center mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => newHobby && addHobby(newHobby)}
                          className="bg-white text-xs h-7"
                        >
                          Add Custom Hobby
                        </Button>
                      </div>
                      <FormDescription>
                        Activities you enjoy in your free time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests (Optional)</FormLabel>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(field.value || []).map((interest) => (
                          <Badge 
                            key={interest} 
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#F5EBFF] text-[#B6CAEB] border border-[#B6CAEB]/20"
                          >
                            {interest}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1 text-[#B6CAEB] hover:text-[#B6CAEB]/80 hover:bg-transparent"
                              onClick={() => removeInterest(interest)}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove {interest}</span>
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                placeholder="Add interests"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                className="bg-white pl-9"
                              />
                              <Heart className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search interests..." />
                              <CommandList>
                                <CommandEmpty>No interests found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredInterests.map((interest) => (
                                    <CommandItem
                                      key={interest}
                                      onSelect={() => {
                                        addInterest(interest);
                                      }}
                                    >
                                      {interest}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <div className="flex items-center mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => newInterest && addInterest(newInterest)}
                          className="bg-white text-xs h-7"
                        >
                          Add Custom Interest
                        </Button>
                      </div>
                      <FormDescription>
                        Topics you're passionate about
                      </FormDescription>
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
                        <Textarea 
                          placeholder="A brief description about yourself" 
                          className="resize-none bg-white" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Max 160 characters. This helps the AI personalize your conversations.
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
                    defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
                    onValueChange={(value) => {
                      // Save timezone preference using notification preferences endpoint
                      apiRequest("PATCH", "/api/notification-preferences", {
                        timezone: value
                      }).then(() => {
                        toast({
                          title: "Time zone updated",
                          description: "Your time zone preference has been saved.",
                        });
                      }).catch((error) => {
                        toast({
                          title: "Error updating time zone",
                          description: error.message,
                          variant: "destructive"
                        });
                      });
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {Intl.supportedValuesOf('timeZone').map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2">
                    This setting affects how dates are displayed in your journal and when daily reminders are sent.
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}