
-- Create mock_interviews table to store interview sessions
CREATE TABLE public.mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  interview_type TEXT NOT NULL DEFAULT 'technical', -- technical, behavioral, mixed
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, paused
  total_questions INTEGER NOT NULL DEFAULT 0,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  overall_score DECIMAL(3,2), -- 0.00 to 5.00
  feedback JSONB,
  duration_minutes INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create interview_questions table to store questions and answers
CREATE TABLE public.interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.mock_interviews(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'technical', -- technical, behavioral, follow_up
  question_order INTEGER NOT NULL,
  user_answer_text TEXT,
  user_answer_audio_url TEXT,
  response_time_seconds INTEGER,
  ai_follow_up_context JSONB, -- context for generating next question
  score DECIMAL(3,2), -- 0.00 to 5.00
  feedback TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for mock_interviews
CREATE POLICY "Users can view their own mock interviews" ON public.mock_interviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mock interviews" ON public.mock_interviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mock interviews" ON public.mock_interviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mock interviews" ON public.mock_interviews
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for interview_questions
CREATE POLICY "Users can view their own interview questions" ON public.interview_questions
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.mock_interviews WHERE id = interview_id));

CREATE POLICY "Users can insert their own interview questions" ON public.interview_questions
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.mock_interviews WHERE id = interview_id));

CREATE POLICY "Users can update their own interview questions" ON public.interview_questions
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.mock_interviews WHERE id = interview_id));

CREATE POLICY "Users can delete their own interview questions" ON public.interview_questions
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.mock_interviews WHERE id = interview_id));

-- Create indexes for better performance
CREATE INDEX idx_mock_interviews_user_id ON public.mock_interviews(user_id);
CREATE INDEX idx_mock_interviews_status ON public.mock_interviews(user_id, status);
CREATE INDEX idx_interview_questions_interview_id ON public.interview_questions(interview_id);
CREATE INDEX idx_interview_questions_order ON public.interview_questions(interview_id, question_order);
