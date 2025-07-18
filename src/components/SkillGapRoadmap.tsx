import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, Target, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface RoadmapDay {
  day: number;
  title: string;
  description: string;
  tasks: string[];
  estimatedHours: number;
  completed: boolean;
}

interface SkillGap {
  skill: string;
  importance: 'high' | 'medium' | 'low';
  currentLevel: string;
  targetLevel: string;
}

interface RoadmapData {
  jobTitle: string;
  skillGaps: SkillGap[];
  roadmap: RoadmapDay[];
  totalDays: number;
  estimatedWeeks: number;
}

interface SkillGapRoadmapProps {
  selectedJobTitles?: string[];
  userSkills?: {
    technical: string[];
    soft: string[];
    experience_years: number;
  };
}

const SkillGapRoadmap = ({ selectedJobTitles = [], userSkills }: SkillGapRoadmapProps) => {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState<RoadmapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeRoadmap, setActiveRoadmap] = useState<string>('');
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadExistingRoadmaps();
    }
  }, [user]);

  useEffect(() => {
    if (selectedJobTitles.length > 0 && userSkills && !initialLoading) {
      generateRoadmaps();
    }
  }, [selectedJobTitles, userSkills, initialLoading]);

  useEffect(() => {
    loadCompletedTasks();
  }, [user]);

  const loadExistingRoadmaps = async () => {
    if (!user) return;

    try {
      console.log('Loading existing roadmaps for user:', user.id);
      
      const { data: existingRoadmaps, error } = await supabase
        .from('skill_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (existingRoadmaps && existingRoadmaps.length > 0) {
        const formattedRoadmaps: RoadmapData[] = existingRoadmaps.map(roadmap => ({
          jobTitle: roadmap.job_title,
          skillGaps: Array.isArray(roadmap.skill_gaps) ? roadmap.skill_gaps as unknown as SkillGap[] : [],
          roadmap: Array.isArray(roadmap.roadmap_data) ? roadmap.roadmap_data as unknown as RoadmapDay[] : [],
          totalDays: roadmap.total_days || 30,
          estimatedWeeks: roadmap.estimated_weeks || 4
        }));

        setRoadmaps(formattedRoadmaps);
        if (formattedRoadmaps.length > 0) {
          setActiveRoadmap(formattedRoadmaps[0].jobTitle);
        }
        
        console.log('Loaded existing roadmaps:', formattedRoadmaps.length);
      }
    } catch (error) {
      console.error('Error loading existing roadmaps:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadCompletedTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('roadmap_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const completed: { [key: string]: boolean } = {};
      data?.forEach(item => {
        completed[`${item.job_title}_${item.day}_${item.task_index}`] = item.completed;
      });
      setCompletedTasks(completed);
    } catch (error) {
      console.error('Error loading completed tasks:', error);
    }
  };

  const generateRoadmaps = async () => {
    if (!userSkills) {
      toast({
        title: "Missing skills data",
        description: "Cannot generate roadmap without user skills. Please complete the AI Analysis.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setLoadingProgress(0);
    
    try {
      console.log('Generating roadmaps for job titles:', selectedJobTitles);
      
      // Show progress updates
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      const { data, error } = await supabase.functions.invoke('generate-skill-roadmap', {
        body: { 
          selectedJobTitles,
          userSkills,
          userId: user?.id
        }
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);

      if (error) throw error;

      if (data.success) {
        setRoadmaps(data.roadmaps);
        if (data.roadmaps.length > 0) {
          setActiveRoadmap(data.roadmaps[0].jobTitle);
        }
        toast({
          title: "Roadmaps ready!",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Roadmap generation failed');
      }
    } catch (error: any) {
      console.error('Roadmap generation error:', error);
      toast({
        title: "Roadmap generation failed",
        description: error.message || "Failed to generate skill roadmaps.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const toggleTaskCompletion = async (jobTitle: string, day: number, taskIndex: number) => {
    const taskKey = `${jobTitle}_${day}_${taskIndex}`;
    const newStatus = !completedTasks[taskKey];

    try {
      if (newStatus) {
        // Mark as completed
        const { error } = await supabase
          .from('roadmap_progress')
          .upsert({
            user_id: user?.id,
            job_title: jobTitle,
            day: day,
            task_index: taskIndex,
            completed: true,
            completed_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Mark as incomplete
        const { error } = await supabase
          .from('roadmap_progress')
          .delete()
          .eq('user_id', user?.id)
          .eq('job_title', jobTitle)
          .eq('day', day)
          .eq('task_index', taskIndex);

        if (error) throw error;
      }

      setCompletedTasks(prev => ({
        ...prev,
        [taskKey]: newStatus
      }));

      toast({
        title: newStatus ? "Task completed!" : "Task marked incomplete",
        description: newStatus ? "Great progress on your learning journey!" : "Task unmarked",
      });
    } catch (error: any) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error updating progress",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateProgress = (roadmap: RoadmapData) => {
    const totalTasks = roadmap.roadmap.reduce((sum, day) => sum + day.tasks.length, 0);
    const completedTasksCount = roadmap.roadmap.reduce((sum, day) => {
      return sum + day.tasks.filter((_, taskIndex) => 
        completedTasks[`${roadmap.jobTitle}_${day.day}_${taskIndex}`]
      ).length;
    }, 0);
    return totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading existing roadmaps...</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground mb-4">
            Analyzing skill gaps and generating personalized roadmaps...
          </p>
          <div className="max-w-md mx-auto">
            <Progress value={loadingProgress} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              {loadingProgress < 30 ? 'Analyzing your skills...' :
               loadingProgress < 60 ? 'Generating learning paths...' :
               loadingProgress < 90 ? 'Creating daily tasks...' :
               'Almost ready!'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (roadmaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Skill Gap Analysis & Roadmap
          </CardTitle>
          <CardDescription>
            Generate personalized learning roadmaps from the 'AI Analysis' tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once you complete an analysis for specific job titles, your roadmaps will appear here. Any previously generated roadmaps are also loaded automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeRoadmapData = roadmaps.find(r => r.jobTitle === activeRoadmap);

  return (
    <div className="space-y-6">
      {/* Roadmap Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Skill Gap Analysis & Learning Roadmaps
          </CardTitle>
          <CardDescription>
            Personalized day-by-day learning paths to bridge your skill gaps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {roadmaps.map((roadmap) => (
              <Button
                key={roadmap.jobTitle}
                variant={activeRoadmap === roadmap.jobTitle ? "default" : "outline"}
                onClick={() => setActiveRoadmap(roadmap.jobTitle)}
                className="mb-2"
              >
                {roadmap.jobTitle}
                <Badge variant="secondary" className="ml-2">
                  {Math.round(calculateProgress(roadmap))}%
                </Badge>
              </Button>
            ))}
          </div>
          <Button 
            onClick={generateRoadmaps} 
            variant="outline" 
            size="sm"
            disabled={loading || selectedJobTitles.length === 0 || !userSkills}
          >
            {!userSkills
              ? "Complete Analysis to Generate"
              : selectedJobTitles.length === 0
              ? 'Select Job Titles in Analysis'
              : 'Generate New/Update Roadmaps'}
          </Button>
        </CardContent>
      </Card>

      {activeRoadmapData && (
        <>
          {/* Skill Gaps Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Gaps for {activeRoadmapData.jobTitle}</CardTitle>
              <CardDescription>
                Areas identified for improvement based on job requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeRoadmapData.skillGaps.map((gap, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{gap.skill}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Current:</span>
                        <span className="text-muted-foreground">{gap.currentLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target:</span>
                        <span className="font-medium">{gap.targetLevel}</span>
                      </div>
                      <Badge 
                        variant={gap.importance === 'high' ? 'destructive' : gap.importance === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {gap.importance} priority
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round(calculateProgress(activeRoadmapData))}%</span>
                  </div>
                  <Progress value={calculateProgress(activeRoadmapData)} className="h-2" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{activeRoadmapData.totalDays}</div>
                    <div className="text-muted-foreground">Total Days</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{activeRoadmapData.estimatedWeeks}</div>
                    <div className="text-muted-foreground">Est. Weeks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">
                      {activeRoadmapData.roadmap.reduce((sum, day) => sum + day.tasks.length, 0)}
                    </div>
                    <div className="text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">
                      {Object.values(completedTasks).filter(Boolean).length}
                    </div>
                    <div className="text-muted-foreground">Completed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Roadmap */}
          <div className="space-y-4">
            {activeRoadmapData.roadmap.map((day) => {
              const dayCompletedTasks = day.tasks.filter((_, taskIndex) => 
                completedTasks[`${activeRoadmapData.jobTitle}_${day.day}_${taskIndex}`]
              ).length;
              const dayProgress = (dayCompletedTasks / day.tasks.length) * 100;
              
              return (
                <Card key={day.day} className={dayProgress === 100 ? "border-green-200 bg-green-50" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        {dayProgress === 100 ? (
                          <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        ) : (
                          <Calendar className="w-5 h-5 mr-2" />
                        )}
                        Day {day.day}: {day.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm text-muted-foreground">{day.estimatedHours}h</span>
                        <Badge variant="outline" className="text-xs">
                          {dayCompletedTasks}/{day.tasks.length} done
                        </Badge>
                      </div>
                    </CardTitle>
                    <CardDescription>{day.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {day.tasks.map((task, taskIndex) => {
                        const taskKey = `${activeRoadmapData.jobTitle}_${day.day}_${taskIndex}`;
                        const isCompleted = completedTasks[taskKey];
                        
                        return (
                          <div key={taskIndex} className="flex items-start space-x-3">
                            <Checkbox
                              id={taskKey}
                              checked={isCompleted}
                              onCheckedChange={() => toggleTaskCompletion(activeRoadmapData.jobTitle, day.day, taskIndex)}
                              className="mt-1"
                            />
                            <label 
                              htmlFor={taskKey} 
                              className={`text-sm leading-relaxed cursor-pointer ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {task}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    {dayProgress > 0 && dayProgress < 100 && (
                      <div className="mt-4">
                        <Progress value={dayProgress} className="h-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SkillGapRoadmap;
