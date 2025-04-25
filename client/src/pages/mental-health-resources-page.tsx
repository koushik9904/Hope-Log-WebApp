import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  Heart, 
  BookOpen, 
  Headphones, 
  Phone,
  Globe,
  CheckCircle,
  FileText,
  Map,
  BookMarked,
  Brain,
  Moon,
  Sparkles,
  Clock,
  ExternalLink
} from "lucide-react";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { PageFooter } from "@/components/layout/page-footer";

// Import asset images
import nimhansLogo from "@assets/nimhans logo.jpeg";
import iiitHyderabadLogo from "@assets/IIIT_Hyderabad_Logo.jpg";
import universityOfHyderabadLogo from "@assets/University_of_Hyderabad_Logo.png";
import iitHyderabadLogo from "@assets/IIT Hyderabad Logo_Final Design.jpg";
import tataMemorialLogo from "@assets/tata_memorial_logo.png";

interface Resource {
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  icon: React.ReactNode;
}

export default function MentalHealthResourcesPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const emergencyResources = [
    {
      name: "National Suicide Prevention Lifeline",
      phone: "1-800-273-8255",
      description: "24/7, free and confidential support for people in distress, prevention and crisis resources."
    },
    {
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      description: "Free 24/7 support for those in crisis. Text with a trained crisis counselor."
    },
    {
      name: "SAMHSA's National Helpline",
      phone: "1-800-662-4357",
      description: "Treatment referral and information service for individuals facing mental health or substance use disorders."
    }
  ];
  
  const articles: Resource[] = [
    {
      title: "The Science of Journaling for Mental Health",
      description: "Learn about the research behind journaling and how it can benefit your mental wellbeing.",
      url: "#",
      category: "Journaling",
      tags: ["Research", "Benefits", "Techniques"],
      icon: <BookOpen className="h-8 w-8 text-[#F5B8DB]" />
    },
    {
      title: "Understanding Anxiety: Signs, Symptoms, and Coping Strategies",
      description: "A comprehensive guide to recognizing anxiety and effective ways to manage it.",
      url: "#",
      category: "Mental Health",
      tags: ["Anxiety", "Coping", "Self-care"],
      icon: <Brain className="h-8 w-8 text-[#9AAB63]" />
    },
    {
      title: "Mindfulness Meditation: A Beginner's Guide",
      description: "Simple techniques to incorporate mindfulness into your daily routine.",
      url: "#",
      category: "Mindfulness",
      tags: ["Meditation", "Beginners", "Daily Practice"],
      icon: <Sparkles className="h-8 w-8 text-[#B6CAEB]" />
    },
    {
      title: "Sleep and Mental Health: The Crucial Connection",
      description: "Exploring the relationship between sleep quality and emotional wellbeing.",
      url: "#",
      category: "Sleep",
      tags: ["Rest", "Habits", "Wellbeing"],
      icon: <Moon className="h-8 w-8 text-[#F5D867]" />
    }
  ];
  
  const books: Resource[] = [
    {
      title: "The Anxiety and Phobia Workbook",
      description: "By Edmund J. Bourne, PhD - Practical techniques for managing anxiety and phobias.",
      url: "#",
      category: "Books",
      tags: ["Anxiety", "Self-help", "Workbook"],
      icon: <BookMarked className="h-8 w-8 text-[#F5B8DB]" />
    },
    {
      title: "Feeling Good: The New Mood Therapy",
      description: "By David D. Burns, MD - CBT techniques for depression and improving mood.",
      url: "#",
      category: "Books",
      tags: ["Depression", "CBT", "Therapy"],
      icon: <BookMarked className="h-8 w-8 text-[#9AAB63]" />
    },
    {
      title: "Why We Sleep",
      description: "By Matthew Walker - The importance of sleep for mental and physical health.",
      url: "#",
      category: "Books",
      tags: ["Sleep", "Research", "Health"],
      icon: <BookMarked className="h-8 w-8 text-[#B6CAEB]" />
    }
  ];
  
  const apps: Resource[] = [
    {
      title: "Headspace",
      description: "Guided meditation and mindfulness exercises for stress reduction and better sleep.",
      url: "#",
      category: "Meditation",
      tags: ["Mindfulness", "Sleep", "Stress"],
      icon: <Headphones className="h-8 w-8 text-[#F5B8DB]" />
    },
    {
      title: "Calm",
      description: "Sleep stories, meditation, and relaxation techniques for better mental wellbeing.",
      url: "#",
      category: "Meditation",
      tags: ["Sleep", "Relaxation", "Meditation"],
      icon: <Headphones className="h-8 w-8 text-[#9AAB63]" />
    },
    {
      title: "Woebot",
      description: "AI-powered chatbot for cognitive behavioral therapy techniques and mood tracking.",
      url: "#",
      category: "Therapy",
      tags: ["CBT", "AI", "Mood"],
      icon: <Brain className="h-8 w-8 text-[#B6CAEB]" />
    }
  ];
  
  const websites: Resource[] = [
    {
      title: "National Institute of Mental Health",
      description: "Science-based information on mental health disorders and treatments.",
      url: "https://www.nimh.nih.gov/",
      category: "Information",
      tags: ["Research", "Disorders", "Treatment"],
      icon: <Globe className="h-8 w-8 text-[#F5B8DB]" />
    },
    {
      title: "Psychology Today",
      description: "Articles, therapist directory, and mental health resources.",
      url: "https://www.psychologytoday.com/",
      category: "Information",
      tags: ["Articles", "Therapists", "Resources"],
      icon: <Globe className="h-8 w-8 text-[#9AAB63]" />
    },
    {
      title: "Mental Health America",
      description: "Mental health screening tools, education, and advocacy resources.",
      url: "https://mhanational.org/",
      category: "Information",
      tags: ["Screening", "Education", "Advocacy"],
      icon: <Globe className="h-8 w-8 text-[#B6CAEB]" />
    }
  ];
  
  const renderResource = (resource: Resource) => (
    <Card key={resource.title} className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start space-x-4 pb-2">
        <div className="p-2 bg-gray-50 rounded-lg">
          {resource.icon}
        </div>
        <div>
          <CardTitle className="text-lg">{resource.title}</CardTitle>
          <CardDescription className="text-sm text-gray-500">{resource.category}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
        <div className="flex flex-wrap gap-2">
          {resource.tags.map((tag, i) => (
            <Badge key={i} variant="outline" className="bg-gray-50 text-gray-600">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <a 
          href={resource.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm font-medium text-[#F5B8DB] inline-flex items-center"
        >
          Learn more <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <PageHeader currentPage="mental-health-resources" />
      
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full text-blue-600 mb-4">
              <Heart className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Mental Health Resources</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Curated resources to support your mental wellness journey beyond Hope Log.
            </p>
            
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-500 mb-2">
                <strong>Note:</strong> Hope Log is not a substitute for professional mental health care. 
                If you're experiencing a crisis, please seek immediate help from a qualified professional.
              </p>
            </div>
          </div>
          
          {/* Emergency Resources Section */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-12">
            <h2 className="text-2xl font-bold mb-4 text-red-700 flex items-center">
              <Phone className="h-5 w-5 mr-2" /> Emergency Resources
            </h2>
            <p className="text-red-600 mb-6">If you or someone you know is in crisis, please use these resources for immediate support:</p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {emergencyResources.map((resource, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-red-100">
                  <h3 className="font-semibold text-gray-800 mb-1">{resource.name}</h3>
                  <p className="text-red-600 font-bold mb-2">{resource.phone}</p>
                  <p className="text-sm text-gray-600">{resource.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Main Resources Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-10">
            <Tabs defaultValue="articles">
              <TabsList className="mb-6">
                <TabsTrigger value="articles">Articles</TabsTrigger>
                <TabsTrigger value="books">Books</TabsTrigger>
                <TabsTrigger value="apps">Apps</TabsTrigger>
                <TabsTrigger value="websites">Websites</TabsTrigger>
              </TabsList>
              
              <TabsContent value="articles" className="grid md:grid-cols-2 gap-6">
                {articles.map(resource => renderResource(resource))}
              </TabsContent>
              
              <TabsContent value="books" className="grid md:grid-cols-3 gap-6">
                {books.map(resource => renderResource(resource))}
              </TabsContent>
              
              <TabsContent value="apps" className="grid md:grid-cols-3 gap-6">
                {apps.map(resource => renderResource(resource))}
              </TabsContent>
              
              <TabsContent value="websites" className="grid md:grid-cols-3 gap-6">
                {websites.map(resource => renderResource(resource))}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Therapy Directory */}
          <div className="bg-[#9AAB63]/10 rounded-xl p-8 border border-[#9AAB63]/20 mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Map className="h-6 w-6 mr-2 text-[#9AAB63]" /> Find a Therapist
            </h2>
            <p className="text-gray-600 mb-6">
              Looking for a mental health professional? These directories can help you find therapists in your area:
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <a href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center">
                  Psychology Today
                  <ExternalLink className="ml-1 h-3 w-3 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-600">Comprehensive directory of therapists with filters for specialty, insurance, and location.</p>
              </a>
              
              <a href="https://www.goodtherapy.org/find-therapist.html" target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center">
                  GoodTherapy
                  <ExternalLink className="ml-1 h-3 w-3 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-600">Search for ethical, licensed therapists and counselors worldwide.</p>
              </a>
              
              <a href="https://www.talkspace.com/" target="_blank" rel="noopener noreferrer" className="block bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center">
                  Talkspace
                  <ExternalLink className="ml-1 h-3 w-3 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-600">Online therapy platform with licensed therapists available via text, audio, and video.</p>
              </a>
            </div>
          </div>
          
          {/* India-Specific Mental Health Resources */}
          <div className="bg-[#B6CAEB]/10 rounded-xl p-8 border border-[#B6CAEB]/20 mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Map className="h-6 w-6 mr-2 text-[#B6CAEB]" /> India Mental Health Resources
            </h2>
            <p className="text-gray-600 mb-6">
              Mental health resources specifically for people in India, including helplines, institutions, and support services.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center">
                  NIMHANS (National Institute of Mental Health and Neuro Sciences)
                  <ExternalLink className="ml-1 h-3 w-3 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-600 mb-2">India's premier mental health institution offering specialized care and research.</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#B6CAEB] font-medium">Website:</span>
                  <a href="https://nimhans.ac.in/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">nimhans.ac.in</a>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-[#B6CAEB] font-medium">Helpline:</span>
                  <span className="text-sm">080-26995000 / 080-26995500</span>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center">
                  TISS iCall
                  <ExternalLink className="ml-1 h-3 w-3 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-600 mb-2">Psychosocial helpline providing counseling, support, and linking to mental health professionals.</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#B6CAEB] font-medium">Website:</span>
                  <a href="https://icallhelpline.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">icallhelpline.org</a>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-[#B6CAEB] font-medium">Helpline:</span>
                  <span className="text-sm">9152987821 (9 AM to 9 PM, Mon-Sat)</span>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center">
                  AASRA
                  <ExternalLink className="ml-1 h-3 w-3 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-600 mb-2">Crisis intervention center for the depressed and suicidal.</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#B6CAEB] font-medium">Website:</span>
                  <a href="http://www.aasra.info/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">aasra.info</a>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-[#B6CAEB] font-medium">Helpline:</span>
                  <span className="text-sm">+91-9820466726 (24/7)</span>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center">
                  The Live Love Laugh Foundation
                  <ExternalLink className="ml-1 h-3 w-3 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-600 mb-2">Foundation focused on reducing stigma and providing mental health education and support.</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#B6CAEB] font-medium">Website:</span>
                  <a href="https://thelivelovelaughfoundation.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">thelivelovelaughfoundation.org</a>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-[#B6CAEB] font-medium">Resources:</span>
                  <span className="text-sm">Mental health resources and provider directory</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-3">Leading Academic Institutions for Mental Health in India</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
                <img src={nimhansLogo} alt="NIMHANS Logo" className="h-16 mb-3" />
                <h4 className="text-center font-medium">NIMHANS, Bangalore</h4>
                <p className="text-xs text-center text-gray-600 mt-1">National Institute of Mental Health and Neuro Sciences</p>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
                <img src={iiitHyderabadLogo} alt="IIIT Hyderabad Logo" className="h-16 mb-3" />
                <h4 className="text-center font-medium">IIIT Hyderabad</h4>
                <p className="text-xs text-center text-gray-600 mt-1">Cognitive Science Research Center</p>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
                <img src={universityOfHyderabadLogo} alt="University of Hyderabad Logo" className="h-16 mb-3" />
                <h4 className="text-center font-medium">University of Hyderabad</h4>
                <p className="text-xs text-center text-gray-600 mt-1">Centre for Health Psychology</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">National Mental Health Helpline (Kiran)</h3>
              <p className="text-sm text-gray-700 mb-2">
                24/7 toll-free mental health rehabilitation helpline providing early screening, first-aid, psychological support, distress management, mental wellbeing, and psychological crisis management.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="font-medium">1800-599-0019</span>
                </div>
                <span className="hidden sm:block text-gray-500">|</span>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-blue-500 mr-1" />
                  <a href="https://nimhans.ac.in/kiran-mhrd/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">nimhans.ac.in/kiran-mhrd/</a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Self-Care Reminder */}
          <div className="bg-[#F5B8DB]/10 rounded-xl p-8 border border-[#F5B8DB]/20 mb-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold mb-4">Daily Self-Care Checklist</h2>
                <p className="text-gray-600 mb-6">
                  Remember that small daily habits can make a big difference in your mental wellbeing.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#F5B8DB] mr-2" />
                    <span>Get enough sleep (7-9 hours for most adults)</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#9AAB63] mr-2" />
                    <span>Stay hydrated and eat nutritious meals</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#B6CAEB] mr-2" />
                    <span>Move your body for at least 30 minutes</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#F5D867] mr-2" />
                    <span>Practice mindfulness or meditation for 5-10 minutes</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#F5B8DB] mr-2" />
                    <span>Connect with a friend or loved one</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#9AAB63] mr-2" />
                    <span>Limit social media and news consumption</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#B6CAEB] mr-2" />
                    <span>Take breaks throughout the day</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#F5D867] mr-2" />
                    <span>Journal about your thoughts and feelings</span>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/3 flex justify-center mt-6 md:mt-0">
                <div className="h-48 w-48 rounded-full bg-[#F5B8DB]/20 flex items-center justify-center">
                  <Clock className="h-24 w-24 text-[#F5B8DB]/60" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/">
              <Button variant="outline" className="mr-4">
                Return to Home
              </Button>
            </Link>
            <Link href="/help-center">
              <Button className="bg-[#F5B8DB] hover:bg-[#F5B8DB]/90">
                Visit Help Center
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <PageFooter />
    </div>
  );
}