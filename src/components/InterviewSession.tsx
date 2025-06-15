import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Clock, 
  ArrowLeft, 
  RotateCcw,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InterviewSessionProps {
  interview: any;
  onComplete: (interview: any) => void;
  onExit: () => void;
}

const InterviewSession: React.FC<InterviewSessionProps> = ({
  interview,
  onComplete,
  onExit
}) => {
  const { user } = useAuth();
  const camera = useCamera();
  const speechRecognition = useSpeechRecognition();
  
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [questionTime, setQuestionTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [previousQA, setPreviousQA] = useState<any[]>([]);
  
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!speechRecognition.isSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
    }
    
    initializeInterview();
    startTimers();
    
    return () => {
      stopTimers();
      camera.stopCamera();
      speechRecognition.stopListening();
    };
  }, []);

  const initializeInterview = async () => {
    try {
      // Start camera
      await camera.startCamera();
      
      // Load existing questions or generate first question
      await loadOrGenerateQuestion();
    } catch (error) {
      console.error('Error initializing interview:', error);
      toast({
        title: "Setup Error",
        description: "Please ensure camera and microphone permissions are granted.",
        variant: "destructive",
      });
    }
  };

  const loadOrGenerateQuestion = async () => {
    setQuestionLoading(true);
    
    try {
      // First, load any existing questions
      const { data: existingQuestions, error: questionsError } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('interview_id', interview.id)
        .order('question_order', { ascending: true });

      if (questionsError) throw questionsError;

      setPreviousQA(existingQuestions || []);

      // Check if we need to generate a new question
      const nextQuestionNumber = (existingQuestions?.length || 0) + 1;
      
      if (nextQuestionNumber <= interview.total_questions) {
        // Check if there's an unanswered question
        const unansweredQuestion = existingQuestions?.find(q => !q.user_answer_text);
        
        if (unansweredQuestion) {
          setCurrentQuestion(unansweredQuestion);
        } else {
          // Generate new question
          await generateNextQuestion(nextQuestionNumber, existingQuestions || []);
        }
      } else {
        // Interview completed
        await completeInterview();
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load interview questions.",
        variant: "destructive",
      });
    } finally {
      setQuestionLoading(false);
    }
  };

  const generateNextQuestion = async (questionNumber: number, previousQuestions: any[]) => {
    try {
      console.log('Generating question #', questionNumber);
      
      // Get user skills for context
      const { data: resumeData } = await supabase
        .from('resumes')
        .select('extracted_skills')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const userSkills = resumeData?.extracted_skills || {};
      
      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: {
          interviewId: interview.id,
          jobTitle: interview.job_title,
          interviewType: interview.interview_type,
          previousQuestions: previousQuestions.map(q => ({
            question: q.question_text,
            answer: q.user_answer_text
          })),
          userAnswer: previousQuestions.length > 0 ? previousQuestions[previousQuestions.length - 1]?.user_answer_text : '',
          questionNumber,
          userSkills
        }
      });

      if (error) {
        throw error;
      }

      setCurrentQuestion({
        id: data.questionId,
        question_text: data.question,
        question_order: questionNumber
      });

      resetQuestionTimer();
    } catch (error: any) {
      console.error('Error generating question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate next question.",
        variant: "destructive",
      });
    }
  };

  const handleAnswer = async () => {
    if (!speechRecognition.isListening) {
      // Start recording
      try {
        speechRecognition.resetTranscript();
        await speechRecognition.startListening();
        toast({
          title: "Listening Started",
          description: "Speak your answer. Click the mic again when finished.",
        });
      } catch (error) {
        toast({
          title: "Speech Recognition Error",
          description: "Failed to start speech recognition.",
          variant: "destructive",
        });
      }
    } else {
      // Stop recording and save answer
      try {
        setSavingAnswer(true);
        speechRecognition.stopListening();
        
        // Wait a moment for final transcript
        setTimeout(async () => {
          const transcribedText = speechRecognition.transcript.trim();
          
          if (!transcribedText) {
            toast({
              title: "No Speech Detected",
              description: "Please try speaking your answer again.",
              variant: "destructive",
            });
            setSavingAnswer(false);
            return;
          }

          console.log('Transcribed text:', transcribedText);

          // Save answer to database
          await saveAnswer(transcribedText);
          
          // Load next question
          await loadOrGenerateQuestion();
          setSavingAnswer(false);
        }, 1000);
      } catch (error) {
        console.error('Error processing answer:', error);
        toast({
          title: "Error",
          description: "Failed to process your answer.",
          variant: "destructive",
        });
        setSavingAnswer(false);
      }
    }
  };

  const saveAnswer = async (answerText: string) => {
    if (!currentQuestion) return;

    try {
      const responseTime = questionTime;
      
      const { error } = await supabase
        .from('interview_questions')
        .update({
          user_answer_text: answerText,
          response_time_seconds: responseTime,
          answered_at: new Date().toISOString()
        })
        .eq('id', currentQuestion.id);

      if (error) throw error;

      // Update interview progress
      const { error: interviewError } = await supabase
        .from('mock_interviews')
        .update({
          current_question_index: interview.current_question_index + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', interview.id);

      if (interviewError) throw interviewError;

    } catch (error) {
      console.error('Error saving answer:', error);
      throw error;
    }
  };

  const completeInterview = async () => {
    try {
      // For demonstration, a mock score is generated.
      // In a real application, a backend function would perform AI analysis
      // of the answers to generate a score and detailed feedback.
      const mockScore = Math.random() * 2 + 2.5; // Score between 2.5 and 4.5 for variability

      const { data: updatedInterview, error } = await supabase
        .from('mock_interviews')
        .update({
          status: 'completed',
          duration_minutes: Math.round(totalTime / 60),
          completed_at: new Date().toISOString(),
        })
        .eq('id', interview.id)
        .select()
        .single();

      if (error) throw error;

      // Kick off the analysis in the background. No need to await.
      supabase.functions.invoke('analyze-interview-performance', {
        body: { interviewId: interview.id }
      }).then(({ error: functionError }) => {
        if (functionError) {
          console.error("Error analyzing interview:", functionError);
          // Optionally, you could update the interview status to 'analysis_failed'
          // and show a message to the user.
        }
      });

      toast({
        title: "Interview Completed!",
        description: "Great job! We are now analyzing your responses.",
      });

      onComplete(updatedInterview);
    } catch (error) {
      console.error('Error completing interview:', error);
      toast({
        title: "Error Completing Interview",
        description: "There was an issue saving your final results.",
        variant: "destructive",
      });
    }
  };

  const startTimers = () => {
    startTimeRef.current = Date.now();
    
    questionTimerRef.current = setInterval(() => {
      if (!isPaused) {
        setQuestionTime(prev => prev + 1);
      }
    }, 1000);

    totalTimerRef.current = setInterval(() => {
      if (!isPaused) {
        setTotalTime(prev => prev + 1);
      }
    }, 1000);
  };

  const stopTimers = () => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
    }
  };

  const resetQuestionTimer = () => {
    setQuestionTime(0);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestionNumber = (previousQA.length || 0) + 1;
  const progress = (currentQuestionNumber / interview.total_questions) * 100;

  const renderSpeechRecognitionStatus = () => {
    if (speechRecognition.error) {
      return (
        <div className="flex items-center justify-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{speechRecognition.error}</span>
        </div>
      );
    }

    if (speechRecognition.isListening) {
      return (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Listening... Click stop when finished</p>
          <div className="mt-2 flex justify-center">
            <div className="bg-red-500 rounded-full w-3 h-3 animate-pulse"></div>
          </div>
          {speechRecognition.transcript && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              <p className="text-muted-foreground">Live transcript:</p>
              <p>{speechRecognition.transcript}</p>
            </div>
          )}
        </div>
      );
    }

    if (!speechRecognition.isSupported) {
      return (
        <div className="text-center text-orange-500 text-sm">
          Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Button variant="ghost" size="sm" onClick={onExit} className="mr-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                Mock Interview - {interview.job_title}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline">
                  Question {currentQuestionNumber} of {interview.total_questions}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  Total: {formatTime(totalTime)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  Question: {formatTime(questionTime)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={togglePause}>
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={resetQuestionTimer}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="w-full" />
        </CardContent>
      </Card>

      {/* Main interview interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video and question */}
        <div className="space-y-4">
          {/* Camera feed */}
          <Card>
            <CardContent className="p-4">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={camera.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={camera.isActive ? camera.stopCamera : camera.startCamera}
                  >
                    {camera.isActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </Button>
                </div>
                {speechRecognition.isListening && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-red-500 rounded-full w-4 h-4 animate-pulse" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question and controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Question</CardTitle>
            </CardHeader>
            <CardContent>
              {questionLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Generating question...</p>
                </div>
              ) : currentQuestion ? (
                <div className="space-y-4">
                  <p className="text-lg">{currentQuestion.question_text}</p>
                  
                  <div className="flex justify-center">
                    <Button
                      onClick={handleAnswer}
                      disabled={savingAnswer || isPaused || !speechRecognition.isSupported}
                      size="lg"
                      className={`${speechRecognition.isListening ? 'bg-red-500 hover:bg-red-600' : ''} transition-colors`}
                    >
                      {savingAnswer ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving Answer...
                        </>
                      ) : speechRecognition.isListening ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Answer
                        </>
                      )}
                    </Button>
                  </div>

                  {renderSpeechRecognitionStatus()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Interview completed!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous answers summary */}
          {previousQA.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Previous Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {previousQA.slice(-3).map((qa, index) => (
                    <div key={qa.id} className="text-xs">
                      <p className="font-medium text-muted-foreground">Q{qa.question_order}: {qa.question_text.substring(0, 50)}...</p>
                      {qa.user_answer_text && (
                        <p className="text-muted-foreground">A: {qa.user_answer_text.substring(0, 50)}...</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
