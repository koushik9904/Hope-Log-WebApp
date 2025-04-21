import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Puzzle, PuzzleIcon, LinkIcon, Smartphone, Watch, Clock, Cloud, BarChart2, Heart, ArrowRight, Send, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { SiApple, SiGoogle, SiSamsung, SiFitbit, SiStripe, SiZapier, SiSlack, SiNotion } from "react-icons/si";

export default function IntegrationsPage() {
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
        description: "Thanks for your interest. We'll notify you when integrations are available.",
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
    
    // In a real application, you would send this to your backend
    console.log(`Integration early access request: ${email}`);
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
              <PuzzleIcon className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Integrations</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect Hope Log with your favorite apps and services for a seamless mental wellness experience.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-8 shadow-md mb-10">
            <div className="flex items-center justify-center mb-6 py-3 px-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
              <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm font-medium">Coming Soon! Our integrations are currently in development.</p>
            </div>
            
            <h2 className="text-2xl font-bold mb-6">Future Integrations</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-5 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <SiApple className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
                <h3 className="font-semibold">Apple Health</h3>
                <p className="text-sm text-gray-500 mt-1">Sync health data</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-5 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <SiGoogle className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
                <h3 className="font-semibold">Google Fit</h3>
                <p className="text-sm text-gray-500 mt-1">Activity tracking</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-5 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <SiFitbit className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
                <h3 className="font-semibold">Fitbit</h3>
                <p className="text-sm text-gray-500 mt-1">Sleep & activity data</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-5 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <SiZapier className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
                <h3 className="font-semibold">Zapier</h3>
                <p className="text-sm text-gray-500 mt-1">Workflow automation</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-5 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <SiSlack className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
                <h3 className="font-semibold">Slack</h3>
                <p className="text-sm text-gray-500 mt-1">Team wellness</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-5 text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-gray-100 rounded-full mb-3">
                    <SiNotion className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
                <h3 className="font-semibold">Notion</h3>
                <p className="text-sm text-gray-500 mt-1">Journal export</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6">What You'll Be Able to Do</h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start">
                <div className="p-2 bg-[#F5B8DB]/10 rounded-lg mr-4 mt-1 flex-shrink-0">
                  <Heart className="h-5 w-5 text-[#F5B8DB]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Health Data Correlation</h3>
                  <p className="text-gray-600">Connect your fitness devices to see how your physical health impacts your emotional wellbeing.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-[#9AAB63]/10 rounded-lg mr-4 mt-1 flex-shrink-0">
                  <BarChart2 className="h-5 w-5 text-[#9AAB63]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Enhanced Analytics</h3>
                  <p className="text-gray-600">Get deeper insights by combining your journal data with information from other applications.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-[#B6CAEB]/10 rounded-lg mr-4 mt-1 flex-shrink-0">
                  <Cloud className="h-5 w-5 text-[#B6CAEB]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Seamless Data Sync</h3>
                  <p className="text-gray-600">Automatically sync your journal entries and insights with your favorite productivity tools.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-[#F5D867]/10 rounded-lg mr-4 mt-1 flex-shrink-0">
                  <Smartphone className="h-5 w-5 text-[#F5D867]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Mobile Experiences</h3>
                  <p className="text-gray-600">Enhance your mobile experience with deep integrations for iOS and Android.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#9AAB63]/10 rounded-xl p-8 border border-[#9AAB63]/20 mb-10">
            <h2 className="text-2xl font-bold mb-6 text-center">Request Integration Priority</h2>
            <p className="text-center text-gray-600 mb-8 max-w-lg mx-auto">
              Let us know which integrations you're most interested in, and we'll prioritize them in our development roadmap.
            </p>
            
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-r-none focus-visible:ring-[#9AAB63]"
                  required
                />
                <Button 
                  type="submit" 
                  className="rounded-l-none bg-[#9AAB63] hover:bg-[#9AAB63]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 
                    "Submitting..." : 
                    <><Send className="h-4 w-4 mr-2" /> Submit Request</>
                  }
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Your information will be sent to jazeel@hopelog.com for integration priority consideration.
              </p>
            </form>
          </div>
          
          <div className="text-center">
            <Link href="/">
              <Button variant="outline" className="mr-4">
                Return to Home
              </Button>
            </Link>
            <Link href="/api-access">
              <Button className="bg-[#F5B8DB] hover:bg-[#F5B8DB]/90">
                Explore API Access <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}