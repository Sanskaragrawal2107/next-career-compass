
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Target, 
  TrendingUp, 
  Download, 
  CheckCircle, 
  Star,
  ArrowRight,
  Brain,
  Shield,
  Zap,
  Users,
  Award,
  Clock,
  BarChart3,
  MessageSquare,
  FileCheck,
  Sparkles,
  Globe,
  Play,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';

const Index = () => {
  const navigate = useNavigate();
  const { user, subscription, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      if (subscription?.subscribed) {
        navigate('/dashboard');
      } else {
        navigate('/pricing');
      }
    } else {
      setAuthModalOpen(true);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI Resume Analysis',
      description: 'Advanced AI extracts and analyzes skills from your resume with 95%+ accuracy',
      highlight: 'Smart Extraction'
    },
    {
      icon: Target,
      title: 'Job Matching Engine',
      description: 'Get personalized job recommendations based on your skills and experience',
      highlight: 'Perfect Matches'
    },
    {
      icon: TrendingUp,
      title: 'Skill Gap Analysis',
      description: 'Identify missing skills and get detailed roadmaps for career advancement',
      highlight: 'Career Growth'
    },
    {
      icon: FileCheck,
      title: 'ATS-Optimized Resumes',
      description: 'Generate resumes that pass Applicant Tracking Systems with ease',
      highlight: 'ATS Ready'
    },
    {
      icon: MessageSquare,
      title: 'Mock Interview Practice',
      description: 'Practice with AI-powered mock interviews and get detailed feedback',
      highlight: 'Interview Ready'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Track your progress with detailed analytics and exportable reports',
      highlight: 'Data Driven'
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Software Engineer',
      company: 'Tech Corp',
      content: 'CareerBoost AI helped me land my dream job in just 3 weeks! The resume optimization was game-changing.',
      rating: 5
    },
    {
      name: 'Rahul Kumar',
      role: 'Data Scientist',
      company: 'Analytics Inc',
      content: 'The skill gap analysis showed me exactly what to learn. Got promoted within 6 months!',
      rating: 5
    },
    {
      name: 'Anita Patel',
      role: 'Product Manager',
      company: 'Innovation Labs',
      content: 'Mock interviews prepared me perfectly. Confidence boosted, salary increased by 40%!',
      rating: 5
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Professionals Helped' },
    { value: '95%', label: 'Success Rate' },
    { value: '2.5x', label: 'Faster Job Search' },
    { value: '40%', label: 'Average Salary Increase' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 sticky top-0 bg-white/80 backdrop-blur-md z-50 rounded-b-xl">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">CareerBoost AI</span>
            <Badge className="bg-green-100 text-green-800 border-green-200">Live</Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <Button onClick={() => navigate(subscription?.subscribed ? '/dashboard' : '/pricing')} size="lg">
                {subscription?.subscribed ? 'Go to Dashboard' : 'Subscribe Now'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setAuthModalOpen(true)}>
                  Sign In
                </Button>
                <Button onClick={handleGetStarted} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Get Started Free
                  <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-5xl mx-auto">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200 text-lg px-4 py-2">
            🚀 India's #1 AI Career Platform
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Land Your{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dream Job
            </span>{' '}
            with AI Power
          </h1>
          
          <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your career with AI-powered resume optimization, personalized job matching, 
            skill gap analysis, and mock interview practice. Join 10,000+ professionals who landed their dream jobs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button size="lg" onClick={handleGetStarted} className="text-xl px-12 py-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl">
              Start Free Analysis
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            <Button size="lg" variant="outline" className="text-xl px-12 py-8 border-2 hover:bg-gray-50">
              <Play className="mr-3 w-6 h-6" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600 mb-6">Trusted by professionals at top companies</p>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            <div className="text-2xl font-bold text-gray-400">Google</div>
            <div className="text-2xl font-bold text-gray-400">Microsoft</div>
            <div className="text-2xl font-bold text-gray-400">Amazon</div>
            <div className="text-2xl font-bold text-gray-400">TCS</div>
            <div className="text-2xl font-bold text-gray-400">Infosys</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24 bg-white/70 rounded-3xl my-20 backdrop-blur-sm">
        <div className="text-center mb-20">
          <Badge className="mb-6 bg-purple-100 text-purple-800 border-purple-200">Complete Career Solution</Badge>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform provides end-to-end career optimization tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {feature.highlight}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-yellow-100 text-yellow-800 border-yellow-200">Success Stories</Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Real Results from Real People
          </h2>
          <p className="text-xl text-gray-600">See how CareerBoost AI transformed careers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription className="text-gray-700 text-lg leading-relaxed italic">
                  "{testimonial.content}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl my-20 text-white">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-white/20 text-white border-white/30">Limited Time Offer</Badge>
          <h2 className="text-5xl font-bold mb-6">
            Ready to 10x Your Career?
          </h2>
          <p className="text-2xl mb-12 opacity-90 leading-relaxed">
            Join 10,000+ professionals who transformed their careers with AI. 
            Start your journey to success today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Button size="lg" onClick={handleGetStarted} variant="secondary" className="text-xl px-12 py-8 bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="text-xl px-12 py-8 border-2 border-white text-white hover:bg-white/10">
              View Pricing
            </Button>
          </div>

          <div className="flex justify-center items-center space-x-8 text-sm opacity-80">
            <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> No Credit Card Required</span>
            <span className="flex items-center"><Shield className="w-4 h-4 mr-2" /> 100% Secure</span>
            <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> Setup in 2 Minutes</span>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};

export default Index;
