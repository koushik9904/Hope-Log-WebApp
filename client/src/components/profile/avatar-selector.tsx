import { useState, useRef, ChangeEvent } from "react";
import { User, Upload, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

// Standard avatar options
const STANDARD_AVATARS = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
  "/avatars/avatar7.png",
  "/avatars/avatar8.png",
];

export interface AvatarSelectorProps {
  userId: number;
  currentAvatar?: string | null;
  onAvatarChange: (avatarUrl: string) => void;
}

export function AvatarSelector({ userId, currentAvatar, onAvatarChange }: AvatarSelectorProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedStandardAvatar, setSelectedStandardAvatar] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);
  const [selectedGeneratedAvatar, setSelectedGeneratedAvatar] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file selection for upload
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
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
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
      setSelectedStandardAvatar(null);
      setSelectedGeneratedAvatar(null);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle selection of standard avatar
  const handleStandardAvatarSelect = (avatarUrl: string) => {
    setSelectedStandardAvatar(avatarUrl);
    setUploadPreview(null);
    setSelectedGeneratedAvatar(null);
  };
  
  // Handle selection of AI-generated avatar
  const handleGeneratedAvatarSelect = (avatarUrl: string) => {
    setSelectedGeneratedAvatar(avatarUrl);
    setUploadPreview(null);
    setSelectedStandardAvatar(null);
  };

  // Handle AI avatar generation
  const generateAvatars = async () => {
    if (!avatarPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your avatar",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const response = await apiRequest("POST", "/api/avatar/generate", {
        prompt: avatarPrompt
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate avatars");
      }
      
      const data = await response.json();
      setGeneratedAvatars(data.avatars || []);
      
      if (data.avatars && data.avatars.length > 0) {
        // Auto-select the first generated avatar
        setSelectedGeneratedAvatar(data.avatars[0]);
        setUploadPreview(null);
        setSelectedStandardAvatar(null);
      }
      
      toast({
        title: "Avatars generated",
        description: "Please select your favorite generated avatar"
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate avatars",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the selected avatar
  const saveAvatar = async () => {
    try {
      let avatarUrl = "";
      
      if (uploadPreview) {
        // Handle custom upload
        const formData = new FormData();
        const blob = await fetch(uploadPreview).then(r => r.blob());
        formData.append('avatar', blob);
        
        const response = await fetch(`/api/users/${userId}/avatar`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error('Failed to upload avatar');
        
        const data = await response.json();
        avatarUrl = data.avatarUrl;
      } else if (selectedStandardAvatar) {
        // Handle standard avatar selection
        const response = await apiRequest("POST", `/api/users/${userId}/avatar/standard`, {
          avatarUrl: selectedStandardAvatar
        });
        
        if (!response.ok) throw new Error('Failed to set standard avatar');
        
        const data = await response.json();
        avatarUrl = data.avatarUrl;
      } else if (selectedGeneratedAvatar) {
        // Handle AI-generated avatar selection
        const response = await apiRequest("POST", `/api/users/${userId}/avatar/generated`, {
          avatarUrl: selectedGeneratedAvatar
        });
        
        if (!response.ok) throw new Error('Failed to set generated avatar');
        
        const data = await response.json();
        avatarUrl = data.avatarUrl;
      } else {
        throw new Error("No avatar selected");
      }
      
      onAvatarChange(avatarUrl);
      setIsDialogOpen(false);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated"
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-24 h-24 rounded-full bg-[#FFF8E8] flex items-center justify-center text-[#F5B8DB] overflow-hidden">
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-12 w-12" />
        )}
      </div>
      <div>
        <h3 className="font-medium">Profile Picture</h3>
        <p className="text-sm text-gray-500 mb-2">Select or generate your avatar</p>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex gap-1 bg-white"
              >
                <Upload className="h-4 w-4" />
                Change Avatar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Choose Your Avatar</DialogTitle>
                <DialogDescription>
                  Upload a custom image, select from our collection, or generate an AI avatar
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="standard">Standard</TabsTrigger>
                  <TabsTrigger value="ai">AI Generate</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-32 h-32 rounded-full bg-[#FFF8E8] flex items-center justify-center text-[#F5B8DB] overflow-hidden">
                      {uploadPreview ? (
                        <img
                          src={uploadPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/png, image/jpeg, image/gif"
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select Image
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or GIF, max 2MB
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="standard">
                  <div className="grid grid-cols-4 gap-3">
                    {STANDARD_AVATARS.map((avatar, index) => (
                      <div 
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                          selectedStandardAvatar === avatar ? 'ring-2 ring-[#F5B8DB] ring-offset-2' : 'hover:opacity-80'
                        }`}
                        onClick={() => handleStandardAvatarSelect(avatar)}
                      >
                        <img 
                          src={avatar} 
                          alt={`Standard avatar ${index + 1}`} 
                          className="w-full aspect-square object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="ai" className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="avatar-prompt">Describe your avatar</Label>
                    <Textarea 
                      id="avatar-prompt"
                      placeholder="E.g., A professional with glasses and short hair, minimalist style"
                      value={avatarPrompt}
                      onChange={(e) => setAvatarPrompt(e.target.value)}
                    />
                    <Button 
                      onClick={generateAvatars} 
                      disabled={isGenerating}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isGenerating ? "Generating..." : "Generate Avatars"}
                    </Button>
                  </div>
                  
                  {generatedAvatars.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Generated Avatars</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {generatedAvatars.map((avatar, index) => (
                          <div 
                            key={index}
                            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                              selectedGeneratedAvatar === avatar ? 'ring-2 ring-[#F5B8DB] ring-offset-2' : 'hover:opacity-80'
                            }`}
                            onClick={() => handleGeneratedAvatarSelect(avatar)}
                          >
                            <img 
                              src={avatar} 
                              alt={`Generated avatar ${index + 1}`} 
                              className="w-full aspect-square object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={saveAvatar}
                  disabled={!uploadPreview && !selectedStandardAvatar && !selectedGeneratedAvatar}
                >
                  Save Avatar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {currentAvatar && (
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 bg-white"
              onClick={async () => {
                try {
                  await apiRequest("DELETE", `/api/users/${userId}/avatar`);
                  onAvatarChange("");
                  
                  toast({
                    title: "Avatar removed",
                    description: "Your profile picture has been removed"
                  });
                } catch (error) {
                  toast({
                    title: "Failed to remove avatar",
                    description: error instanceof Error ? error.message : "Unknown error",
                    variant: "destructive"
                  });
                }
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}