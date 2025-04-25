import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageCircle, 
  Mail,
  Video,
  FileText,
  ThumbsUp,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/layout/page-header";
import { PageFooter } from "@/components/layout/page-footer";

export default function HelpCenterPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const popularArticles = [
    {
      title: "Getting Started with Hope Log",
      description: "Learn the basics of journaling with Hope Log and set up your account.",
      icon: <Book className="h-5 w-5 text-[#F5B8DB]" />,
      category: "Basics"
    },
    {
      title: "Understanding Mood Tracking",
      description: "How to use the mood tracking feature to monitor your emotional wellbeing.",
      icon: <ThumbsUp className="h-5 w-5 text-[#9AAB63]" />,
      category: "Features"
    },
    {
      title: "Setting Goals and Habits",
      description: "How to create and track personal goals and habits for better mental wellness.",
      icon: <FileText className="h-5 w-5 text-[#B6CAEB]" />,
      category: "Features"
    },
    {
      title: "Privacy and Data Security",
      description: "Understanding how your data is protected and managing your privacy settings.",
      icon: <FileText className="h-5 w-5 text-[#F5D867]" />,
      category: "Account & Security"
    }
  ];
  
  const faqItems = [
    {
      question: "What is Hope Log?",
      answer: "Hope Log is an AI-powered mental wellness platform designed to help you journal, track your mood, set goals, and gain insights into your emotional wellbeing. It combines conversational AI with proven mental health techniques to provide a personalized experience."
    },
    {
      question: "Is my data private and secure?",
      answer: "Yes, your privacy is our top priority. All your journal entries and personal data are encrypted and securely stored. We never share your personal information with third parties without your explicit consent. You can learn more in our Privacy Policy."
    },
    {
      question: "Can I export my journal entries?",
      answer: "Yes, Hope Log allows you to export your journal entries and other data. Go to Settings > Data & Export to download your journal entries in various formats including PDF and plain text."
    },
    {
      question: "How does the AI conversation work?",
      answer: "Hope Log's AI is designed to have natural, empathetic conversations with you. It remembers your past entries to provide context-aware responses, asks thoughtful questions, and offers personalized insights based on your journaling patterns."
    },
    {
      question: "Is Hope Log a replacement for therapy?",
      answer: "No, Hope Log is not a substitute for professional mental health care. While it can be a valuable tool for self-reflection and tracking your emotional wellbeing, it should be used as a complement to, not a replacement for, professional therapy or counseling."
    }
  ];
  
  return (
    <div className="min-h-screen bg-[#FFF8E8]">
      <PageHeader currentPage="help-center" />
      
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full text-blue-600 mb-4">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Help Center</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Find answers to your questions and learn how to get the most out of Hope Log.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search for help articles..."
                className="pl-10 py-3 focus-visible:ring-[#F5B8DB]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Popular Articles */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Popular Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {popularArticles.map((article, index) => {
                const articleId = article.title.toLowerCase().replace(/\s+/g, '-');
                return (
                  <div id={articleId} key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <div className="p-2 bg-gray-50 rounded-lg mr-4 mt-1 flex-shrink-0">
                        {article.icon}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{article.category}</span>
                        <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
                        <p className="text-sm text-gray-600">{article.description}</p>
                        <a href={`#${articleId}`} className="text-sm font-medium text-[#F5B8DB] inline-flex items-center mt-2">
                          Read more <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Help Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-gray-800">Help Categories</h2>
            <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
              <div id="getting-started" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
                <div className="mx-auto w-12 h-12 bg-[#F5B8DB]/10 rounded-full flex items-center justify-center mb-4">
                  <Book className="h-6 w-6 text-[#F5B8DB]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
                <p className="text-sm text-gray-600 mb-4">New to Hope Log? Learn the basics and set up your account.</p>
                <a href="#getting-started-with-hope-log" className="text-sm font-medium text-[#F5B8DB]">
                  View articles
                </a>
              </div>
              
              <div id="features" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
                <div className="mx-auto w-12 h-12 bg-[#9AAB63]/10 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-[#9AAB63]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Features</h3>
                <p className="text-sm text-gray-600 mb-4">Learn how to use journaling, mood tracking, and other features.</p>
                <a href="#understanding-mood-tracking" className="text-sm font-medium text-[#F5B8DB]">
                  View articles
                </a>
              </div>
              
              <div id="account" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center">
                <div className="mx-auto w-12 h-12 bg-[#B6CAEB]/10 rounded-full flex items-center justify-center mb-4">
                  <HelpCircle className="h-6 w-6 text-[#B6CAEB]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Account & Security</h3>
                <p className="text-sm text-gray-600 mb-4">Manage your account, privacy settings, and data security.</p>
                <a href="#privacy-and-data-security" className="text-sm font-medium text-[#F5B8DB]">
                  View articles
                </a>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left py-4">{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600 mb-2">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          {/* Contact Support */}
          <div className="bg-[#F5B8DB]/10 rounded-xl p-8 border border-[#F5B8DB]/20 text-center mb-16">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Still Have Questions?</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Our support team is here to help. Contact us and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/community">
                <Button variant="outline" className="flex items-center">
                  <MessageCircle className="mr-2 h-4 w-4" /> Ask the Community
                </Button>
              </Link>
              <a href="mailto:support@hopelog.com">
                <Button className="bg-[#F5B8DB] hover:bg-[#F5B8DB]/90 flex items-center">
                  <Mail className="mr-2 h-4 w-4" /> Email Support
                </Button>
              </a>
            </div>
          </div>
          
          {/* Video Tutorials */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Video Tutorials</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Video coming soon</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1">Getting Started with Hope Log</h3>
                  <p className="text-sm text-gray-600">A quick overview of key features</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Video coming soon</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1">Daily Journaling Guide</h3>
                  <p className="text-sm text-gray-600">How to make journaling a habit</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Video coming soon</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1">Understanding Your Insights</h3>
                  <p className="text-sm text-gray-600">Making the most of AI analysis</p>
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
            <Link href="/community">
              <Button className="bg-[#9AAB63] hover:bg-[#9AAB63]/90">
                Visit Community Forum
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <PageFooter />
    </div>
  );
}