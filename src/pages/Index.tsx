
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
  Mail,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

  const faqs = [
    // Resume Writing FAQs
    {
      question: 'How to write a perfect resume in 2024?',
      answer: 'A perfect resume in 2024 should be ATS-friendly, include relevant keywords, be concise (1-2 pages), have a clean format, include quantifiable achievements, and be tailored to each job application. Use action verbs, include a professional summary, and ensure contact information is up-to-date.',
    },
    {
      question: 'What is an ATS-friendly resume and why is it important?',
      answer: 'An ATS (Applicant Tracking System) friendly resume is designed to be easily read by software that screens resumes before they reach human recruiters. It uses standard fonts, clear headings, avoids graphics/tables, includes relevant keywords, and follows a simple format. 95% of Fortune 500 companies use ATS, making this crucial for job seekers.',
    },
    {
      question: 'How long should a resume be in 2024?',
      answer: 'For most professionals, a resume should be 1-2 pages. Entry-level candidates should aim for 1 page, experienced professionals can use 2 pages, and senior executives or academics may extend to 3 pages if necessary. The key is relevance - every line should add value.',
    },
    {
      question: 'What are the most important sections to include in a resume?',
      answer: 'Essential resume sections include: Contact Information, Professional Summary/Objective, Work Experience, Education, Skills, and Certifications. Optional sections can include Projects, Volunteer Work, Languages, Publications, or Awards based on relevance to the target role.',
    },
    {
      question: 'How to write resume bullet points that get noticed?',
      answer: 'Use the STAR method (Situation, Task, Action, Result) or CAR method (Challenge, Action, Result). Start with action verbs, include quantifiable results, focus on achievements rather than duties, and tailor to job requirements. Example: "Increased sales by 30% in 6 months by implementing new lead generation strategy."',
    },
    {
      question: 'Should I include a photo on my resume?',
      answer: 'In most countries including the US, UK, and India, photos on resumes are not recommended and can lead to unconscious bias. However, in some European countries like Germany, photos are common. Research local customs or ask CareerBoost AI for region-specific advice.',
    },
    {
      question: 'How to handle employment gaps in a resume?',
      answer: 'Be honest about gaps but frame them positively. If you were unemployed, mention any freelancing, volunteering, education, or skill development. Use years instead of months if helpful. Include a brief explanation in your cover letter. Focus on what you learned during the gap.',
    },
    {
      question: 'What resume format is best for my industry?',
      answer: 'Chronological format works best for traditional industries and steady career progression. Functional format suits career changers or those with gaps. Hybrid/combination format works for most professionals. Creative industries may allow more design freedom, while conservative fields prefer traditional formats.',
    },
    // Job Search FAQs
    {
      question: 'How to find a job quickly in 2024?',
      answer: 'To find a job quickly: optimize your resume and LinkedIn profile, apply to 10-15 jobs daily, network actively, use multiple job boards, consider recruiters, prepare for interviews, follow up on applications, and be open to contract or temporary positions that can lead to permanent roles.',
    },
    {
      question: 'What are the best job search websites in India?',
      answer: 'Top job portals in India include Naukri.com, LinkedIn, Indeed, Monster India, Shine.com, TimesJobs, Glassdoor, AngelList (for startups), Instahyre, and company career pages. Each platform has its strengths - use multiple platforms for maximum reach.',
    },
    {
      question: 'How to negotiate salary effectively?',
      answer: 'Research market rates for your role, document your achievements, practice your pitch, timing is crucial (after job offer), consider the entire package (not just base salary), be professional and confident, have a backup plan, and be prepared to walk away if the offer is significantly below expectations.',
    },
    {
      question: 'How important is networking for job search?',
      answer: 'Networking is crucial - 70-80% of jobs are never publicly advertised. Build genuine relationships, attend industry events, use LinkedIn strategically, join professional associations, alumni networks, and don\'t just network when job hunting. Maintain relationships year-round.',
    },
    {
      question: 'How to optimize LinkedIn profile for job search?',
      answer: 'Use a professional headshot, write a compelling headline, craft a detailed summary, include relevant keywords, showcase achievements with metrics, get recommendations, post industry-relevant content, engage with your network, and ensure your profile is 100% complete.',
    },
    // Interview Preparation FAQs
    {
      question: 'How to prepare for a job interview in 1 week?',
      answer: 'Research the company and role thoroughly, practice common interview questions, prepare your STAR stories, plan your outfit, prepare questions to ask, review your resume, practice with mock interviews, research the interviewer on LinkedIn, and plan your route to the interview location.',
    },
    {
      question: 'What are the most common interview questions and answers?',
      answer: 'Common questions include: "Tell me about yourself," "Why do you want this job?," "What are your strengths/weaknesses?," "Where do you see yourself in 5 years?," "Why are you leaving your current job?," and "Do you have any questions?" Prepare authentic, specific answers using the STAR method.',
    },
    {
      question: 'How to handle behavioral interview questions?',
      answer: 'Use the STAR method: Situation (set context), Task (explain what needed to be done), Action (describe what you did), Result (share the outcome). Prepare 5-7 stories covering different skills like leadership, problem-solving, teamwork, and conflict resolution.',
    },
    {
      question: 'What should I wear to a job interview?',
      answer: 'Dress one level above the company\'s daily dress code. For corporate roles, opt for business professional. For startups, business casual may suffice. Ensure clothes are clean, well-fitted, and conservative. When in doubt, it\'s better to be slightly overdressed than underdressed.',
    },
    {
      question: 'How to answer "What is your expected salary?" question?',
      answer: 'Research salary ranges for the role, consider your experience and location, provide a range rather than specific number, mention that you\'re open to negotiation, and emphasize your interest in the role and growth opportunities beyond just compensation.',
    },
    // Career Development FAQs
    {
      question: 'How to change careers successfully?',
      answer: 'Identify transferable skills, research target industry requirements, network with professionals in new field, consider additional education/certifications, start with informational interviews, possibly take on projects in new area, be prepared for potential salary reduction initially, and leverage CareerBoost AI for personalized guidance.',
    },
    {
      question: 'What skills are most in demand in 2024?',
      answer: 'High-demand skills include: AI/Machine Learning, Data Analysis, Cloud Computing, Cybersecurity, Digital Marketing, Project Management, UX/UI Design, Software Development, Emotional Intelligence, and Adaptability. Technical skills combined with soft skills create the most valuable professionals.',
    },
    {
      question: 'How to get promoted at work?',
      answer: 'Exceed performance expectations, take on additional responsibilities, build strong relationships, communicate achievements to your manager, seek feedback regularly, develop leadership skills, mentor others, stay updated with industry trends, and have regular career conversations with your supervisor.',
    },
    {
      question: 'Should I quit my job without another offer?',
      answer: 'Generally not recommended unless you have significant savings, are in an toxic environment, or have strong job prospects. Consider: your financial situation, job market conditions, industry demand, networking strength, and timeline for finding new role. Have 6-12 months of expenses saved ideally.',
    },
    {
      question: 'How to build a personal brand for career growth?',
      answer: 'Define your unique value proposition, be consistent across platforms, create valuable content in your expertise area, engage with industry conversations, speak at events, maintain professional online presence, ask for recommendations, and authentically showcase your personality and values.',
    },
    // Skill Development FAQs
    {
      question: 'How to identify skill gaps in my career?',
      answer: 'Analyze job descriptions for target roles, get feedback from managers/peers, use skills assessment tools, compare your skills to industry leaders, review performance evaluations, consider market trends, and use platforms like CareerBoost AI for comprehensive skill gap analysis.',
    },
    {
      question: 'What is the best way to learn new skills online?',
      answer: 'Combine multiple learning methods: online courses (Coursera, Udemy, LinkedIn Learning), YouTube tutorials, industry blogs, podcasts, webinars, virtual conferences, online communities, and practical projects. Set specific learning goals and dedicate consistent time daily.',
    },
    {
      question: 'How long does it take to learn a new skill?',
      answer: 'Basic proficiency: 20-50 hours, functional competency: 100-200 hours, professional competency: 500+ hours. Timeline depends on complexity, prior knowledge, learning method, and practice frequency. Focus on practical application alongside theoretical learning.',
    },
    {
      question: 'Are certifications worth it for career advancement?',
      answer: 'Yes, if they\'re relevant to your field and recognized by employers. Priority certifications include: Google (Analytics, Ads), AWS/Azure (Cloud), PMP (Project Management), Salesforce, HubSpot (Marketing), and industry-specific credentials. Research ROI before investing.',
    },
    {
      question: 'How to stay updated with industry trends?',
      answer: 'Follow industry leaders on LinkedIn/Twitter, subscribe to relevant newsletters and blogs, attend webinars and conferences, join professional associations, participate in online communities, listen to industry podcasts, and set up Google Alerts for key topics.',
    },
    // Remote Work FAQs
    {
      question: 'How to find legitimate remote jobs?',
      answer: 'Use reputable platforms like LinkedIn, AngelList, We Work Remotely, Remote.co, FlexJobs, and Upwork. Be cautious of scams - legitimate employers won\'t ask for upfront payments. Research companies thoroughly and verify job postings through official company websites.',
    },
    {
      question: 'What skills are essential for remote work success?',
      answer: 'Key remote work skills include: self-discipline, time management, clear communication, tech proficiency, problem-solving independence, video conferencing etiquette, digital collaboration, and maintaining work-life balance. Employers also value reliability and proactive communication.',
    },
    {
      question: 'How to prepare for remote job interviews?',
      answer: 'Test your technology beforehand, ensure good lighting and quiet environment, prepare for technical difficulties, practice video interviewing, have backup plans for connectivity issues, dress professionally (full outfit), and prepare questions about remote work culture and expectations.',
    },
    // Salary and Benefits FAQs
    {
      question: 'How to research salary expectations for a role?',
      answer: 'Use salary research tools like Glassdoor, PayScale, Salary.com, LinkedIn Salary Insights, and AmbitionBox (for India). Consider location, company size, industry, your experience level, and current market conditions. Network contacts can provide insider information.',
    },
    {
      question: 'When is the best time to ask for a raise?',
      answer: 'Best timing: after completing major projects, during performance reviews, after receiving additional responsibilities, when company is performing well, or after gaining new certifications. Avoid during budget cuts, layoffs, or personal/company crises.',
    },
    {
      question: 'What benefits should I negotiate besides salary?',
      answer: 'Consider: flexible working arrangements, additional vacation days, professional development budget, stock options, better health insurance, retirement contributions, signing bonus, relocation assistance, equipment allowance, and career advancement opportunities.',
    },
    // Industry-Specific FAQs
    {
      question: 'How to break into the tech industry without a computer science degree?',
      answer: 'Focus on building practical skills through coding bootcamps, online courses, and personal projects. Create a strong portfolio, contribute to open source projects, network with tech professionals, consider entry-level roles like QA or technical support, and highlight transferable skills from previous experience.',
    },
    {
      question: 'What are the highest paying jobs in India right now?',
      answer: 'Top paying roles include: Data Scientists, AI/ML Engineers, Cloud Architects, Investment Bankers, Management Consultants, Product Managers, Cybersecurity Specialists, DevOps Engineers, and Petroleum Engineers. Salaries vary by location, experience, and company size.',
    },
    {
      question: 'How to transition from traditional industries to digital roles?',
      answer: 'Identify digital skills relevant to your industry, take online courses, seek digital projects in current role, network with digital professionals, consider hybrid roles that combine traditional and digital skills, and highlight analytical and problem-solving abilities.',
    },
    // Freelancing and Entrepreneurship FAQs
    {
      question: 'How to start freelancing while working full-time?',
      answer: 'Start small with weekend projects, ensure no conflict of interest with current employer, build portfolio gradually, set clear boundaries, save money for transition period, develop client relationships, and consider freelancing in different industry than full-time job initially.',
    },
    {
      question: 'What are the pros and cons of freelancing vs full-time employment?',
      answer: 'Freelancing pros: flexibility, potentially higher income, variety, autonomy. Cons: irregular income, no benefits, self-employment taxes, finding clients. Full-time pros: steady income, benefits, career growth, team collaboration. Cons: less flexibility, potential ceiling on income.',
    },
    // Job Market and Economic FAQs
    {
      question: 'How has the job market changed post-COVID?',
      answer: 'Major changes include: increased remote work options, emphasis on digital skills, healthcare and tech job growth, automation acceleration, gig economy expansion, focus on employee wellbeing, virtual interviewing normalization, and increased importance of adaptability and resilience.',
    },
    {
      question: 'What industries are growing fastest in India?',
      answer: 'Fastest growing sectors include: Information Technology, E-commerce, FinTech, HealthTech, EdTech, Renewable Energy, Food Delivery, Digital Marketing, Cybersecurity, and Electric Vehicles. These sectors offer numerous opportunities for career growth.',
    },
    {
      question: 'How to recession-proof your career?',
      answer: 'Develop in-demand skills, build multiple income streams, maintain emergency fund, network continuously, stay updated with industry trends, become indispensable at work, consider recession-resistant industries (healthcare, utilities, food), and focus on continuous learning.',
    },
    // Age and Experience FAQs
    {
      question: 'How to find a job after 40 in India?',
      answer: 'Leverage extensive experience, highlight leadership and mentoring abilities, stay current with technology, consider consulting or part-time roles, network extensively, target companies that value experience, be open to slightly lower positions initially, and emphasize stability and reliability.',
    },
    {
      question: 'How can fresh graduates stand out in competitive job market?',
      answer: 'Build relevant projects during college, gain internship experience, develop both technical and soft skills, create professional online presence, network with alumni and industry professionals, customize applications for each role, and demonstrate passion and willingness to learn.',
    },
    // Platform-Specific FAQs
    {
      question: 'What is CareerBoost AI and how does it work?',
      answer: 'CareerBoost AI is a comprehensive platform that uses artificial intelligence to help you land your dream job. It analyzes your resume, matches you with suitable jobs, identifies skill gaps, and prepares you for interviews. Our AI processes your information to provide personalized recommendations and data-driven insights for career growth.',
    },
    {
      question: 'Is this platform suitable for both freshers and experienced professionals?',
      answer: 'Absolutely! CareerBoost AI is designed for everyone, from recent graduates looking for their first job to seasoned professionals aiming for a career change or promotion. The tools and recommendations are tailored to your individual experience level and career goals.',
    },
    {
      question: 'How does the AI resume analysis improve my job chances?',
      answer: 'Our AI scans your resume for key skills, experience, and formatting, comparing it against thousands of successful resumes and job descriptions. It provides a detailed report on how to optimize it for Applicant Tracking Systems (ATS) and human recruiters, increasing your chances of getting shortlisted by over 2.5x.',
    },
    {
      question: 'Is my data safe and private?',
      answer: 'Yes, data security and privacy are our top priorities. We use industry-standard encryption and security protocols to protect your personal information. Your data is used solely to provide you with our career services and is never shared with third parties without your consent.',
    },
    {
      question: 'How is CareerBoost AI different from job portals like Naukri or LinkedIn?',
      answer: 'While traditional job portals are primarily search engines for job listings, CareerBoost AI is a complete career development co-pilot. We don\'t just show you jobs; we actively help you become the best candidate. Our platform offers end-to-end support, including resume building, skill development roadmaps, and mock interview practice, which is something other portals don\'t provide.',
    },
    {
      question: 'What kind of support can I expect after subscribing?',
      answer: 'Subscribed members get priority support from our career experts. You can reach out to us via email for any queries regarding the platform, your reports, or general career advice. Our support email is spprtcareersarthi@gmail.com and we typically respond within 24 hours.'
    }
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

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-green-100 text-green-800 border-green-200">Career Guidance FAQs</Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Career & Job Search Guide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about resume writing, job search, interviews, career development, and professional growth - answered by career experts.
          </p>
        </div>
        <div className="max-w-6xl mx-auto bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index} className={index === faqs.length - 1 ? 'border-b-0' : ''}>
                <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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

      {/* Footer */}
      <footer className="bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-4 md:space-y-0">
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">CareerBoost AI</span>
              </div>
              <p className="text-gray-600 text-sm">© {new Date().getFullYear()} CareerBoost AI. All rights reserved.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-2">Contact Us</p>
              <a href="mailto:spprtcareersarthi@gmail.com" className="flex items-center justify-center md:justify-start text-gray-800 hover:text-blue-600 transition-colors">
                <Mail className="w-4 h-4 mr-2" />
                spprtcareersarthi@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};

export default Index;
