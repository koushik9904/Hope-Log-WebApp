import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Switch } from "@/components/ui/switch";
import { Shield, EyeOff, Key, Ban, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPrivacyPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-amber-700 mb-1">Coming Soon</h3>
              <p className="text-sm text-amber-600">
                Our Privacy Settings module is under development. The preview below shows what's coming!
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 font-['Montserrat_Variable']">Privacy & Security</h1>
          <p className="text-gray-500 font-['Inter_Variable']">
            Manage your security and data privacy settings
          </p>
        </div>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable']">Privacy Settings</CardTitle>
            <CardDescription>
              Control how your data is used and stored
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-[#B6CAEB] bg-opacity-20 flex items-center justify-center">
                    <EyeOff className="h-5 w-5 text-[#B6CAEB]" />
                  </div>
                  <div>
                    <p className="font-medium">Privacy Mode</p>
                    <p className="text-sm text-gray-500">Keep your journal entries private from AI analysis</p>
                  </div>
                </div>
                <Switch disabled={true} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-[#B6CAEB] bg-opacity-20 flex items-center justify-center">
                    <Key className="h-5 w-5 text-[#B6CAEB]" />
                  </div>
                  <div>
                    <p className="font-medium">Journal Encryption</p>
                    <p className="text-sm text-gray-500">Enable end-to-end encryption for all journal entries</p>
                  </div>
                </div>
                <Switch defaultChecked disabled={true} />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-full bg-[#B6CAEB] bg-opacity-20 flex items-center justify-center">
                    <Ban className="h-5 w-5 text-[#B6CAEB]" />
                  </div>
                  <div>
                    <p className="font-medium">Data Collection</p>
                    <p className="text-sm text-gray-500">Allow anonymous usage data to improve the app</p>
                  </div>
                </div>
                <Switch defaultChecked disabled={true} />
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-['Montserrat_Variable']">Account Security</h3>
              
              <div className="grid gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-[#9AAB63]" />
                    <p className="font-medium">Two-Factor Authentication</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 ml-7">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 ml-7" disabled={true}>
                    Enable 2FA
                  </Button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    <p className="font-medium">Delete Account</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 ml-7">
                    Permanently delete your account and all data
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 ml-7 text-red-500 border-red-200 hover:bg-red-50" disabled={true}>
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}