
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Video, History, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import InterviewSession from './InterviewSession';
import InterviewHistory from './InterviewHistory';

interface MockInterviewProps {}

const MockInterview: React.FC<MockInterviewProps> = () => {
  const { user } = useAuth();
  const [activeInterview, setActiveInterview] = useState<any>(null);
  const [recentInterviews, setRecentInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecentInterviews();
      checkActiveInterview();
    }
  }, [user]);

  const fetchRecentInterviews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    }
  };

  const checkActiveInterview = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setActiveInterview(data[0]);
      }
    } catch (error) {
      console.error('Error checking active interview:', error);
    }
  };

  const startNewInterview = async (jobTitle: string, interviewType: string = 'technical') => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Starting new interview:', { jobTitle, interviewType });

      const { data, error } = await supabase
        .from('mock_interviews')
        .insert({
          user_id: user.id,
          job_title: jobTitle,
          interview_type: interviewType,
          status: 'in_progress',
          total_questions: 10, // Default to 10 questions
          current_question_index: 0
        })
        .select()
        .single();

      if (error) throw error;

      setActiveInterview(data);
      toast({
        title: "Interview Started",
        description: `Started ${interviewType} interview for ${jobTitle} position.`,
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInterviewComplete = () => {
    setActiveInterview(null);
    fetchRecentInterviews();
  };

  if (showHistory) {
    return (
      <InterviewHistory 
        onBack={() => setShowHistory(false)}
        onSelectInterview={(interview) => {
          if (interview.status === 'in_progress') {
            setActiveInterview(interview);
          }
          setShowHistory(false);
        }}
      />
    );
  }

  if (activeInterview) {
    return (
      <InterviewSession 
        interview={activeInterview}
        onComplete={handleInterviewComplete}
        onExit={() => setActiveInterview(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Mock Interview Practice
          </CardTitle>
          <CardDescription>
            Practice with AI-powered interviews that adapt to your responses in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => setShowHistory(false)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Interview
            </Button>
            <Button onClick={() => setShowHistory(true)} variant="outline">
              <History className="w-4 h-4 mr-2" />
              Interview History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Interview</CardTitle>
            <CardDescription>
              Algorithm, data structures, system design, and coding questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => startNewInterview('Software Engineer', 'technical')}
                disabled={loading}
                className="w-full"
              >
                Software Engineer
              </Button>
              <Button 
                onClick={() => startNewInterview('Data Scientist', 'technical')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Data Scientist
              </Button>
              <Button 
                onClick={() => startNewInterview('Product Manager', 'technical')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Product Manager
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Behavioral Interview</CardTitle>
            <CardDescription>
              Leadership, teamwork, problem-solving, and situational questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => startNewInterview('Software Engineer', 'behavioral')}
                disabled={loading}
                className="w-full"
              >
                Software Engineer
              </Button>
              <Button 
                onClick={() => startNewInterview('Data Scientist', 'behavioral')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Data Scientist
              </Button>
              <Button 
                onClick={() => startNewInterview('Product Manager', 'behavioral')}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Product Manager
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Interviews */}
      {recentInterviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInterviews.slice(0, 3).map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{interview.job_title}</div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(interview.created_at).toLocaleDateString()}
                      {interview.duration_minutes && ` • ${interview.duration_minutes} min`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      interview.status === 'completed' ? 'default' : 
                      interview.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {interview.status}
                    </Badge>
                    {interview.overall_score && (
                      <Badge variant="outline">
                        {(interview.overall_score * 20).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MockInterview;
