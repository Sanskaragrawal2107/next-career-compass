
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Brain, Target, Loader2, CheckCircle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ResumeAnalysisProps {
  resumeId: string;
  onAnalysisComplete: () => void;
}

const ResumeAnalysis = ({ resumeId, onAnalysisComplete }: ResumeAnalysisProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState<any>(null);
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] = useState('');
  const [generatingMatches, setGeneratingMatches] = useState(false);

  const handleAnalyzeResume = async () => {
    setAnalyzing(true);
    try {
      console.log('Starting resume analysis...');
      
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeId }
      });

      if (error) throw error;

      if (data.success) {
        setExtractedSkills(data.extracted_skills);
        setAnalyzed(true);
        toast({
          title: "Resume analyzed successfully!",
          description: `Found ${data.extracted_skills.technical.length + data.extracted_skills.soft.length} skills and ${data.suggested_job_titles.length} job suggestions.`,
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze resume.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleJobTitleToggle = (jobTitle: string) => {
    setSelectedJobTitles(prev => 
      prev.includes(jobTitle) 
        ? prev.filter(t => t !== jobTitle)
        : [...prev, jobTitle]
    );
  };

  const handleGenerateMatches = async () => {
    if (selectedJobTitles.length === 0) {
      toast({
        title: "No job titles selected",
        description: "Please select at least one job title to generate matches.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingMatches(true);
    try {
      console.log('Generating job matches...');
      
      const { data, error } = await supabase.functions.invoke('generate-job-matches', {
        body: { 
          resumeId,
          selectedJobTitles,
          preferredLocation: preferredLocation.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Job matches generated!",
          description: `Found ${data.matches_found} job opportunities matching your profile.`,
        });
        onAnalysisComplete();
      } else {
        throw new Error(data.error || 'Match generation failed');
      }
    } catch (error: any) {
      console.error('Match generation error:', error);
      toast({
        title: "Match generation failed",
        description: error.message || "Failed to generate job matches.",
        variant: "destructive",
      });
    } finally {
      setGeneratingMatches(false);
    }
  };

  if (!analyzed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Resume Analysis
          </CardTitle>
          <CardDescription>
            Let our AI analyze your resume to extract skills and suggest relevant job titles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleAnalyzeResume} 
            disabled={analyzing}
            className="w-full"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze Resume with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skills Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Skills Extracted
          </CardTitle>
          <CardDescription>
            AI identified {extractedSkills.technical.length + extractedSkills.soft.length} skills from your resume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Technical Skills</h4>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.technical.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Soft Skills</h4>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.soft.map((skill: string, index: number) => (
                  <Badge key={index} variant="outline">{skill}</Badge>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Experience Level:</strong> {extractedSkills.experience_years} years
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Title Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Select Target Job Titles & Location
          </CardTitle>
          <CardDescription>
            Choose the job titles you're interested in and specify your preferred location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Location Input */}
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Preferred Location (optional)
              </label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., New York, NY or Remote"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Leave empty to search all locations
              </p>
            </div>

            {/* Job Titles */}
            <div className="space-y-3">
              <h4 className="font-medium">Job Titles</h4>
              {extractedSkills.suggested_job_titles.map((jobTitle: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`job-${index}`}
                    checked={selectedJobTitles.includes(jobTitle)}
                    onCheckedChange={() => handleJobTitleToggle(jobTitle)}
                  />
                  <label htmlFor={`job-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {jobTitle}
                  </label>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleGenerateMatches}
              disabled={generatingMatches || selectedJobTitles.length === 0}
              className="w-full mt-4"
            >
              {generatingMatches ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching Real Jobs...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Search Real Jobs ({selectedJobTitles.length} selected)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeAnalysis;
