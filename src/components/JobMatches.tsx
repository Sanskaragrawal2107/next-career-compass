
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, DollarSign, Building, Star, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface JobRequirements {
  required_skills: string[];
  preferred_skills: string[];
  experience_years: number;
}

interface JobMatch {
  id: string;
  job_title: string;
  company_name: string | null;
  location: string | null;
  match_percentage: number | null;
  salary_range: string | null;
  job_description: string | null;
  job_url: string | null;
  requirements: JobRequirements | null;
}

const JobMatches = () => {
  const { user } = useAuth();
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobMatches();
  }, [user]);

  const fetchJobMatches = async () => {
    if (!user) return;

    try {
      console.log('Fetching job matches for user:', user.id);
      
      // Get the latest job search for this user
      const { data: jobSearches, error: searchError } = await supabase
        .from('job_searches')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (searchError) throw searchError;
      
      if (!jobSearches || jobSearches.length === 0) {
        console.log('No job searches found');
        setLoading(false);
        return;
      }

      const latestJobSearchId = jobSearches[0].id;
      console.log('Latest job search ID:', latestJobSearchId);

      // Get job matches for the latest search
      const { data: matches, error: matchError } = await supabase
        .from('job_matches')
        .select('*')
        .eq('job_search_id', latestJobSearchId)
        .order('match_percentage', { ascending: false });

      if (matchError) throw matchError;

      // Transform the data to match our interface
      const transformedMatches: JobMatch[] = (matches || []).map(match => ({
        id: match.id,
        job_title: match.job_title,
        company_name: match.company_name,
        location: match.location,
        match_percentage: match.match_percentage,
        salary_range: match.salary_range,
        job_description: match.job_description,
        job_url: match.job_url,
        requirements: match.requirements as JobRequirements | null
      }));

      console.log('Job matches fetched:', transformedMatches.length);
      setJobMatches(transformedMatches);
    } catch (error: any) {
      console.error('Error fetching job matches:', error);
      toast({
        title: "Failed to load job matches",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentage: number | null) => {
    if (!percentage) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
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
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (jobMatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Job Matches Yet</CardTitle>
          <CardDescription>
            Upload your resume and complete the analysis to see personalized job matches.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Matches</h2>
          <p className="text-gray-600">{jobMatches.length} opportunities found</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      <div className="grid gap-6">
        {jobMatches.map((job) => (
          <Card key={job.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl">{job.job_title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Building className="w-4 h-4 mr-1" />
                    {job.company_name || 'Company Name'}
                  </CardDescription>
                </div>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getMatchColor(job.match_percentage)}`}>
                  <Star className="w-3 h-3 inline mr-1" />
                  {job.match_percentage || 0}% match
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {job.location || 'Location not specified'}
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {job.salary_range || 'Salary not specified'}
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">
                {job.job_description || 'Job description not available'}
              </p>

              {job.requirements && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.requirements.required_skills?.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      )) || <span className="text-gray-500 text-sm">No requirements specified</span>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Preferred Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.requirements.preferred_skills?.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      )) || <span className="text-gray-500 text-sm">No preferences specified</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Optimized Resume
                </Button>
                <Button variant="outline" asChild>
                  <a href={job.job_url || '#'} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Job
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default JobMatches;
