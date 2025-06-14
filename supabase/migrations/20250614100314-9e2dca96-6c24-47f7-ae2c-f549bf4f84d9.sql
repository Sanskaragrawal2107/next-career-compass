
-- Create skill_roadmaps table to store generated roadmaps
CREATE TABLE public.skill_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  skill_gaps JSONB NOT NULL DEFAULT '[]',
  roadmap_data JSONB NOT NULL DEFAULT '[]',
  total_days INTEGER NOT NULL DEFAULT 30,
  estimated_weeks INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create roadmap_progress table to track user progress on roadmap tasks
CREATE TABLE public.roadmap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  day INTEGER NOT NULL,
  task_index INTEGER NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_title, day, task_index)
);

-- Enable Row Level Security on both tables
ALTER TABLE public.skill_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for skill_roadmaps
CREATE POLICY "Users can view their own skill roadmaps" ON public.skill_roadmaps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skill roadmaps" ON public.skill_roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill roadmaps" ON public.skill_roadmaps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skill roadmaps" ON public.skill_roadmaps
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for roadmap_progress
CREATE POLICY "Users can view their own roadmap progress" ON public.roadmap_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roadmap progress" ON public.roadmap_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roadmap progress" ON public.roadmap_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roadmap progress" ON public.roadmap_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_skill_roadmaps_user_id ON public.skill_roadmaps(user_id);
CREATE INDEX idx_skill_roadmaps_job_title ON public.skill_roadmaps(user_id, job_title);
CREATE INDEX idx_roadmap_progress_user_id ON public.roadmap_progress(user_id);
CREATE INDEX idx_roadmap_progress_user_job ON public.roadmap_progress(user_id, job_title);
