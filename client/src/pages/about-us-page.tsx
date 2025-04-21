import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#FFF8E8] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <HopeLogLogo size="lg" withText className="mx-auto" />
          <h1 className="text-3xl md:text-4xl font-bold mt-6 mb-2 text-gray-800">Our Story</h1>
          <p className="text-lg text-gray-600">Transforming Mental Wellness Through Technology</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-md mb-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">The Birth of Hope Log</h2>
            
            <p className="mb-4">
              Hope Log was born from a deeply personal journey. As someone who struggled with anxiety and depression, 
              I found traditional journaling helpful but limited. The breakthrough came when I combined my mental health 
              journey with my background in technology.
            </p>

            <p className="mb-4">
              What started as a simple digital journaling tool evolved into something more meaningful—a 
              comprehensive mental wellness platform designed to understand emotions, track patterns, and 
              provide personalized insights.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Our Mission</h2>
            
            <p className="mb-4">
              At Hope Log, we believe that everyone deserves access to effective mental wellness tools. 
              Our mission is to make emotional well-being accessible through technology that truly understands you.
            </p>
            
            <p className="mb-4">
              We've built Hope Log as a companion that listens, remembers, and grows with you. It's not 
              just a journal—it's a conversation with yourself, guided by thoughtful AI that helps you 
              discover patterns and insights you might otherwise miss.
            </p>

            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">The Technology Behind Hope Log</h2>
            
            <p className="mb-4">
              Hope Log combines advanced natural language processing with thoughtful design to create 
              a unique journaling experience:
            </p>
            
            <ul className="list-disc pl-6 mb-6">
              <li className="mb-2">
                <strong>Conversational Journaling:</strong> Our AI guides your reflection process, asking 
                thoughtful questions that help you explore your thoughts more deeply.
              </li>
              <li className="mb-2">
                <strong>Emotion Analysis:</strong> We help you understand patterns in your emotional states 
                over time, combining your self-reported moods with sentiment analysis from your entries.
              </li>
              <li className="mb-2">
                <strong>Personal Growth Tracking:</strong> Set meaningful goals and track habits that support 
                your wellbeing, with gentle reminders and progress visualization.
              </li>
              <li>
                <strong>Weekly Insights:</strong> Gain perspective with AI-generated summaries that highlight 
                themes, patterns, and potential areas for growth in your journal entries.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Looking Forward</h2>
            
            <p className="mb-4">
              We're committed to continually improving Hope Log based on the latest research and user 
              feedback. Our roadmap includes enhanced analytics, integration with health applications, 
              and additional tools for mindfulness and structured reflection.
            </p>
            
            <p className="mb-6">
              We invite you to join us on this journey toward better mental wellness. Your story matters, 
              and we're here to help you write it with greater insight and compassion.
            </p>

            <div className="mt-8 flex justify-center">
              <a 
                href="https://jazeeljabbar.substack.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-6 py-3 rounded-lg bg-[#9AAB63] text-white font-medium hover:bg-[#9AAB63]/90 transition-colors"
              >
                Visit Our Blog <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/">
            <Button className="bg-[#F5B8DB] hover:bg-[#F5B8DB]/90">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}