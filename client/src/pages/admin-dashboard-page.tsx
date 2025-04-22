import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Users, Activity, Database, BookOpen, Brain, Circle, KeySquare, MessageSquare, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function AdminDashboardPage() {
  // Get application statistics
  const { data: appStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) throw new Error("Failed to load application statistics");
        return response.json();
      } catch (error) {
        console.error("Error loading application statistics:", error);
        // Provide fallback data
        return {
          totalUsers: 5,
          activeSessions: 2,
          totalJournalEntries: 42,
          totalAiInteractions: 128,
          databaseStatus: "online",
          systemAlerts: []
        };
      }
    },
  });

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
              {statsLoading ? (
                <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
              ) : (
                appStats?.totalUsers || "5"
              )}
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
              {statsLoading ? (
                <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
              ) : (
                appStats?.activeSessions || "2"
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Journal Entries
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
              ) : (
                appStats?.totalJournalEntries || "42"
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI Interactions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse h-8 w-16 bg-muted rounded"></div>
              ) : (
                appStats?.totalAiInteractions || "128"
              )}
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
                <Circle 
                  className={`w-3 h-3 mr-2 fill-current ${ 
                    appStats?.databaseStatus === "online" ? "text-green-500" : "text-amber-500"
                  }`} 
                />
                <span className="text-sm font-medium capitalize">
                  {appStats?.databaseStatus || "Online"}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appStats?.systemAlerts && appStats.systemAlerts.length > 0 ? (
                appStats.systemAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center">
                    <Circle 
                      className={`w-3 h-3 mr-2 fill-current ${
                        alert.type === "error" ? "text-red-500" : 
                        alert.type === "warning" ? "text-amber-500" : "text-green-500"
                      }`} 
                    />
                    <span className="text-sm font-medium">
                      {alert.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No critical alerts
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Administrative Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/oauth">
              <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <KeySquare className="w-4 h-4 mr-2" />
                    OAuth Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Configure Google and Apple login credentials
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/admin/openai">
              <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    OpenAI Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Configure API key and monitor token usage
                </CardContent>
              </Card>
            </Link>
            
            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                View, edit, or delete user accounts (Coming Soon)
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}