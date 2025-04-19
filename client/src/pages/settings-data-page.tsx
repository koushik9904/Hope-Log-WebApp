import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Download, FileJson, FileText, Database, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

export default function SettingsDataPage() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  
  if (!user) return null;

  const handleExport = (format: string) => {
    setExporting(true);
    setProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setExporting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 font-['Montserrat_Variable']">Data & Export</h1>
          <p className="text-gray-500 font-['Inter_Variable']">
            Export your journal data and manage storage
          </p>
        </div>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable']">Export Your Data</CardTitle>
            <CardDescription>
              Download all your journal entries, mood tracking, and goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center mb-2">
                  <FileJson className="h-5 w-5 mr-2 text-[#F5B8DB]" />
                  <h3 className="font-medium">JSON Format</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Export your data in JSON format for use with other applications
                </p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 mr-2 text-[#9AAB63]" />
                  <h3 className="font-medium">CSV Format</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Export your data as CSV files for use with spreadsheets
                </p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
              </div>
            </div>
            
            {exporting && (
              <div className="mt-4">
                <div className="flex justify-between mb-2 text-sm">
                  <span>Exporting your data...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable']">Data Storage</CardTitle>
            <CardDescription>
              View your storage usage and manage your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-[#B6CAEB]" />
                  <h3 className="font-medium">Storage Usage</h3>
                </div>
                <span className="text-sm font-medium">3.2 MB / 50 MB</span>
              </div>
              <Progress value={6.4} className="h-2 mb-2" />
              <p className="text-sm text-gray-500">
                You're using 6.4% of your available storage. Standard plan includes 50MB of storage.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border rounded-lg p-4">
                <p className="font-medium">Journal Entries</p>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">42 entries</span>
                  <span className="text-sm text-gray-500">2.1 MB</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <p className="font-medium">Mood Tracking</p>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">78 entries</span>
                  <span className="text-sm text-gray-500">0.4 MB</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <p className="font-medium">Goals & Habits</p>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">12 goals</span>
                  <span className="text-sm text-gray-500">0.3 MB</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <p className="font-medium">AI Insights</p>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">8 reports</span>
                  <span className="text-sm text-gray-500">0.4 MB</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t p-4">
            <p className="text-sm text-gray-500">
              Need more storage? Upgrade to our Premium plan for 500MB storage and additional features.
            </p>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}