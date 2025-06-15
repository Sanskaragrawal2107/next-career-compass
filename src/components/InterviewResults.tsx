
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InterviewResultsProps {
  interview: any;
  onDone: () => void;
}

const InterviewResults: React.FC<InterviewResultsProps> = ({ interview, onDone }) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('overall_score, feedback')
        .eq('id', interview.id)
        .single();
      
      if (error) {
        console.error('Error fetching interview results:', error);
        toast({
            title: "Error",
            description: "Could not load interview results.",
            variant: "destructive",
        })
      } else {
        setResults(data);
      }
      setLoading(false);
    };

    fetchResults();
  }, [interview.id]);

  const renderDecision = () => {
    if (!results || results.overall_score === null) {
        return <p className="text-center text-muted-foreground">Your results are not yet available.</p>;
    }

    const score = results.overall_score; // Score from 0 to 5
    const isSelected = score >= 3.5;

    const feedback = results.feedback;

    return (
      <div className="space-y-6">
        <div className={`text-center ${isSelected ? 'text-green-600' : 'text-red-600'}`}>
          {isSelected ? (
            <UserCheck className="w-16 h-16 mx-auto mb-4" />
          ) : (
            <UserX className="w-16 h-16 mx-auto mb-4" />
          )}
          <h2 className="text-3xl font-bold">
            {isSelected ? "Congratulations! You're a great fit." : "Thank you for your time."}
          </h2>
          <p className="text-lg mt-2">
            {isSelected 
              ? "Based on your performance, we'd like to move forward." 
              : "While your skills are impressive, we're looking for a different profile at this time."}
          </p>
        </div>
        {feedback && (
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-2">Overall Feedback:</h3>
            <p className="text-sm text-muted-foreground italic mb-2">{feedback.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-medium">Strengths</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                        {feedback.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-medium">Areas for Improvement</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                        {feedback.areas_for_improvement?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            </div>
            <p className="text-xs text-center mt-4 text-muted-foreground">
              Note: This is an AI-generated assessment.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Interview Results for {interview.job_title}</CardTitle>
        <CardDescription>
          Here's the feedback on your performance during the {interview.interview_type} interview.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Finalizing your results...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderDecision()}
            <div className="text-center pt-4">
              <Button onClick={onDone}>Back to Dashboard</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterviewResults;
