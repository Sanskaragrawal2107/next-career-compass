import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Target, TrendingUp, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ResumeAnalysis from '@/components/ResumeAnalysis';
import JobMatches from '@/components/JobMatches';
import SkillGapRoadmap from '@/components/SkillGapRoadmap';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, subscription, signOut, loading: authLoading } = useAuth();
  const [uploadedResume, setUploadedResume] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    resumesAnalyzed: 0,
    jobMatches: 0,
    skillsIdentified: 0,
    roadmapsGenerated: 0,
  });
  const [activeTab, setActiveTab] = useState("upload");
  const [roadmapSkills, setRoadmapSkills] = useState<any>(null);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);

  useEffect(() => {
    console.log('Dashboard mounted, auth state:', { user: user?.email, subscription, authLoading });
    
    if (!authLoading && !user) {
      console.log('No user found, redirecting to home');
      navigate('/');
      return;
    }

    if (user) {
      fetchUserStats();
      fetchLatestResume();
    }
  }, [user, authLoading, navigate]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      console.log('Fetching user stats for:', user.id);
      
      const { count: resumeCount } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: jobSearchCount } = await supabase
        .from('job_searches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: jobSearches } = await supabase
        .from('job_searches')
        .select('id')
        .eq('user_id', user.id);

      let jobMatchCount = 0;
      if (jobSearches && jobSearches.length > 0) {
        const { count } = await supabase
          .from('job_matches')
          .select('*', { count: 'exact', head: true })
          .in('job_search_id', jobSearches.map(js => js.id));
        jobMatchCount = count || 0;
      }

      setStats({
        resumesAnalyzed: resumeCount || 0,
        jobMatches: jobMatchCount,
        skillsIdentified: 0,
        roadmapsGenerated: jobSearchCount || 0,
      });
      
      console.log('Stats updated:', { resumeCount, jobMatchCount, jobSearchCount });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLatestResume = async () => {
    if (!user) return;

    try {
      const { data: resumes, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (resumes && resumes.length > 0) {
        setUploadedResume(resumes[0]);
        // Check if skills exist and are valid (not empty object)
        const skills = resumes[0].extracted_skills;
        if (skills && 
            typeof skills === 'object' && 
            !Array.isArray(skills) &&
            Object.keys(skills).length > 0 && 
            'suggested_job_titles' in skills &&
            Array.isArray(skills.suggested_job_titles) &&
            skills.suggested_job_titles.length > 0) {
          setActiveTab("analysis");
        }
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const fileExt = 'pdf';
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      
      console.log('Uploading file:', fileName);
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      console.log('File uploaded, saving to database');

      const { data: resumeData, error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user!.id,
          file_name: file.name,
          file_url: data.publicUrl,
          extracted_skills: {}, // Initialize with an empty object
          parsed_content: '',
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      setUploadedResume(resumeData);
      setActiveTab("analysis"); // Go to analysis tab after upload
      
      toast({
        title: "Resume uploaded successfully!",
        description: "Ready for AI analysis.",
      });

      fetchUserStats(); // Update stats after new resume upload
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleAnalysisComplete = () => {
    setActiveTab("matches");
    fetchUserStats(); // Refresh stats potentially
    fetchLatestResume(); // Refresh resume data as analysis might update extracted_skills
  };

  const handleRoadmapDataUpdate = (skills: any, jobTitles: string[]) => {
    setRoadmapSkills(skills);
    setSelectedJobTitles(jobTitles);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.full_name || user.email}
            </h1>
            <p className="text-gray-600 mt-1">Let's boost your career with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Plan: <span className="font-semibold text-primary">
                {subscription?.subscription_tier || 'Free'}
              </span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Resumes Analyzed</span>
                <span className="text-2xl font-bold text-blue-600">{stats.resumesAnalyzed}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Job Matches</span>
                <span className="text-2xl font-bold text-green-600">{stats.jobMatches}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Skills Identified</span>
                <span className="text-2xl font-bold text-purple-600">{stats.skillsIdentified}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Searches Done</span>
                <span className="text-2xl font-bold text-orange-600">{stats.roadmapsGenerated}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!uploadedResume}>
              <Target className="w-4 h-4 mr-2" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="matches" disabled={!uploadedResume}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Job Matches
            </TabsTrigger>
            <TabsTrigger value="roadmap" disabled={!uploadedResume}>
              <Target className="w-4 h-4 mr-2" />
              Skill Roadmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Resume Upload
                </CardTitle>
                <CardDescription>
                  Upload your LinkedIn resume in PDF format to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {uploading ? 'Uploading...' : uploadedResume ? uploadedResume.file_name : 'Click to upload your resume'}
                    </p>
                    <p className="text-gray-500">PDF files only, max 10MB</p>
                  </label>
                </div>
                
                {uploadedResume && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Resume uploaded successfully!</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">Ready for AI analysis. Go to the 'AI Analysis' tab.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {uploadedResume && (
              <ResumeAnalysis 
                resumeId={uploadedResume.id}
                initialExtractedSkills={uploadedResume.extracted_skills}
                onAnalysisComplete={handleAnalysisComplete}
                onRoadmapDataUpdate={handleRoadmapDataUpdate}
              />
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <JobMatches />
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            {roadmapSkills && selectedJobTitles.length > 0 ? (
              <SkillGapRoadmap 
                selectedJobTitles={selectedJobTitles}
                userSkills={roadmapSkills}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Skill Gap Roadmap</CardTitle>
                  <CardDescription>
                    Complete the AI Analysis and select job titles to generate your personalized learning roadmap
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setActiveTab("analysis")} variant="outline">
                    Go to AI Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
