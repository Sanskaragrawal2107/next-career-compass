
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Target, TrendingUp, Download, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, subscription } = useAuth();
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    if (!subscription?.subscribed) {
      navigate('/pricing');
      return;
    }
  }, [user, subscription, navigate]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedResume(file);
      toast({
        title: "Resume uploaded successfully!",
        description: "We'll analyze your resume and extract skills.",
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user || !subscription?.subscribed) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name || user.email}</h1>
            <p className="text-gray-600 mt-1">Let's boost your career with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Plan: <span className="font-semibold text-primary">{subscription.plan || 'Premium'}</span>
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
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {uploadedResume ? uploadedResume.name : 'Click to upload your resume'}
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

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>Track your career enhancement journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Resumes Analyzed</span>
                  <span className="text-xl font-bold text-blue-600">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Job Matches Found</span>
                  <span className="text-xl font-bold text-green-600">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium">Skills Identified</span>
                  <span className="text-xl font-bold text-purple-600">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium">Roadmaps Generated</span>
                  <span className="text-xl font-bold text-orange-600">0</span>
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
