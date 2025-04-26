import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Camera, Pencil, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// These are style types for DiceBear avatars
const AVATAR_STYLES = [
  { id: "adventurer", name: "Adventurer" },
  { id: "adventurer-neutral", name: "Adventurer Neutral" },
  { id: "avataaars", name: "Avataaars" },
  { id: "big-ears", name: "Big Ears" },
  { id: "big-ears-neutral", name: "Big Ears Neutral" },
  { id: "bottts", name: "Bottts" },
  { id: "croodles", name: "Croodles" },
  { id: "fun-emoji", name: "Fun Emoji" },
  { id: "icons", name: "Icons" },
  { id: "identicon", name: "Identicon" },
  { id: "initials", name: "Initials" },
  { id: "lorelei", name: "Lorelei" },
  { id: "lorelei-neutral", name: "Lorelei Neutral" },
  { id: "micah", name: "Micah" },
  { id: "notionists", name: "Notionists" },
  { id: "pixel-art", name: "Pixel Art" },
  { id: "shapes", name: "Shapes" }
];

export interface AvatarSelectorProps {
  userId: number;
  currentAvatar?: string | null | undefined;
  onAvatarChange: (avatarUrl: string) => void;
}

export function AvatarSelector({ userId, currentAvatar, onAvatarChange }: AvatarSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStyle, setSelectedStyle] = useState("lorelei");
  const [selectedSeed, setSelectedSeed] = useState<string>(""); 
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Create a random seed if none exists
  React.useEffect(() => {
    if (!selectedSeed) {
      setSelectedSeed(Math.random().toString(36).substring(2, 10));
    }
  }, [selectedSeed]);

  // Generate DiceBear avatar URL
  const getDiceBearUrl = (style: string, seed: string) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
  };

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      onAvatarChange(data.avatarUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Avatar updated",
        description: "Your avatar has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Standard avatar selection mutation
  const standardAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/avatar/standard`, { avatarUrl });
      return await res.json();
    },
    onSuccess: (data) => {
      onAvatarChange(data.avatarUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Avatar updated",
        description: "Your avatar has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // AI avatar generation mutation
  const generateAvatarMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiRequest("POST", `/api/avatar/generate`, { prompt });
      return await res.json();
    },
    onSuccess: (data) => {
      setGeneratedAvatars(data.avatars || []);
      if (data.avatars && data.avatars.length > 0) {
        setShowAiDialog(true);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save AI avatar mutation
  const saveAiAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/avatar/generated`, { avatarUrl });
      return await res.json();
    },
    onSuccess: (data) => {
      onAvatarChange(data.avatarUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setShowAiDialog(false);
      toast({
        title: "Avatar updated",
        description: "Your AI-generated avatar has been set successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle file change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 2MB",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate(file);
    }
  };

  // Handle standard avatar selection
  const handleSelectStandardAvatar = () => {
    const avatarUrl = getDiceBearUrl(selectedStyle, selectedSeed);
    standardAvatarMutation.mutate(avatarUrl);
  };

  // Generate a new random seed
  const generateNewSeed = () => {
    setLoadingPreview(true);
    setSelectedSeed(Math.random().toString(36).substring(2, 10));
    setTimeout(() => setLoadingPreview(false), 500);
  };

  // Generate AI avatar
  const handleGenerateAiAvatar = () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your avatar",
        variant: "destructive",
      });
      return;
    }
    generateAvatarMutation.mutate(aiPrompt);
  };

  // Save the selected AI avatar
  const handleSaveAiAvatar = (avatarUrl: string) => {
    saveAiAvatarMutation.mutate(avatarUrl);
  };

  // Current avatar display
  const currentAvatarDisplay = (
    <Avatar className="h-24 w-24 border-2 border-primary">
      <AvatarImage src={currentAvatar || undefined} alt="Current avatar" />
      <AvatarFallback>
        {typeof currentAvatar === 'string' && currentAvatar.includes('initials') 
          ? userId.toString().substring(0, 2).toUpperCase()
          : 'U'}
      </AvatarFallback>
    </Avatar>
  );
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        {currentAvatarDisplay}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute bottom-0 right-0 rounded-full bg-background h-8 w-8 shadow-md"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <Tabs defaultValue="standard">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="standard">Standard</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="ai">AI Generated</TabsTrigger>
              </TabsList>
              
              <TabsContent value="standard" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="style">Avatar Style</Label>
                  <select 
                    id="style"
                    className="w-full p-2 border rounded-md"
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                  >
                    {AVATAR_STYLES.map(style => (
                      <option key={style.id} value={style.id}>
                        {style.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-center">
                  {loadingPreview ? (
                    <div className="h-24 w-24 flex items-center justify-center border rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <Avatar className="h-24 w-24 border rounded-md">
                      <AvatarImage 
                        src={getDiceBearUrl(selectedStyle, selectedSeed)}
                        alt="Avatar preview" 
                      />
                      <AvatarFallback>Preview</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                
                <div className="flex justify-between gap-2">
                  <Button 
                    variant="outline" 
                    onClick={generateNewSeed}
                    disabled={standardAvatarMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Randomize
                  </Button>
                  <Button 
                    onClick={handleSelectStandardAvatar}
                    disabled={standardAvatarMutation.isPending}
                  >
                    {standardAvatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Select
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4 pt-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                  />
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG or GIF (max 2MB)</p>
                </div>
                
                {uploadMutation.isPending && (
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="ai" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Describe your avatar</Label>
                  <Textarea 
                    id="prompt"
                    placeholder="A professional portrait of me with..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="resize-none"
                    rows={4}
                  />
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleGenerateAiAvatar}
                  disabled={generateAvatarMutation.isPending || !aiPrompt}
                >
                  {generateAvatarMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Generate Avatar
                </Button>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* AI Avatar Results Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose your AI-generated avatar</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            {generatedAvatars.map((avatar, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <Avatar className="h-40 w-40 border rounded-md">
                  <AvatarImage src={avatar} alt={`AI avatar ${index + 1}`} />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <Button
                  onClick={() => handleSaveAiAvatar(avatar)}
                  disabled={saveAiAvatarMutation.isPending}
                >
                  {saveAiAvatarMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Select this avatar
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}