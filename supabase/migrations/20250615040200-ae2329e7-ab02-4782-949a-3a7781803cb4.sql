
-- Add theme and job_description columns to the generated_resumes table
ALTER TABLE public.generated_resumes 
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'professional-modern',
ADD COLUMN IF NOT EXISTS job_description text,
ADD COLUMN IF NOT EXISTS job_title text;

-- Add RLS policies for generated_resumes table
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own generated resumes
CREATE POLICY "Users can view their own generated resumes" 
  ON public.generated_resumes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own generated resumes
CREATE POLICY "Users can create their own generated resumes" 
  ON public.generated_resumes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own generated resumes
CREATE POLICY "Users can update their own generated resumes" 
  ON public.generated_resumes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own generated resumes
CREATE POLICY "Users can delete their own generated resumes" 
  ON public.generated_resumes 
  FOR DELETE 
  USING (auth.uid() = user_id);
