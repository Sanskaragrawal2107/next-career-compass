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
      highlight: 'Smart Extraction',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: Target,
      title: 'Job Matching Engine',
      description: 'Get personalized job recommendations based on your skills and experience',
      highlight: 'Perfect Matches',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Skill Gap Analysis',
      description: 'Identify missing skills and get detailed roadmaps for career advancement',
      highlight: 'Career Growth',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: FileCheck,
      title: 'ATS-Optimized Resumes',
      description: 'Generate resumes that pass Applicant Tracking Systems with ease',
      highlight: 'ATS Ready',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: MessageSquare,
      title: 'Mock Interview Practice',
      description: 'Practice with AI-powered mock interviews and get detailed feedback',
      highlight: 'Interview Ready',
      color: 'from-pink-500 to-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Track your progress with detailed analytics and exportable reports',
      highlight: 'Data Driven',
      color: 'from-blue-500 to-green-500'
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
    },
    // --- 2025 FAQs ---
    // The Future of Work & AI
    {
      question: 'How will AI change job searching in 2025?',
      answer: 'In 2025, AI will be a co-pilot, not just a tool. Expect hyper-personalized job matching, AI-driven career path suggestions, automated application tailoring, and AI coaches for interview prep. AI will analyze your skills against real-time market data to suggest upskilling paths for maximum employability.',
    },
    {
      question: 'Will AI replace my job by 2025?',
      answer: 'AI is more likely to augment jobs than replace them entirely. It will automate repetitive tasks, allowing humans to focus on strategic, creative, and interpersonal aspects. The key is to develop skills that complement AI, such as critical thinking, emotional intelligence, and AI management.',
    },
    {
      question: 'What is a "hybrid skill set" and why is it crucial for 2025?',
      answer: 'A hybrid skill set combines technical proficiency (like data analysis or coding) with strong soft skills (like communication or leadership). In 2025, employers will seek professionals who can not only work with technology but also lead teams, manage projects, and communicate complex ideas effectively.',
    },
    {
      question: 'How will the 4-day work week trend evolve by 2025?',
      answer: 'By 2025, we\'ll see more companies adopting results-oriented work environments (ROWE) rather than just a 4-day week. The focus will shift from hours worked to output and impact. Flexible schedules, asynchronous work, and project-based sprints will become more common.',
    },
    {
      question: 'What role will "green skills" play in the 2025 job market?',
      answer: '"Green skills" related to sustainability and environmental responsibility will be in high demand across all industries, not just energy. Roles will require knowledge of sustainable practices, carbon footprint reduction, and circular economy principles, from supply chain management to marketing.',
    },
    // Advanced Job Search Strategies for 2025
    {
      question: 'Is "cold applying" on job boards dead in 2025?',
      answer: 'While not completely dead, its effectiveness has plummeted. In 2025, a successful strategy involves a "warm" approach: building a personal brand, networking within target companies, seeking referrals, and using AI tools to tailor applications meticulously. Quality over quantity is the mantra.',
    },
    {
      question: 'How can I use personal branding to find a job in 2025?',
      answer: 'In 2025, your personal brand is your career\'s storefront. Consistently share your expertise on platforms like LinkedIn, contribute to industry discussions, publish articles or create videos, and build a portfolio of your work. Recruiters are increasingly "headhunting" based on strong online presence.',
    },
    {
      question: 'What are "stealth jobs" and how do I find them?',
      answer: '"Stealth jobs" are roles that are filled internally or through networks before ever being advertised. To find them, you need to be an insider. Network proactively, conduct informational interviews, and make your career goals known to your connections. They are the key to the hidden job market.',
    },
    {
      question: 'How should I tailor my resume for an AI-first world in 2025?',
      answer: 'Your 2025 resume should be a "master document" that AI tools can adapt for each application. It needs to be rich with keywords, focused on quantifiable achievements, and include sections on new-age skills like AI literacy. Think of it as creating a data profile for yourself.',
    },
    {
      question: 'What is the role of video in the 2025 application process?',
      answer: 'Video will be integral. Expect to submit video introductions (instead of cover letters), complete one-way video interviews, and even showcase project walkthroughs via video. Proficiency in creating concise, professional video content will be a distinct advantage.',
    },
    // Emerging In-Demand Skills for 2025
    {
      question: 'Beyond coding, what are the top tech skills for 2025?',
      answer: 'Top skills include AI/ML engineering, prompt engineering, cybersecurity, data ethics, cloud architecture, and quantum computing fundamentals. The ability to integrate and manage different AI tools (AI orchestration) will also be highly valued.',
    },
    {
      question: 'What are the most critical "soft skills" for the 2025 workplace?',
      answer: 'The most critical soft skills are adaptability, cognitive flexibility (the ability to unlearn and relearn), emotional intelligence, creativity, and digital collaboration. With AI handling routine tasks, human-centric skills become premium.',
    },
    {
      question: 'What is "prompt engineering" and is it a viable career path?',
      answer: 'Prompt engineering is the art and science of crafting effective inputs (prompts) to get desired outputs from AI models like GPT-4. It\'s a rapidly growing and highly valuable skill, becoming essential for marketers, content creators, developers, and researchers.',
    },
    {
      question: 'Why is "data storytelling" a more valuable skill than just data analysis?',
      answer: 'Data analysis is about finding insights; data storytelling is about communicating those insights effectively to drive action. In a data-flooded world, the ability to create compelling narratives and visualizations from data is a skill that influences decisions and makes you invaluable.',
    },
    {
      question: 'Should I learn about Web3, blockchain, and the metaverse for my career?',
      answer: 'Yes, having a foundational understanding is becoming crucial. Even if you\'re not a developer, knowing how these technologies could impact your industry (e.g., decentralized finance, NFTs in marketing, virtual collaboration) will make you more forward-thinking and adaptable.',
    },
    // Career Longevity & Adaptability
    {
      question: 'What is a "portfolio career" and is it the future?',
      answer: 'A portfolio career involves juggling multiple income streams from different jobs, projects, or businesses, rather than relying on a single employer. It offers flexibility and security through diversification and is a growing trend for professionals at all levels.',
    },
    {
      question: 'How often should I be upskilling in 2025 to stay relevant?',
      answer: 'The concept of "lifelong learning" is now "continuous learning." Aim to dedicate 5-10 hours per week to learning. This could be through micro-learning, online courses, or project-based learning. The shelf-life of skills is shortening, so constant refresh is necessary.',
    },
    {
      question: 'How can I future-proof my career against automation?',
      answer: 'Focus on developing skills AI cannot easily replicate: complex problem-solving, creativity, critical thinking, leadership, and empathy. Embrace AI as a partner to enhance your productivity. Build a strong professional network and a personal brand.',
    },
    {
      question: 'Is it still important to specialize, or should I be a generalist?',
      answer: 'The ideal is the "T-shaped professional." You need deep expertise in one core area (the vertical bar of the T) combined with a broad knowledge base across multiple domains and strong collaboration skills (the horizontal bar). This combination drives innovation.',
    },
    {
      question: 'How can older workers stay competitive in the 2025 job market?',
      answer: 'Experienced workers should emphasize their strategic thinking, mentorship abilities, and deep industry knowledge. They must also demonstrate a commitment to continuous learning, embrace new technologies, and be open to reverse mentoring from younger colleagues.',
    },
    // Navigating Modern Workplace Dynamics
    {
      question: 'How do I negotiate for remote or hybrid work in 2025?',
      answer: 'Frame your request around productivity and results, not just preference. Present a clear plan for communication and collaboration. Highlight your ability to work autonomously and reference successful remote projects. Research company policy beforehand.',
    },
    {
      question: 'What are the new rules of workplace etiquette in a hybrid world?',
      answer: 'Key rules include being mindful of time zones, having clear agendas for virtual meetings, using status indicators effectively, over-communicating to avoid misunderstandings, and creating intentional in-person time for team bonding and complex collaboration.',
    },
    {
      question: 'How to combat "proximity bias" if I work remotely?',
      answer: 'Proximity bias is the unconscious tendency to favor employees who are physically present. Combat it by being proactive in your communication, providing regular updates on your progress, volunteering for high-visibility projects, and making your achievements known to management.',
    },
    {
      question: 'What role does mental health and well-being play in job selection in 2025?',
      answer: 'It\'s a top priority. Candidates are actively evaluating companies based on their mental health benefits, flexible work policies, and culture of psychological safety. Companies that invest in employee well-being are seen as top employers.',
    },
    {
      question: 'How is Diversity, Equity, and Inclusion (DEI) evolving in 2025?',
      answer: 'DEI is moving beyond representation to focus on belonging and equity. Companies are using data to identify and address pay gaps, biases in promotion, and are implementing more inclusive leadership training. Candidates should look for tangible evidence of DEI commitment.',
    },
    // The Gig Economy & Entrepreneurship
    {
      question: 'Is freelancing a more secure career path than a full-time job in 2025?',
      answer: 'It can be. While it lacks the perceived stability of a single paycheck, a successful freelancer has a diversified client base, making them resilient to a single company\'s downturn. Security in 2025 comes from in-demand skills and adaptability, not a job title.',
    },
    {
      question: 'What skills do I need to succeed in the gig economy?',
      answer: 'Beyond your core expertise, you need business management skills: marketing, sales, negotiation, project management, and financial planning. Strong self-discipline and communication are non-negotiable.',
    },
    {
      question: 'How can I transition from a full-time role to a "solopreneur"?',
      answer: 'Start by freelancing on the side to build a client base and validate your business idea. Create a financial runway (6-12 months of expenses). Build your personal brand and network intensely. Start small and scale gradually.',
    },
    {
      question: 'What legal and financial aspects should I consider before going freelance in India?',
      answer: 'You\'ll need to register for a GSTIN if your turnover exceeds the threshold, manage professional taxes, file income tax returns (ITR-3 or ITR-4), and consider professional indemnity insurance. It\'s wise to consult a Chartered Accountant (CA).',
    },
    {
      question: 'How will AI impact freelancers and gig workers?',
      answer: 'AI will be a massive productivity booster for freelancers. It can help with lead generation, content creation, administrative tasks, and even coding. Freelancers who master AI tools will be able to take on more work and deliver higher value.',
    },
    // Interviewing & Assessment in 2025
    {
      question: 'What are asynchronous video interviews (AVIs) and how do I ace them?',
      answer: 'AVIs are one-way interviews where you record answers to pre-set questions. To ace them: prepare answers beforehand, create a professional background with good lighting, look directly at the camera, speak clearly, and show enthusiasm, even without a live interviewer.',
    },
    {
      question: 'What kind of project-based assessments can I expect in 2025?',
      answer: 'Expect practical, real-world tasks. For example, a marketer might be asked to create a mini-campaign strategy, a developer to debug a piece of code, or a data analyst to interpret a dataset and present findings. These "take-home" assignments are becoming standard.',
    },
    {
      question: 'Will I be interviewed by an AI? How do I prepare?',
      answer: 'Yes, initial screening interviews by AI avatars are becoming common. Prepare by focusing on clear, concise language. Use keywords from the job description. Maintain a professional demeanor and practice answering common questions clearly into a camera.',
    },
    {
      question: 'How can I demonstrate "culture fit" in a remote interview process?',
      answer: 'Research the company\'s values deeply. Ask insightful questions about their remote work culture, communication styles, and team dynamics. Share examples of how you have successfully collaborated in remote or hybrid teams in the past.',
    },
    {
      question: 'What are the most impressive questions to ask an interviewer in 2025?',
      answer: 'Ask forward-looking questions. Examples: "How is the team leveraging AI to improve its processes?", "What is the company\'s strategy for continuous learning and upskilling?", "How do you measure success for this role beyond the initial job description?"',
    },
    // Global Career Trends
    {
      question: 'What is a "digital nomad visa" and how can I get one?',
      answer: 'It\'s a visa that allows you to live in a country while working remotely for an employer outside that country. Many countries now offer them. Requirements typically include proof of remote work, a minimum income level, and health insurance.',
    },
    {
      question: 'What are the fastest-growing job markets globally for Indian professionals?',
      answer: 'Key markets include Canada, Germany, Australia, and the UAE, which actively seek skilled professionals in tech, healthcare, and engineering. The remote job market in the US and UK also offers significant opportunities without relocation.',
    },
    {
      question: 'How can I build a global network from India?',
      answer: 'Actively participate in international online communities related to your field. Contribute to global open-source projects. Attend virtual international conferences. Use LinkedIn to connect with professionals in your target countries and engage with their content.',
    },
    {
      question: 'What is "geo-arbitrage" and how can it benefit my career?',
      answer: 'Geo-arbitrage is earning an income based on a high-cost economy (like the US) while living in a lower-cost location (like parts of India). Remote work makes this possible, allowing you to increase your savings and purchasing power significantly.',
    },
    {
      question: 'How do I handle cross-cultural communication in a global team?',
      answer: 'Be mindful of different communication styles (direct vs. indirect), attitudes towards hierarchy, and time zones. Be explicit and clear in written communication. Practice active listening and assume good intent.',
    },
    // Platform & Future Outlook
    {
      question: 'How will CareerBoost AI evolve to meet the challenges of 2025?',
      answer: 'CareerBoost AI is committed to staying ahead of the curve. We are integrating more advanced predictive analytics for career pathing, developing AI negotiation simulators, and expanding our skill-gap analysis to include emerging "green" and "AI-centric" skills to ensure our users are always future-ready.',
    },
    {
      question: 'Can AI truly understand the nuances of my career goals?',
      answer: 'While AI is powerful, it works best as a co-pilot. Our platform combines AI\'s data-processing power with your input and our career experts\' insights. You set the destination; our AI helps you map the most efficient and effective route to get there.',
    },
    {
      question: 'Will there be a "free" version of CareerBoost AI in 2025?',
      answer: 'We will always offer valuable free tools, like our initial resume analysis, to help professionals get started. Our subscription model allows us to invest in the cutting-edge AI and expert support needed to provide the deep, personalized guidance that delivers life-changing career results.',
    },
    {
      question: 'How does CareerBoost AI help with personal branding?',
      answer: 'Our platform analyzes your skills and achievements to help you craft a compelling professional narrative. We provide keyword optimization for your LinkedIn profile, suggest content ideas to establish your expertise, and help you track the growth of your professional brand\'s impact.',
    },
    {
      question: 'What is the single most important piece of career advice for 2025?',
      answer: 'Be relentlessly curious and adaptable. The world of work is changing faster than ever. The most successful professionals will not be those with a fixed set of skills, but those who are masters of learning, unlearning, and relearning to meet new challenges and seize new opportunities.',
    },
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 sticky top-0 bg-white/90 backdrop-blur-md z-50 rounded-b-xl shadow-sm">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/813d9d8b-5d4a-4774-a660-04b008430712.png" 
              alt="CareerBoost AI Logo" 
              className="h-12 w-auto"
            />
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
                <Button onClick={handleGetStarted} size="lg" className="bg-gradient-to-r from-pink-500 via-blue-500 to-green-500 hover:from-pink-600 hover:via-blue-600 hover:to-green-600">
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
          <Badge className="mb-6 bg-gradient-to-r from-pink-100 to-blue-100 text-gray-800 border-0 text-lg px-4 py-2">
            🚀 India's #1 AI Career Platform
          </Badge>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Land Your{' '}
            <span className="bg-gradient-to-r from-pink-500 via-blue-500 via-green-500 to-orange-500 bg-clip-text text-transparent">
              Dream Job
            </span>{' '}
            with AI Power
          </h1>
          
          <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your career with AI-powered resume optimization, personalized job matching, 
            skill gap analysis, and mock interview practice. Join 10,000+ professionals who landed their dream jobs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button size="lg" onClick={handleGetStarted} className="text-xl px-12 py-8 bg-gradient-to-r from-pink-500 via-blue-500 to-green-500 hover:from-pink-600 hover:via-blue-600 hover:to-green-600 shadow-2xl">
              Start Free Analysis
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
            <Button size="lg" variant="outline" className="text-xl px-12 py-8 border-2 hover:bg-gradient-to-r hover:from-pink-50 hover:to-blue-50">
              <Play className="mr-3 w-6 h-6" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-blue-500 to-green-500 bg-clip-text text-transparent mb-2">
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
          <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 border-0">Complete Career Solution</Badge>
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
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center`}>
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
                  <div className={`w-12 h-12 bg-gradient-to-r ${index % 4 === 0 ? 'from-pink-500 to-pink-600' : index % 4 === 1 ? 'from-blue-500 to-blue-600' : index % 4 === 2 ? 'from-green-500 to-green-600' : 'from-orange-500 to-orange-600'} rounded-full flex items-center justify-center`}>
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
      <section className="container mx-auto px-4 py-24 text-center bg-gradient-to-r from-pink-500 via-blue-500 to-green-500 rounded-3xl my-20 text-white">
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
                <img 
                  src="/lovable-uploads/813d9d8b-5d4a-4774-a660-04b008430712.png" 
                  alt="CareerBoost AI Logo" 
                  className="h-8 w-auto"
                />
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
