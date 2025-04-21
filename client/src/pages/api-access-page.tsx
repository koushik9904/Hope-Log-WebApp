import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Code, Database, Lock, Webhook, Server, ExternalLink, Send, Terminal } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function ApiAccessPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate sending the email
    setTimeout(() => {
      toast({
        title: "Request received!",
        description: "Thanks for your interest. We'll notify you when the API is available.",
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
    
    // In a real application, you would send this to your backend
    console.log(`Developer early access request: ${email}`);
  };
  
  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <HopeLogLogo size="md" withText />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <a href="https://jazeeljabbar.substack.com/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Blog</a>
              <Link href="/about-us" className="text-gray-600 hover:text-gray-900">About Us</Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/" className="pi-button">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth" className="px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors">
                    Login
                  </Link>
                  <Link href="/auth?tab=register" className="pi-button">
                    Sign Up Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full text-blue-600 mb-4">
              <Terminal className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Hope Log API</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Harness the power of Hope Log's AI and mental wellness technology in your own applications.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-md mb-10">
            <div className="flex items-center justify-center mb-6 py-3 px-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
              <Server className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm font-medium">Coming Soon! Our API is currently in development.</p>
            </div>
            
            <h2 className="text-2xl font-bold mb-6">What You'll Be Able to Do</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-[#F5B8DB]/10 rounded-lg mr-3">
                    <Webhook className="h-5 w-5 text-[#F5B8DB]" />
                  </div>
                  <h3 className="font-semibold text-lg">Conversational AI</h3>
                </div>
                <p className="text-gray-600">
                  Integrate our journaling AI into your wellness or productivity applications with simple API calls.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-[#9AAB63]/10 rounded-lg mr-3">
                    <Database className="h-5 w-5 text-[#9AAB63]" />
                  </div>
                  <h3 className="font-semibold text-lg">Emotion Analysis</h3>
                </div>
                <p className="text-gray-600">
                  Analyze text for emotional content and sentiment to provide personalized user experiences.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-[#B6CAEB]/10 rounded-lg mr-3">
                    <Code className="h-5 w-5 text-[#B6CAEB]" />
                  </div>
                  <h3 className="font-semibold text-lg">Custom Prompts</h3>
                </div>
                <p className="text-gray-600">
                  Generate personalized journaling and reflection prompts tailored to specific contexts or user needs.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-[#F5D867]/10 rounded-lg mr-3">
                    <Lock className="h-5 w-5 text-[#F5D867]" />
                  </div>
                  <h3 className="font-semibold text-lg">Secure Data Access</h3>
                </div>
                <p className="text-gray-600">
                  Enable users to securely access and synchronize their Hope Log data with your applications.
                </p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6">API Development Roadmap</h2>
            
            <div className="space-y-5 mb-8">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-4 flex-shrink-0">
                  <span className="text-green-600 font-medium">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Private Beta</h3>
                  <p className="text-gray-600">Early access for select developers to test core functionality and provide feedback.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-4 flex-shrink-0">
                  <span className="text-blue-600 font-medium">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Public Beta</h3>
                  <p className="text-gray-600">Expanded access with broader API endpoints and improved documentation.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mt-0.5 mr-4 flex-shrink-0">
                  <span className="text-purple-600 font-medium">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">General Availability</h3>
                  <p className="text-gray-600">Full public release with comprehensive documentation, SDKs, and usage tiers.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#F5B8DB]/10 rounded-xl p-8 border border-[#F5B8DB]/20 mb-10">
            <h2 className="text-2xl font-bold mb-6 text-center">Get Early Access</h2>
            <p className="text-center text-gray-600 mb-8 max-w-lg mx-auto">
              Join our developer waitlist to be among the first to access the Hope Log API when it's ready.
            </p>
            
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-r-none focus-visible:ring-[#F5B8DB]"
                  required
                />
                <Button 
                  type="submit" 
                  className="rounded-l-none bg-[#F5B8DB] hover:bg-[#F5B8DB]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 
                    "Submitting..." : 
                    <><Send className="h-4 w-4 mr-2" /> Request Access</>
                  }
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Your information will be sent to jazeel@hopelog.com for early access notification.
              </p>
            </form>
          </div>
          
          <div className="text-center">
            <Link href="/">
              <Button variant="outline" className="mr-4">
                Return to Home
              </Button>
            </Link>
            <a 
              href="https://jazeeljabbar.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-[#9AAB63] hover:bg-[#9AAB63]/90">
                Follow Our Blog <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}