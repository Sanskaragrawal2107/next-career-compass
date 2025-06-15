
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import ResumePreview from '@/components/ResumePreview';

interface GeneratedResume {
  id: string;
  job_title: string | null;
  job_description: string | null;
  theme: string | null;
  optimized_content: string;
  created_at: string;
}

const GeneratedResumes = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<GeneratedResume | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGeneratedResumes();
    }
  }, [user]);

  const fetchGeneratedResumes = async () => {
    if (!user) return;

    try {
      console.log('Fetching generated resumes for user:', user.id);
      
      const { data: resumes, error } = await supabase
        .from('generated_resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Generated resumes fetched:', resumes?.length || 0);
      setResumes(resumes || []);
    } catch (error: any) {
      console.error('Error fetching generated resumes:', error);
      toast({
        title: "Failed to load resumes",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewResume = (resume: GeneratedResume) => {
    setSelectedResume(resume);
    setShowPreview(true);
  };

  const getThemeDisplayName = (theme: string | null) => {
    if (!theme) return 'Default';
    return theme.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            My Generated Resumes
          </CardTitle>
          <CardDescription>
            You haven't generated any resumes yet. Go to the Job Matches tab to create your first ATS-optimized resume.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            My Generated Resumes
          </h2>
          <p className="text-gray-600">{resumes.length} resumes generated</p>
        </div>
      </div>

      <div className="grid gap-4">
        {resumes.map((resume) => (
          <Card key={resume.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="w-4 h-4 mr-2 text-blue-600" />
                    {resume.job_title || 'Untitled Resume'}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Generated on {new Date(resume.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {getThemeDisplayName(resume.theme)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {resume.job_description && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  Optimized for: {resume.job_description.substring(0, 150)}...
                </p>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handlePreviewResume(resume)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handlePreviewResume(resume)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ResumePreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        resume={selectedResume}
      />
    </div>
  );
};

export default GeneratedResumes;
