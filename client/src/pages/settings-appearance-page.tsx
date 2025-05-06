import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Sun, Moon, Palette, CircleCheck, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function SettingsAppearancePage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState("light");
  const [colorScheme, setColorScheme] = useState("pastel");
  
  if (!user) return null;

  const colorSchemes = [
    {
      id: "pastel",
      name: "Pastel Dreams",
      colors: ["#F5B8DB", "#9AAB63", "#B6CAEB", "#F5D867"],
      bg: "#FFF8E8"
    },
    {
      id: "forest",
      name: "Forest Calm",
      colors: ["#8BC496", "#4C5B5C", "#C6D7B9", "#F5F0BB"],
      bg: "#F9F7F1"
    },
    {
      id: "ocean",
      name: "Ocean Breeze",
      colors: ["#6FB3B8", "#388087", "#BADFE7", "#F6F6F2"],
      bg: "#F0F6F6"
    },
    {
      id: "sunset",
      name: "Sunset Glow",
      colors: ["#F67280", "#C06C84", "#6C5B7B", "#355C7D"],
      bg: "#FFF5F5"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-amber-700 mb-1">Coming Soon</h3>
              <p className="text-sm text-amber-600">
                Our Appearance Settings module is under development. The preview below shows what's coming!
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 font-['Montserrat_Variable']">Appearance</h1>
          <p className="text-gray-500 font-['Inter_Variable']">
            Customize how Hope Log looks and feels
          </p>
        </div>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable']">Theme</CardTitle>
            <CardDescription>
              Choose between light and dark mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <RadioGroup 
              defaultValue="light" 
              className="grid grid-cols-2 gap-4"
              value={theme}
              onValueChange={setTheme}
              disabled={true}
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gray-50 p-4 hover:bg-gray-100 hover:text-accent-foreground peer-data-[state=checked]:border-[#F5D867] [&:has([data-state=checked])]:border-[#F5D867]"
                >
                  <Sun className="mb-3 h-6 w-6 text-[#F5D867]" />
                  <div className="text-center">
                    <p className="font-medium">Light</p>
                    <p className="text-sm text-gray-500">Bright and airy interface</p>
                  </div>
                </Label>
              </div>
              
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gray-50 p-4 hover:bg-gray-100 hover:text-accent-foreground peer-data-[state=checked]:border-[#F5D867] [&:has([data-state=checked])]:border-[#F5D867]"
                >
                  <Moon className="mb-3 h-6 w-6 text-gray-600" />
                  <div className="text-center">
                    <p className="font-medium">Dark</p>
                    <p className="text-sm text-gray-500">Easier on the eyes at night</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="font-['Montserrat_Variable']">Color Schemes</CardTitle>
            <CardDescription>
              Choose a color scheme that matches your style
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className={cn(
                    "relative cursor-not-allowed rounded-lg border-2 p-4 opacity-75",
                    colorScheme === scheme.id 
                      ? "border-[#F5D867]" 
                      : "border-transparent hover:border-gray-200"
                  )}
                  onClick={() => {/* Disabled */}}
                  style={{ backgroundColor: scheme.bg }}
                >
                  {colorScheme === scheme.id && (
                    <div className="absolute top-2 right-2">
                      <CircleCheck className="h-5 w-5 text-[#F5D867]" />
                    </div>
                  )}
                  
                  <div className="mb-3 flex items-center">
                    <Palette className="mr-2 h-5 w-5 text-gray-700" />
                    <h3 className="font-medium">{scheme.name}</h3>
                  </div>
                  
                  <div className="flex space-x-2">
                    {scheme.colors.map((color, index) => (
                      <div
                        key={index}
                        className="h-8 w-8 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Theme and color preferences will be saved automatically. You can change them anytime.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}