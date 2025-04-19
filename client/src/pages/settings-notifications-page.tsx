import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsNotificationsPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 font-['Montserrat_Variable']">Notifications</h1>
          <p className="text-gray-500 font-['Inter_Variable']">
            Manage your notification preferences
          </p>
        </div>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable']">Notification Settings</CardTitle>
            <CardDescription>
              Choose when and how you'd like to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-[#F5D867] bg-opacity-20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-[#F5D867]" />
                  </div>
                  <div>
                    <p className="font-medium">Journal Reminders</p>
                    <p className="text-sm text-gray-500">Receive reminders to write in your journal</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-[#F5D867] bg-opacity-20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-[#F5D867]" />
                  </div>
                  <div>
                    <p className="font-medium">Weekly Summary</p>
                    <p className="text-sm text-gray-500">Get a weekly report of your journaling progress</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-[#F5D867] bg-opacity-20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-[#F5D867]" />
                  </div>
                  <div>
                    <p className="font-medium">Goal Updates</p>
                    <p className="text-sm text-gray-500">Notifications about your goals and progress</p>
                  </div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-[#F5D867] bg-opacity-20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-[#F5D867]" />
                  </div>
                  <div>
                    <p className="font-medium">New Features</p>
                    <p className="text-sm text-gray-500">Stay informed about new features and updates</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Notification settings will be saved automatically. Email notifications coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}