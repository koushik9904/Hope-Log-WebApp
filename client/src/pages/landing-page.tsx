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
  Star
} from "lucide-react";
import { SiApple, SiAndroid } from "react-icons/si";
import { FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";

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
              <div className="h-10 w-10 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white mr-2">
                <span className="text-lg font-bold">H</span>
              </div>
              <span className="font-['Nunito_Variable'] font-bold text-xl">Hope Log</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
              <a href="#blog" className="text-gray-600 hover:text-gray-900">Blog</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About Us</a>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/" className="pi-button">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth" className="text-gray-600 hover:text-gray-900">
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

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center lg:space-x-12">
            <div className="lg:w-1/2 mb-12 lg:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your AI Companion for Mental Wellness
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Journal with AI, track your mood, and gain insights to improve your mental wellbeing with Hope Log.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth?tab=register" className="pi-button text-center">
                  Start Journaling Free
                </Link>
                <a href="#how-it-works" className="pi-button-outline text-center">
                  Learn How It Works
                </a>
              </div>
              
              <div className="mt-10 flex items-center">
                <div className="flex overflow-hidden -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-300 flex items-center justify-center text-xs font-bold text-white">TK</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-pink-400 flex items-center justify-center text-xs font-bold text-white">JR</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-green-400 flex items-center justify-center text-xs font-bold text-white">AL</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-purple-400 flex items-center justify-center text-xs font-bold text-white">MS</div>
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current text-yellow-500" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium">4.9/5 from 2,500+ reviews</span>
                  </div>
                  <p className="text-xs text-gray-500">Join 25,000+ users improving their mental wellness</p>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-100 rounded-full opacity-70"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-100 rounded-full opacity-70"></div>
              
              <div className="relative bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
                    <span className="text-lg font-bold">H</span>
                  </div>
                  <div>
                    <h2 className="font-bold">Hope Log</h2>
                    <p className="text-xs">Your AI wellness journal</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg self-start max-w-[80%] border border-blue-100">
                      <p className="text-sm">How are you feeling today?</p>
                    </div>
                    
                    <div className="bg-gray-100 p-3 rounded-lg self-end max-w-[80%] border border-gray-200">
                      <p className="text-sm">I've been feeling a bit anxious about my upcoming presentation at work...</p>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg self-start max-w-[80%] border border-blue-100">
                      <p className="text-sm">It's normal to feel anxious about presentations. Let's break down why you might be feeling this way and some strategies that could help...</p>
                    </div>
                    
                    <div className="flex space-x-2 mt-2">
                      <button className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 border border-gray-200">
                        Help me prepare
                      </button>
                      <button className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 border border-gray-200">
                        Relaxation techniques
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Features That Transform Your Mental Wellness</h2>
            <p className="text-xl text-gray-600">
              Hope Log combines AI technology with proven mental wellness techniques to help you understand and improve your emotional wellbeing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Powered Journaling</h3>
              <p className="text-gray-600">
                Chat with our empathetic AI that guides your reflection and responds with personalized insights and advice.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mood Tracking</h3>
              <p className="text-gray-600">
                Record your moods and visualize patterns over time, helping you understand emotional triggers and trends.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Personalized Insights</h3>
              <p className="text-gray-600">
                Receive custom analysis of your emotional patterns with actionable advice for improving your mental wellness.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Progress Tracking</h3>
              <p className="text-gray-600">
                Set and monitor goals and habits with our intuitive tracking system that helps you stay accountable.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Privacy First</h3>
              <p className="text-gray-600">
                Your data is encrypted and protected with state-of-the-art security measures. Your thoughts stay private.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Guided Prompts</h3>
              <p className="text-gray-600">
                Never stare at a blank page again with our thoughtful prompts that inspire reflection and discovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">How Hope Log Works</h2>
            <p className="text-xl text-gray-600">
              Our simple process helps you develop a consistent journaling practice and gain insights into your mental wellbeing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-blue-600 font-bold text-xl">1</span>
                <div className="absolute h-px w-full bg-blue-200 right-[-100%] top-1/2 hidden md:block"></div>
              </div>
              <h3 className="text-xl font-bold mb-2">Write or Speak</h3>
              <p className="text-gray-600">
                Journal about your day, thoughts, or feelings using text or voice. Or choose from our guided prompts.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-blue-600 font-bold text-xl">2</span>
                <div className="absolute h-px w-full bg-blue-200 right-[-100%] top-1/2 hidden md:block"></div>
              </div>
              <h3 className="text-xl font-bold mb-2">Receive Responses</h3>
              <p className="text-gray-600">
                Our AI provides thoughtful, personalized replies to help you explore your thoughts more deeply.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Gain Insights</h3>
              <p className="text-gray-600">
                Track patterns over time and receive weekly summaries with personalized wellness recommendations.
              </p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Link href="/auth?tab=register" className="pi-button inline-flex items-center">
              Start Your Journal Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">
              Choose the plan that best suits your mental wellness journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-500 mb-2">Free</h3>
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
              
              <Link href="/auth?tab=register" className="block text-center py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                Sign Up Free
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-blue-500 relative lg:scale-105 lg:-translate-y-2">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                POPULAR
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-gray-500 mb-2">Premium</h3>
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
                <h3 className="text-lg font-bold text-gray-500 mb-2">Therapist</h3>
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
              
              <button className="block text-center w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-gray-600">
              Real stories from people who've transformed their mental wellness with Hope Log.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-300 to-indigo-300 flex items-center justify-center text-white font-bold">
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

      {/* Download Apps */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-3xl font-bold mb-4">Take Hope Log With You</h2>
              <p className="text-xl mb-8 text-blue-100">
                Download our mobile apps to journal and track your mental wellness on the go.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-white text-gray-800 font-medium py-3 px-6 rounded-lg flex items-center">
                  <SiApple className="mr-2 h-6 w-6" />
                  iOS App
                </button>
                <button className="bg-white text-gray-800 font-medium py-3 px-6 rounded-lg flex items-center">
                  <SiAndroid className="mr-2 h-6 w-6" />
                  Android App
                </button>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-blue-400 rounded-full opacity-50"></div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-400 rounded-full opacity-50"></div>
                <div className="relative bg-white rounded-3xl overflow-hidden border-8 border-white shadow-xl">
                  <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=350&q=80" 
                       alt="Hope Log mobile app" 
                       className="w-48 h-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-10 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white mr-2">
                  <span className="text-lg font-bold">H</span>
                </div>
                <span className="font-['Nunito_Variable'] font-bold text-xl">Hope Log</span>
              </div>
              <p className="text-gray-600 mb-4">
                Your AI-powered mental wellness journal and companion.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <FaTwitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <FaInstagram size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-500">
                  <FaFacebook size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900">Features</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">API Access</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#blog" className="text-gray-600 hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Community</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Mental Health Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-600 hover:text-gray-900">About Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-10 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Hope Log. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}