import { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Paperclip, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type SupportFormData = {
  name: string;
  username: string;
  email: string;
  subject: string;
  message: string;
  attachment?: File | null;
};

export default function SupportPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<SupportFormData>({
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "",
    username: user?.username || "",
    email: user?.email || "",
    subject: "",
    message: "",
    attachment: null,
  });
  
  const [fileName, setFileName] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, attachment: file }));
    setFileName(file?.name || null);
  };
  
  const submitSupportRequestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/support", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to submit support request");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Support request submitted",
        description: "We'll get back to you as soon as possible.",
        variant: "default",
      });
      setFormData({
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "",
        username: user?.username || "",
        email: user?.email || "",
        subject: "",
        message: "",
        attachment: null,
      });
      setFileName(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("username", formData.username);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("subject", formData.subject);
    formDataToSend.append("message", formData.message);
    
    if (formData.attachment) {
      formDataToSend.append("attachment", formData.attachment);
    }
    
    submitSupportRequestMutation.mutate(formDataToSend);
  };
  
  return (
    <PageLayout
      heading="Support & Feedback"
      subheading="Have a question or feedback? We're here to help."
    >
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Your username"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What's this about?"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="How can we help you?"
                  rows={6}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="attachment">Attachment (optional)</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("attachment")?.click()}
                    className="cursor-pointer flex items-center"
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    {fileName ? "Change file" : "Add screenshot"}
                  </Button>
                  {fileName && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {fileName}
                    </span>
                  )}
                  <input
                    id="attachment"
                    name="attachment"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="flex items-center"
                disabled={submitSupportRequestMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                {submitSupportRequestMutation.isPending ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}