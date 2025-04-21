import { HopeLogLogo } from "@/components/ui/hope-log-logo";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  Users, 
  Search, 
  MessageSquare, 
  BookOpen, 
  Heart,
  SmilePlus,
  Bookmark,
  PanelTop,
  Clock,
  ArrowUp,
  MessageCircle,
  Award
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ForumPost {
  id: number;
  title: string;
  preview: string;
  author: string;
  authorInitial: string;
  category: string;
  likes: number;
  replies: number;
  timeAgo: string;
  isPopular?: boolean;
  isPinned?: boolean;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(true);
  
  const forumPosts: ForumPost[] = [
    {
      id: 1,
      title: "How to get the most out of daily journaling?",
      preview: "I've been using Hope Log for a few weeks and I'm curious about how others structure their daily journaling practice...",
      author: "Sarah",
      authorInitial: "S",
      category: "Journaling Tips",
      likes: 24,
      replies: 12,
      timeAgo: "2 hours ago",
      isPopular: true
    },
    {
      id: 2,
      title: "Weekly mood patterns - how to interpret them?",
      preview: "The mood tracking feature shows some interesting patterns in my emotional states throughout the week...",
      author: "Michael",
      authorInitial: "M",
      category: "Mood Tracking",
      likes: 18,
      replies: 8,
      timeAgo: "1 day ago"
    },
    {
      id: 3,
      title: "Announcement: Community Guidelines Update",
      preview: "We've updated our community guidelines to create a more supportive environment for everyone...",
      author: "Moderator",
      authorInitial: "M",
      category: "Announcements",
      likes: 32,
      replies: 5,
      timeAgo: "2 days ago",
      isPinned: true
    },
    {
      id: 4,
      title: "Setting realistic goals - accountability partners?",
      preview: "I find it difficult to stick to my goals. Is anyone interested in becoming accountability partners?",
      author: "Alex",
      authorInitial: "A",
      category: "Goals & Habits",
      likes: 15,
      replies: 20,
      timeAgo: "3 days ago",
      isPopular: true
    },
    {
      id: 5,
      title: "App suggestion: Dark mode for nighttime journaling",
      preview: "I often journal before bed and would love to have a dark mode option to reduce eye strain...",
      author: "Jamie",
      authorInitial: "J",
      category: "Feature Requests",
      likes: 42,
      replies: 14,
      timeAgo: "4 days ago",
      isPopular: true
    }
  ];
  
  const categories = [
    { name: "Journaling Tips", count: 45, icon: <BookOpen className="h-4 w-4 mr-2" /> },
    { name: "Mental Wellness", count: 32, icon: <Heart className="h-4 w-4 mr-2" /> },
    { name: "Goals & Habits", count: 28, icon: <SmilePlus className="h-4 w-4 mr-2" /> },
    { name: "Feature Requests", count: 22, icon: <Bookmark className="h-4 w-4 mr-2" /> },
    { name: "Announcements", count: 10, icon: <PanelTop className="h-4 w-4 mr-2" /> }
  ];
  
  const dismissComingSoon = () => {
    setShowComingSoon(false);
    toast({
      title: "Coming Soon!",
      description: "We're still building our community features. Check back soon!",
    });
  };
  
  const renderForumPost = (post: ForumPost) => (
    <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start">
        <Avatar className="h-10 w-10 mr-4 flex-shrink-0">
          <AvatarFallback className="bg-[#F5B8DB]/20 text-[#F5B8DB]">{post.authorInitial}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1 gap-2 flex-wrap">
            <Badge variant="outline" className="bg-gray-50 font-normal">{post.category}</Badge>
            {post.isPinned && (
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                <PanelTop className="h-3 w-3 mr-1" /> Pinned
              </Badge>
            )}
            {post.isPopular && (
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                <Award className="h-3 w-3 mr-1" /> Popular
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-lg truncate">{post.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.preview}</p>
          
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-4">{post.author}</span>
            <Clock className="h-3 w-3 mr-1" />
            <span className="mr-4">{post.timeAgo}</span>
            <ArrowUp className="h-3 w-3 mr-1" />
            <span className="mr-4">{post.likes}</span>
            <MessageCircle className="h-3 w-3 mr-1" />
            <span>{post.replies}</span>
          </div>
        </div>
      </div>
    </div>
  );
  
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
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-full text-blue-600 mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800">Community Forum</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Connect with others, share experiences, and learn together on your mental wellness journey.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search the forum..."
                className="pl-10 py-3 focus-visible:ring-[#9AAB63]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {showComingSoon && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 p-2 mr-3 flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-yellow-700">
                  <strong>Coming Soon:</strong> Our community forum is under development. The preview below shows what's coming!
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={dismissComingSoon}
                className="text-yellow-700 hover:bg-yellow-100"
              >
                Dismiss
              </Button>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <Tabs defaultValue="all">
                  <div className="flex justify-between items-center mb-6">
                    <TabsList>
                      <TabsTrigger value="all">All Posts</TabsTrigger>
                      <TabsTrigger value="popular">Popular</TabsTrigger>
                      <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
                    </TabsList>
                    
                    <Button className="bg-[#9AAB63] hover:bg-[#9AAB63]/90">
                      <MessageSquare className="h-4 w-4 mr-2" /> New Post
                    </Button>
                  </div>
                  
                  <TabsContent value="all" className="space-y-4">
                    {forumPosts.map(post => renderForumPost(post))}
                  </TabsContent>
                  
                  <TabsContent value="popular" className="space-y-4">
                    {forumPosts.filter(post => post.isPopular).map(post => renderForumPost(post))}
                  </TabsContent>
                  
                  <TabsContent value="unanswered" className="space-y-4">
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No unanswered posts yet</h3>
                      <p className="text-gray-500">Be the first to start a conversation!</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div className="flex justify-center">
                <Button variant="outline">Load More</Button>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:w-1/4 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-lg mb-4">Categories</h3>
                <div className="space-y-3">
                  {categories.map((category, index) => (
                    <div key={index} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded cursor-pointer">
                      <div className="flex items-center">
                        {category.icon}
                        <span>{category.name}</span>
                      </div>
                      <Badge variant="outline" className="bg-gray-50">{category.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-lg mb-4">Community Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-[#F5B8DB]">2,453</div>
                    <div className="text-sm text-gray-500">Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#9AAB63]">1,280</div>
                    <div className="text-sm text-gray-500">Discussions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#B6CAEB]">8,742</div>
                    <div className="text-sm text-gray-500">Replies</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#F5B8DB]/10 rounded-xl p-5 border border-[#F5B8DB]/20">
                <h3 className="font-semibold text-lg mb-2">Community Guidelines</h3>
                <p className="text-sm text-gray-600 mb-3">Our community thrives on kindness, respect, and support.</p>
                <Link href="#">
                  <span className="text-sm font-medium text-[#F5B8DB]">Read Guidelines</span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
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
    </div>
  );
}