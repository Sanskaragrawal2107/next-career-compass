
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, Target, Users, Zap, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Resume Optimization",
    description: "Our advanced AI analyzes your resume and provides personalized recommendations to increase your chances of landing interviews.",
    gradient: "from-blue-500 to-purple-600"
  },
  {
    icon: Target,
    title: "Smart Job Matching",
    description: "Get matched with perfect job opportunities based on your skills, experience, and career goals using our intelligent algorithms.",
    gradient: "from-green-500 to-blue-500"
  },
  {
    icon: Users,
    title: "Mock Interview Practice",
    description: "Practice with our AI interviewer and receive detailed feedback to improve your interview performance and confidence.",
    gradient: "from-pink-500 to-red-500"
  },
  {
    icon: TrendingUp,
    title: "Skill Gap Analysis",
    description: "Identify skills you need to develop for your dream job and get personalized learning roadmaps to bridge the gap.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: FileText,
    title: "ATS-Optimized Templates",
    description: "Choose from professionally designed resume templates that are optimized for Applicant Tracking Systems.",
    gradient: "from-orange-500 to-yellow-500"
  },
  {
    icon: Zap,
    title: "Real-time Analytics",
    description: "Track your progress with detailed analytics and insights about your job search performance and improvements.",
    gradient: "from-cyan-500 to-blue-500"
  }
];

export const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Powerful Features for Your Success
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how our AI-powered tools can transform your career journey and help you achieve your professional goals.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-800">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
