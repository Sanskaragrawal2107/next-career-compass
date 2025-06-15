
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does AI resume optimization work?",
    answer: "Our AI analyzes your resume against job descriptions and industry standards, then provides specific recommendations for keywords, formatting, and content improvements to increase your ATS compatibility and recruiter appeal."
  },
  {
    question: "What makes your job matching different?",
    answer: "We use advanced machine learning algorithms that consider not just keywords, but also your career trajectory, skills, company culture preferences, and growth potential to find truly compatible opportunities."
  },
  {
    question: "How realistic are the mock interviews?",
    answer: "Our AI interviewer is trained on thousands of real interview scenarios across different industries and roles, providing realistic questions and behavioral assessments that mirror actual interview experiences."
  },
  {
    question: "Can I track my improvement over time?",
    answer: "Yes! Our analytics dashboard shows your progress in resume optimization, interview performance, skill development, and job application success rates with detailed insights and recommendations."
  },
  {
    question: "What industries do you support?",
    answer: "We support all major industries including technology, healthcare, finance, marketing, education, engineering, and more. Our AI is continuously updated with industry-specific knowledge and trends."
  }
];

export const FAQ = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Got questions? We've got answers to help you make the most of your career journey.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white rounded-lg shadow-md border-0">
                <AccordionTrigger className="px-6 py-4 text-left font-semibold text-gray-800 hover:text-purple-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
