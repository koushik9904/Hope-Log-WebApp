import { useEffect } from "react";
import { useNotificationPreferences } from "@/hooks/use-notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PageLayout } from "@/components/layout/page-layout";

export default function NotificationsSettingsPage() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();

  // Generate time options for notifications
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of ["00", "30"]) {
      const formattedHour = hour.toString().padStart(2, "0");
      timeOptions.push(`${formattedHour}:${minute}`);
    }
  }

  // Format time for display
  const formatTimeForDisplay = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const isPM = hour >= 12;
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${isPM ? "PM" : "AM"}`;
  };

  // Handle toggle changes
  const handleToggleChange = (key: string, value: boolean) => {
    if (preferences) {
      updatePreferences({ 
        ...preferences, 
        [key]: value 
      });
    }
  };

  // Handle reminder time change
  const handleTimeChange = (time: string) => {
    if (preferences) {
      updatePreferences({ 
        ...preferences, 
        reminderTime: time 
      });
    }
  };

  // Create default preferences if none exist
  useEffect(() => {
    if (!isLoading && !preferences) {
      updatePreferences({
        journalReminders: true,
        goalReminders: true,
        weeklyDigest: true,
        emailNotifications: false,
        browserNotifications: true,
        reminderTime: "09:00"
      });
    }
  }, [isLoading, preferences, updatePreferences]);

  if (isLoading) {
    return (
      <PageLayout heading="Settings" subheading="Manage your account settings and preferences">
        <div className="flex items-center justify-center w-full h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#F5B8DB]" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout heading="Settings" subheading="Manage your account settings and preferences">
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-medium text-amber-700 mb-1">Coming Soon</h3>
            <p className="text-sm text-amber-600">
              Our Notification System is under development. The preview below shows what's coming!
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-medium">Notification Settings</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Configure how and when you want to receive notifications and reminders
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reminder Types</CardTitle>
            <CardDescription>
              Choose which reminders and notifications you'd like to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="journal-reminders" className="font-medium">
                  Journal Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders to write in your journal
                </p>
              </div>
              <Switch 
                id="journal-reminders" 
                checked={preferences?.journalReminders} 
                onCheckedChange={(checked) => handleToggleChange("journalReminders", checked)}
                disabled={true}
              />
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="goal-reminders" className="font-medium">
                  Goal Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminders about your goals and progress
                </p>
              </div>
              <Switch 
                id="goal-reminders" 
                checked={preferences?.goalReminders}
                onCheckedChange={(checked) => handleToggleChange("goalReminders", checked)}
                disabled={true}
              />
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="weekly-digest" className="font-medium">
                  Weekly Digest
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your journal entries and progress
                </p>
              </div>
              <Switch 
                id="weekly-digest" 
                checked={preferences?.weeklyDigest}
                onCheckedChange={(checked) => handleToggleChange("weeklyDigest", checked)}
                disabled={true}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Methods</CardTitle>
            <CardDescription>
              Choose how you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="browser-notifications" className="font-medium">
                  Browser Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in your browser when you're using Hope Log
                </p>
              </div>
              <Switch 
                id="browser-notifications" 
                checked={preferences?.browserNotifications}
                onCheckedChange={(checked) => handleToggleChange("browserNotifications", checked)}
                disabled={true}
              />
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email (coming soon)
                </p>
              </div>
              <Switch 
                id="email-notifications" 
                checked={preferences?.emailNotifications}
                onCheckedChange={(checked) => handleToggleChange("emailNotifications", checked)}
                disabled={true}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reminder Schedule</CardTitle>
            <CardDescription>
              Set when you want to receive your daily reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 max-w-xs">
              <Label htmlFor="reminder-time">Daily reminder time</Label>
              <Select 
                value={preferences?.reminderTime || "09:00"} 
                onValueChange={handleTimeChange}
                disabled={true}
              >
                <SelectTrigger id="reminder-time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {formatTimeForDisplay(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Reminders will be sent at approximately this time each day
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}