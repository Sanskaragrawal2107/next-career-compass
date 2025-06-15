
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { processPayment } from '@/services/razorpayService';
import { toast } from '@/hooks/use-toast';
import AuthModal from '@/components/AuthModal';

const Pricing = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 999,
      originalPrice: 1499,
      currency: 'INR',
      interval: 'month',
      features: [
        'AI-powered resume analysis',
        'Unlimited job matching',
        'ATS-optimized resume generation',
        'Skill gap analysis & roadmaps',
        'Mock interview practice',
        'Excel job reports',
        '24/7 email support'
      ],
      popular: false,
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: 4999,
      originalPrice: 17988,
      currency: 'INR',
      interval: 'year',
      features: [
        'Everything in Monthly Plan',
        'Priority customer support',
        'Advanced analytics',
        'Resume templates',
        'Career coaching resources',
        'Job application tracking',
        'Exclusive webinars & events',
        '72% savings compared to monthly'
      ],
      popular: true,
    }
  ];

  const handlePayment = async (plan: typeof plans[0]) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!profile?.full_name || !profile?.email) {
      toast({
        title: "Profile incomplete",
        description: "Please complete your profile before subscribing.",
        variant: "destructive",
      });
      return;
    }

    setPaymentLoading(plan.id);

    try {
      await processPayment({
        amount: plan.price,
        currency: plan.currency,
        planType: plan.id as 'monthly' | 'yearly',
        userEmail: profile.email,
        userName: profile.full_name,
      });

      toast({
        title: "Payment successful!",
        description: "Your subscription has been activated. Redirecting to dashboard...",
      });

      // Refresh auth context to get updated subscription
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/813d9d8b-5d4a-4774-a660-04b008430712.png" 
              alt="CareerBoost AI Logo" 
              className="w-10 h-10"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              CareerBoost AI
            </span>
          </div>
        </nav>
      </header>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full power of AI-driven career optimization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-2 border-blue-500 shadow-2xl scale-105' : 'border shadow-lg'}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-4xl font-bold">₹{plan.price}</span>
                    <span className="text-lg text-muted-foreground">/{plan.interval}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm text-muted-foreground line-through">₹{plan.originalPrice}</span>
                    <Badge variant="secondary">
                      {Math.round((1 - plan.price / plan.originalPrice) * 100)}% OFF
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {plan.id === 'yearly' ? 'Best value for serious job seekers' : 'Perfect for getting started'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  onClick={() => handlePayment(plan)}
                  disabled={paymentLoading === plan.id}
                  className={`w-full text-lg py-6 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                      : ''
                  }`}
                >
                  {paymentLoading === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Get Started - ₹${plan.price}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-600 mb-4">
            Trusted by 10,000+ professionals • Secure payments • Cancel anytime
          </p>
          <div className="flex justify-center items-center space-x-6 text-xs text-gray-500">
            <span>🔒 SSL Secured</span>
            <span>💳 Razorpay Powered</span>
            <span>✅ 7-day Money Back</span>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};

export default Pricing;
