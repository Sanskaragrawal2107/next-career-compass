
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Trophy, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface InterviewHistoryProps {
  onBack: () => void;
  onSelectInterview: (interview: any) => void;
}

const InterviewHistory: React.FC<InterviewHistoryProps> = ({ onBack, onSelectInterview }) => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mock_interviews')
        .select(`
          *,
          interview_questions(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewInterviewDetails = async (interview: any) => {
    try {
      const { data: questions, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('interview_id', interview.id)
        .order('question_order', { ascending: true });

      if (error) throw error;

      setSelectedInterview({
        ...interview,
        questions: questions || []
      });
    } catch (error) {
      console.error('Error fetching interview details:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'paused': return 'outline';
      default: return 'outline';
    }
  };

  if (selectedInterview) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedInterview(null)} className="mb-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to History
                </Button>
                <CardTitle>{selectedInterview.job_title} Interview</CardTitle>
                <CardDescription>
                  {formatDate(selectedInterview.created_at)}
                </CardDescription>
              </div>
              <div className="text-right">
                <Badge variant={getStatusColor(selectedInterview.status)}>
                  {selectedInterview.status}
                </Badge>
                {selectedInterview.overall_score && (
                  <div className="mt-2">
                    <Trophy className="w-4 h-4 inline mr-1" />
                    {(selectedInterview.overall_score * 20).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedInterview.questions.length}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {selectedInterview.duration_minutes || 0}m
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{selectedInterview.interview_type}</div>
                <div className="text-sm text-muted-foreground">Type</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Questions & Answers</h3>
              {selectedInterview.questions.map((question: any, index: number) => (
                <Card key={question.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">Question {question.question_order}</h4>
                        {question.response_time_seconds && (
                          <Badge variant="outline">
                            {Math.floor(question.response_time_seconds / 60)}:
                            {(question.response_time_seconds % 60).toString().padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{question.question_text}</p>
                      {question.user_answer_text ? (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm">{question.user_answer_text}</p>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground italic">No answer recorded</p>
                        </div>
                      )}
                      {question.score && (
                        <div className="flex items-center mt-2">
                          <Trophy className="w-4 h-4 mr-1" />
                          <span className="text-sm">Score: {(question.score * 20).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle>Interview History</CardTitle>
              <CardDescription>
                View your past interview sessions and performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading interviews...</p>
        </div>
      ) : interviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No interviews yet. Start your first mock interview!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{interview.job_title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(interview.created_at)}
                      {interview.duration_minutes && ` • ${interview.duration_minutes} min`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(interview.status)}>
                        {interview.status}
                      </Badge>
                      <Badge variant="outline">
                        {interview.interview_type}
                      </Badge>
                      {interview.overall_score && (
                        <Badge variant="outline">
                          <Trophy className="w-3 h-3 mr-1" />
                          {(interview.overall_score * 20).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewInterviewDetails(interview)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {interview.status === 'in_progress' && (
                      <Button 
                        size="sm"
                        onClick={() => onSelectInterview(interview)}
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
