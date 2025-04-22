import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Users, Activity, Database } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">System Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {/* This would ideally come from an API */}
              27
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {/* This would ideally come from an API */}
              3
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Database Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Online</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                System Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                No critical alerts
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm">Configure OAuth Settings</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Update Google and Apple OAuth credentials
              </CardContent>
            </Card>
            
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-sm">Manage Users</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                View, edit, or delete user accounts
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}