
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Check, Star, Zap, Crown } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Perfect for job seekers getting started",
      icon: Star,
      gradient: "from-blue-500 to-purple-600",
      features: [
        "Basic resume optimization",
        "5 job matches per month",
        "Basic interview preparation",
        "Email support",
        "ATS compatibility check"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "Ideal for active job seekers",
      icon: Zap,
      gradient: "from-green-500 to-blue-500",
      features: [
        "Advanced AI resume optimization",
        "Unlimited job matches",
        "AI mock interviews with feedback",
        "Skill gap analysis & roadmap",
        "Priority support",
        "Resume templates library",
        "Interview performance analytics"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For career professionals and teams",
      icon: Crown,
      gradient: "from-purple-500 to-pink-500",
      features: [
        "Everything in Professional",
        "Personal career coach AI",
        "Advanced analytics dashboard",
        "Custom branding options",
        "Team collaboration features",
        "API access",
        "White-label solutions",
        "Dedicated account manager"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <img 
                src="/lovable-uploads/813d9d8b-5d4a-4774-a660-04b008430712.png" 
                alt="CareerBoost AI" 
                className="h-16 w-auto"
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Choose Your Career Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Unlock your career potential with our AI-powered tools. Select the plan that best fits your professional journey.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg ${
                  plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                } bg-gradient-to-br from-white to-gray-50`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <plan.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">{plan.name}</CardTitle>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                  <div className="mt-6">
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full mt-8 py-6 text-lg font-semibold transition-all duration-200 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
                        : `bg-gradient-to-r ${plan.gradient} hover:shadow-lg text-white`
                    }`}
                  >
                    {plan.popular ? 'Start Free Trial' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-2">Can I change plans anytime?</h3>
                <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-2">Is there a free trial?</h3>
                <p className="text-gray-600">We offer a 7-day free trial for the Professional plan to help you experience our premium features.</p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards, PayPal, and offer annual billing discounts.</p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
