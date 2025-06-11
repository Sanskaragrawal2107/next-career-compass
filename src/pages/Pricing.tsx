
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Pricing = () => {
  const navigate = useNavigate();
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$9',
      period: '/month',
      description: 'Perfect for active job seekers',
      features: [
        'Unlimited resume uploads',
        'AI-powered skill extraction',
        'Job title suggestions',
        'Skill gap analysis',
        'Personalized roadmaps',
        'Job matching (80%+ accuracy)',
        'ATS-optimized resume generation',
        'Excel reports',
        'Email support'
      ],
      popular: false,
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$89',
      period: '/year',
      description: 'Best value for career growth',
      features: [
        'Everything in Monthly Plan',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
        'API access',
        'Bulk processing',
        'Save $19 annually'
      ],
      popular: true,
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Please sign in first",
        description: "You need to be logged in to subscribe",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setLoading(planId);
    
    // For now, simulate payment processing
    // TODO: Integrate with Razorpay
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment successful!",
        description: "Welcome to your premium account. Redirecting to dashboard...",
      });
      
      // TODO: Update subscription status in database
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (subscription?.subscribed) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock AI-powered career enhancement tools and boost your hiring chances
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary border-2 shadow-lg scale-105' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {loading === plan.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Subscribe to ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Overview */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            What You Get With Every Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600 text-sm">Advanced AI extracts skills and analyzes your resume with 95%+ accuracy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">High-Match Jobs</h3>
              <p className="text-gray-600 text-sm">Only jobs with 80%+ compatibility to maximize your success rate</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeft className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">ATS Optimization</h3>
              <p className="text-gray-600 text-sm">Resumes optimized for Applicant Tracking Systems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
