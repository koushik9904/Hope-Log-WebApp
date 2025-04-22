import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  MessageCircle, 
  Heart, 
  Sparkles, 
  BarChart, 
  Shield, 
  BookOpen, 
  Check, 
  ArrowRight,
  Star,
  Brain,
  CalendarClock,
  FileText,
  Download,
  Share2,
  BrainCircuit,
  Quote,
  ArrowUpRight,
  Play,
  CheckCircle2
} from "lucide-react";
import { SiApple, SiAndroid } from "react-icons/si";
import { FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";

export default function LandingPage() {
  const { user } = useAuth();

  // Example testimonials
  const testimonials = [
    {
      name: "Sarah J.",
      role: "Designer",
      content: "Hope Log has completely transformed my mental wellness routine. The AI responses feel so personal and helpful.",
      rating: 5
    },
    {
      name: "Michael T.",
      role: "Teacher",
      content: "I've tried many journaling apps, but the AI insights in Hope Log have helped me understand my emotions better than ever.",
      rating: 5
    },
    {
      name: "Lena K.",
      role: "Software Engineer",
      content: "The mood tracking features combined with the AI analysis give me such valuable insights into my emotional patterns.",
      rating: 4
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <HopeLogLogo size="lg" withText />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
              <a href="https://jazeeljabbar.substack.com/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Blog</a>
              <Link href="/about-us" className="text-gray-600 hover:text-gray-900">About Us</Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <Link href="/" className="pi-button text-sm sm:text-base whitespace-nowrap">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth" className="px-3 py-2 sm:px-4 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base whitespace-nowrap">
                    Login
                  </Link>
                  <Link href="/auth?tab=register" className="pi-button text-sm sm:text-base whitespace-nowrap">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Rosebud-inspired with pastel graphics */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#F5B8DB]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -left-20 w-96 h-96 bg-[#B6CAEB]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-[#F5D867]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-12 lg:mb-0 pr-0 lg:pr-12">
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
                AI-powered mental wellness journaling
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
                Your Companion for <span className="text-[#9AAB63]">Mental Wellness</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                Journal with an AI that understands, track your mood patterns, and gain insights to improve your mental wellbeing.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full max-w-full overflow-hidden">
                <Link href="/auth?tab=register" className="pi-button text-center text-sm sm:text-base whitespace-nowrap">
                  Start Free Trial
                </Link>
                <a 
                  href="#demo-video" 
                  className="flex items-center justify-center gap-2 text-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-medium rounded-lg py-2 px-3 sm:py-2.5 sm:px-5 text-sm sm:text-base whitespace-nowrap"
                >
                  <Play className="h-4 w-4 text-gray-600 flex-shrink-0" /> <span>See how it works</span>
                </a>
              </div>
              
              <div className="grid grid-cols-3 gap-4 max-w-md">
                <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-2xl font-bold text-[#9AAB63]">98%</span>
                  <span className="text-xs text-gray-500 text-center">User satisfaction rate</span>
                </div>
                <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-2xl font-bold text-[#F5B8DB]">25k+</span>
                  <span className="text-xs text-gray-500 text-center">Active users</span>
                </div>
                <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current text-yellow-500" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 text-center">4.9/5 rating</span>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              {/* Chat windows in a layered stack */}
              <div className="relative w-full max-w-md mx-auto">
                {/* Window 1 - Background */}
                <div className="absolute top-12 -left-6 right-6 h-72 bg-white shadow-lg rounded-2xl border border-gray-200 transform -rotate-6 z-0"></div>
                
                {/* Window 2 - Middle */}
                <div className="absolute top-6 -left-3 right-3 h-72 bg-white shadow-lg rounded-2xl border border-gray-200 transform -rotate-3 z-10"></div>
                
                {/* Window 3 - Front */}
                <div className="relative bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200 z-20">
                  <div className="bg-black p-4 text-white flex items-center">
                    <HopeLogLogo size="sm" withText className="w-auto mr-2" />
                  </div>
                  
                  <div className="p-5">
                    <div className="flex flex-col space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg self-start max-w-[80%] border border-blue-100">
                        <p className="text-sm">How are you feeling today?</p>
                      </div>
                      
                      <div className="bg-gray-100 p-3 rounded-lg self-end max-w-[80%] border border-gray-200">
                        <p className="text-sm">I've been feeling anxious about my upcoming presentation at work...</p>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg self-start max-w-[80%] border border-blue-100">
                        <p className="text-sm">It's normal to feel anxious about presentations. Let's explore some strategies that might help reduce your anxiety:</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 border border-gray-200">
                          Breathing exercises
                        </button>
                        <button className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 border border-gray-200">
                          Preparation tips
                        </button>
                        <button className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 border border-gray-200">
                          Tell me more
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements around the chat window */}
              <div className="absolute top-1/3 -right-6 bg-white p-3 rounded-lg shadow-lg flex items-center transform rotate-6 border border-gray-100">
                <Heart className="h-6 w-6 text-rose-500 mr-2" />
                <div className="text-sm">
                  <div className="font-semibold">Mood Tracker</div>
                  <div className="text-xs text-gray-500">Track your emotions</div>
                </div>
              </div>
              
              <div className="absolute bottom-1/4 -left-6 bg-white p-3 rounded-lg shadow-lg flex items-center transform -rotate-6 border border-gray-100">
                <BarChart className="h-6 w-6 text-amber-500 mr-2" />
                <div className="text-sm">
                  <div className="font-semibold">Insights</div>
                  <div className="text-xs text-gray-500">Personalized analysis</div>
                </div>
              </div>
              
              <div className="absolute -bottom-2 right-1/4 bg-white p-3 rounded-lg shadow-lg flex items-center transform rotate-3 border border-gray-100">
                <Brain className="h-6 w-6 text-indigo-500 mr-2" />
                <div className="text-sm">
                  <div className="font-semibold">AI-Powered</div>
                  <div className="text-xs text-gray-500">Smart conversations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Trusted by professionals from</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
              <div className="text-gray-400 font-semibold text-sm">IIIT Hyderabad</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
              <div className="text-gray-400 font-semibold text-sm">NIMHANS</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
              <div className="text-gray-400 font-semibold text-sm">IIT Hyderabad</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
              <div className="text-gray-400 font-semibold text-sm">Hyderabad University</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
              <div className="text-gray-400 font-semibold text-sm">Tata Memorial Hospital</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Rosebud-inspired with illustrations */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-[#F5D867]/20 rounded-full text-[#9AAB63] mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Features That Transform Your Mental Wellness</h2>
            <p className="text-xl text-gray-600">
              Hope Log combines AI technology with proven mental wellness techniques to help you understand and improve your emotional wellbeing.
            </p>
          </div>
          
          {/* Feature 1 - AI Journaling */}
          <div className="flex flex-col md:flex-row items-center mb-24 gap-12">
            <div className="md:w-1/2 relative">
              <div className="absolute inset-0 bg-[#B6CAEB]/20 rounded-3xl transform rotate-3 translate-x-1 translate-y-1"></div>
              <div className="relative bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex flex-col space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg max-w-[80%] border border-blue-100">
                    <p className="text-sm">I've been feeling overwhelmed lately with all my responsibilities.</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg max-w-[80%] shadow-sm border border-gray-200">
                    <p className="text-sm">It sounds like you're experiencing a lot of pressure. Let's break down what's on your plate and find some ways to manage this feeling.</p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg max-w-[80%] border border-blue-100">
                    <p className="text-sm">I think I need to prioritize better, but I'm not sure where to start.</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg max-w-[80%] shadow-sm border border-gray-200">
                    <p className="text-sm">That's a great insight. Let me help you create a simple prioritization framework that works for your specific situation...</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#B6CAEB]/20 text-[#B6CAEB] text-sm font-medium mb-2">
                CORE FEATURE
              </div>
              <h3 className="text-2xl font-bold mb-4">AI-Powered Compassionate Journaling</h3>
              <p className="text-gray-600 mb-6">
                Our AI understands your writing on a deeper level, responding with empathy and insights. It's like chatting with a supportive friend who remembers all your past conversations.
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Personalized responses that adapt to your communication style</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Memory of your past entries to provide better context</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Guided prompts when you're not sure what to write about</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Voice-to-text for easier journaling on the go</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Feature 2 - Mood Tracking */}
          <div className="flex flex-col md:flex-row-reverse items-center mb-24 gap-12">
            <div className="md:w-1/2 relative">
              <div className="absolute inset-0 bg-[#F5B8DB]/20 rounded-3xl transform -rotate-3 translate-x-1 translate-y-1"></div>
              <div className="relative bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F5B8DB]/20 flex items-center justify-center mr-3">
                    <Heart className="h-5 w-5 text-[#F5B8DB]" />
                  </div>
                  <div>
                    <h3 className="font-bold">Mood Tracker</h3>
                    <p className="text-xs text-gray-500">Track your emotional patterns</p>
                  </div>
                </div>
                
                <div className="h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-full h-full p-4 flex justify-between items-end">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div 
                          className={`w-4 ${[4, 3, 5, 2, 4, 5, 4][i % 7] * 8}px rounded-t-full bg-[#F5B8DB]`}
                        ></div>
                        <div className="text-xs mt-1 text-gray-500">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl">😔</div>
                    <div className="text-xs text-gray-500 mt-1">Sad</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl">😟</div>
                    <div className="text-xs text-gray-500 mt-1">Worried</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl">😐</div>
                    <div className="text-xs text-gray-500 mt-1">Neutral</div>
                  </div>
                  <div className="flex flex-col items-center opacity-50">
                    <div className="text-3xl">🙂</div>
                    <div className="text-xs text-gray-500 mt-1">Good</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl">😄</div>
                    <div className="text-xs text-gray-500 mt-1">Great</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#F5B8DB]/20 text-[#F5B8DB] text-sm font-medium mb-2">
                VISUAL TRACKING
              </div>
              <h3 className="text-2xl font-bold mb-4">Track Your Emotional Journey</h3>
              <p className="text-gray-600 mb-6">
                Log your daily moods and see patterns emerge over time. Our beautiful visualizations help you identify trends in your emotional wellbeing and factors that influence how you feel.
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Simple emoji-based mood tracking takes seconds</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Weekly and monthly visualization of mood patterns</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Correlation with activities, sleep, and other factors</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Export data to share with your therapist or coach</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Feature 3 - Insights */}
          <div className="flex flex-col md:flex-row items-center mb-20 gap-12">
            <div className="md:w-1/2 relative">
              <div className="absolute inset-0 bg-[#F5D867]/20 rounded-3xl transform rotate-2 translate-x-1 translate-y-1"></div>
              <div className="relative bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F5D867]/20 flex items-center justify-center mr-3">
                    <BrainCircuit className="h-5 w-5 text-[#9AAB63]" />
                  </div>
                  <div>
                    <h3 className="font-bold">Weekly Insights</h3>
                    <p className="text-xs text-gray-500">AI-generated analysis</p>
                  </div>
                </div>
                
                <div className="bg-[#F5D867]/10 p-4 rounded-lg border border-[#F5D867]/20 mb-4">
                  <h4 className="font-medium text-[#9AAB63] mb-2">This Week's Emotional Patterns</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    You experienced more positive emotions when spending time outdoors and with friends. Work-related stress appears to peak on Wednesdays.
                  </p>
                  
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Primary Emotions</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-white rounded-full text-xs border border-gray-200">
                        Joy
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-full text-xs border border-gray-200">
                        Anxiety
                      </span>
                      <span className="px-2 py-0.5 bg-white rounded-full text-xs border border-gray-200">
                        Contentment
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Suggested Focus</div>
                    <p className="text-sm text-gray-700">
                      Consider more outdoor activities and social interactions to boost your mood.
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="text-sm bg-white flex items-center px-3 py-1.5 rounded-lg text-gray-700 border border-gray-200">
                    <Download className="h-4 w-4 mr-1.5" /> Download Report
                  </button>
                  <button className="text-sm bg-white flex items-center px-3 py-1.5 rounded-lg text-gray-700 border border-gray-200">
                    <Share2 className="h-4 w-4 mr-1.5" /> Share with Therapist
                  </button>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#F5D867]/20 text-[#9AAB63] text-sm font-medium mb-2">
                AI ANALYSIS
              </div>
              <h3 className="text-2xl font-bold mb-4">Personalized Mental Wellness Insights</h3>
              <p className="text-gray-600 mb-6">
                Our AI analyzes your journal entries and mood patterns to generate personalized insights and recommendations tailored to your unique emotional journey.
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Weekly analysis of emotional patterns and triggers</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Identification of positive and negative influences</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Actionable recommendations for improving wellbeing</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Progress tracking toward your mental wellness goals</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* More Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start">
              <div className="w-12 h-12 bg-[#F5D867]/20 rounded-lg flex items-center justify-center mb-4">
                <CalendarClock className="h-6 w-6 text-[#9AAB63]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Habit Tracking</h3>
              <p className="text-gray-600 mb-4">
                Build positive habits and track your progress with daily streaks and gentle reminders.
              </p>
              <a href="#" className="mt-auto text-[#9AAB63] text-sm font-medium flex items-center">
                Learn more <ArrowUpRight className="h-3 w-3 ml-1" />
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start">
              <div className="w-12 h-12 bg-[#B6CAEB]/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#B6CAEB]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Privacy First</h3>
              <p className="text-gray-600 mb-4">
                Your journal is private and secured with end-to-end encryption. We never share your data.
              </p>
              <a href="#" className="mt-auto text-[#B6CAEB] text-sm font-medium flex items-center">
                Our privacy policy <ArrowUpRight className="h-3 w-3 ml-1" />
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start">
              <div className="w-12 h-12 bg-[#F5B8DB]/20 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-[#F5B8DB]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Guided Prompts</h3>
              <p className="text-gray-600 mb-4">
                Never face writer's block with our 300+ journaling prompts designed by mental health experts.
              </p>
              <a href="#" className="mt-auto text-[#F5B8DB] text-sm font-medium flex items-center">
                View examples <ArrowUpRight className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Video Section */}
      <section id="demo-video" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-[#B6CAEB]/20 rounded-full text-[#B6CAEB] mb-4">
              <Play className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold mb-4">See Hope Log in Action</h2>
            <p className="text-xl text-gray-600">
              Watch how easy it is to get started and improve your mental wellness journey.
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-2xl flex items-center justify-center shadow-xl">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#B6CAEB]/20 flex items-center justify-center border-4 border-white shadow-lg">
                  <Play className="h-8 w-8 text-[#B6CAEB]" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-30">
                  <div className="w-20 h-20 rounded-full bg-[#B6CAEB]/20"></div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg border border-gray-100 max-w-xs">
              <p className="text-sm text-gray-600">
                "Hope Log has helped me develop a consistent journaling practice that's improved my mental wellbeing."
              </p>
              <div className="flex items-center mt-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">Jessica R.</p>
                  <p className="text-xs text-gray-500">Using Hope Log for 6 months</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-[#CB3B8C] rounded-2xl p-12 text-white relative">
            <div className="absolute top-8 left-8 opacity-20">
              <Quote className="h-20 w-20" />
            </div>
            <div className="relative">
              <p className="text-2xl md:text-3xl font-medium mb-6 leading-relaxed">
                "Hope Log is not just another journaling app. It's like having a compassionate therapist in your pocket, available 24/7 to help you process your thoughts and emotions."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 mr-4"></div>
                <div>
                  <p className="font-bold">Dr. Emma Wilson</p>
                  <p className="text-blue-100">Clinical Psychologist, Stanford University</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section with Gradient Cards */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-[#F5D867]/20 rounded-full text-[#9AAB63] mb-4">
              <Check className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">
              Choose the plan that best suits your mental wellness journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Free</h3>
                <div className="text-3xl font-bold">$0<span className="text-gray-500 text-lg font-normal">/month</span></div>
                <p className="text-gray-500 mt-2">Perfect for getting started</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>5 AI journal responses per day</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Basic mood tracking</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Limited journal prompts</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>7-day data retention</span>
                </li>
              </ul>
              
              <Link href="/auth?tab=register" className="block text-center py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                Start Free
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-[#F5B8DB]/30 relative lg:scale-105 lg:-translate-y-2">
              <div className="absolute top-0 right-0 bg-[#F5B8DB] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                POPULAR
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Premium</h3>
                <div className="text-3xl font-bold">$9.99<span className="text-gray-500 text-lg font-normal">/month</span></div>
                <p className="text-gray-500 mt-2">The complete experience</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited AI journal responses</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Advanced mood & emotion tracking</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Weekly AI mental wellness insights</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited journal prompts</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Unlimited data retention</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              
              <Link href="/auth?tab=register&plan=premium" className="block text-center pi-button">
                Start Premium
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Therapist</h3>
                <div className="text-3xl font-bold">$29.99<span className="text-gray-500 text-lg font-normal">/month</span></div>
                <p className="text-gray-500 mt-2">For mental health professionals</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>All Premium features</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Client management dashboard</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Progress reports for clients</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Secure therapist-client messaging</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>HIPAA compliant</span>
                </li>
              </ul>
              
              <button className="block text-center w-full py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials with cards */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-[#F5B8DB]/20 rounded-full text-[#F5B8DB] mb-4">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">
              Real stories from people who've transformed their mental wellness with Hope Log.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#F5B8DB] rounded-full flex items-center justify-center shadow-lg">
                  <Quote className="h-5 w-5 text-white" />
                </div>
                
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[#B6CAEB] flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto bg-[#CB3B8C] rounded-2xl p-12 text-white text-center relative overflow-hidden">
            
            <div className="relative z-10">
              <HopeLogLogo size="lg" className="mx-auto mb-6 text-white" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Mental Wellness Journey Today</h2>
              <p className="text-xl md:text-2xl mb-8 text-white/80">
                Join thousands of people who have transformed their mental wellbeing with Hope Log.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth?tab=register" className="bg-white text-[#9AAB63] hover:bg-gray-50 py-3 px-8 rounded-lg font-medium text-lg">
                  Get Started — It's Free
                </Link>
                <a href="#features" className="bg-[#B6CAEB]/30 hover:bg-[#B6CAEB]/40 text-white py-3 px-8 rounded-lg font-medium text-lg border border-white/20">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <HopeLogLogo size="md" className="mb-4" />
              <p className="text-gray-400 mb-6">
                Your AI-powered mental wellness journal and companion.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <FaTwitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <FaInstagram size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <FaFacebook size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><Link href="/api-access" className="text-gray-400 hover:text-white">API Access</Link></li>
                <li><Link href="/integrations" className="text-gray-400 hover:text-white">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Resources</h3>
              <ul className="space-y-3">
                <li><a href="https://jazeeljabbar.substack.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><Link href="/help-center" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link href="/community" className="text-gray-400 hover:text-white">Community</Link></li>
                <li><Link href="/mental-health-resources" className="text-gray-400 hover:text-white">Mental Health Resources</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-white">Company</h3>
              <ul className="space-y-3">
                <li><Link href="/about-us" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} Hope Log. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}