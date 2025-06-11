
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Target, TrendingUp, Download, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, subscription, signOut, loading: authLoading } = useAuth();
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    resumesAnalyzed: 0,
    jobMatches: 0,
    skillsIdentified: 0,
    roadmapsGenerated: 0,
  });

  useEffect(() => {
    console.log('Dashboard mounted, auth state:', { user: user?.email, subscription, authLoading });
    
    if (!authLoading && !user) {
      console.log('No user found, redirecting to home');
      navigate('/');
      return;
    }
    
    // For now, allow users to access dashboard regardless of subscription status
    // You can uncomment this later when you want to enforce subscriptions
    /*
    if (!authLoading && !subscription?.subscribed) {
      console.log('User not subscribed, redirecting to pricing');
      navigate('/pricing');
      return;
    }
    */

    if (user) {
      fetchUserStats();
    }
  }, [user, subscription, authLoading, navigate]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      console.log('Fetching user stats for:', user.id);
      
      // Fetch resume count
      const { count: resumeCount } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch job searches count
      const { count: jobSearchCount } = await supabase
        .from('job_searches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch job matches count
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
        skillsIdentified: 0, // Will be calculated from extracted skills
        roadmapsGenerated: jobSearchCount || 0,
      });
      
      console.log('Stats updated:', { resumeCount, jobMatchCount, jobSearchCount });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
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
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      console.log('File uploaded, saving to database');

      // Save resume record to database
      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user!.id,
          file_name: file.name,
          file_url: data.publicUrl,
          extracted_skills: {},
          parsed_content: '',
        });

      if (dbError) {
        throw dbError;
      }

      setUploadedResume(file);
      toast({
        title: "Resume uploaded successfully!",
        description: "We'll analyze your resume and extract skills.",
      });

      // Refresh stats
      fetchUserStats();
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

        {/* Progress Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className={`border-2 ${uploadedResume ? 'border-green-500 bg-green-50' : 'border-primary'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {uploadedResume ? '✓ Completed' : 'Upload your LinkedIn resume'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Target className="w-4 h-4 mr-2" />
                Select Job Titles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Choose target roles</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Skill Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Get personalized roadmap</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <Download className="w-4 h-4 mr-2" />
                Get Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">Download optimized resumes</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resume Upload Section */}
          <Card className="h-fit">
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
                    {uploading ? 'Uploading...' : uploadedResume ? uploadedResume.name : 'Click to upload your resume'}
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
                  <p className="text-green-600 text-sm mt-1">Ready for AI analysis</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>Track your career enhancement journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Resumes Analyzed</span>
                  <span className="text-xl font-bold text-blue-600">{stats.resumesAnalyzed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Job Matches Found</span>
                  <span className="text-xl font-bold text-green-600">{stats.jobMatches}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium">Skills Identified</span>
                  <span className="text-xl font-bold text-purple-600">{stats.skillsIdentified}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium">Roadmaps Generated</span>
                  <span className="text-xl font-bold text-orange-600">{stats.roadmapsGenerated}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        {uploadedResume && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>Continue your career enhancement journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button className="flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Analyze Skills & Get Job Suggestions
                </Button>
                <Button variant="outline" className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Skill Gaps
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
