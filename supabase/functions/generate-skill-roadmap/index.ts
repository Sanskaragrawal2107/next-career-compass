
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selectedJobTitles, userSkills, userId } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Generating roadmaps for:', selectedJobTitles);

    const roadmaps = [];

    for (const jobTitle of selectedJobTitles) {
      console.log('Processing job title:', jobTitle);

      const prompt = `
        As a career development expert, analyze the skill gap for someone wanting to become a ${jobTitle}.
        
        Current user skills:
        - Technical skills: ${userSkills.technical.join(', ')}
        - Soft skills: ${userSkills.soft.join(', ')}
        - Experience: ${userSkills.experience_years} years
        
        Create a comprehensive analysis with:
        1. Skill gaps (what skills are missing or need improvement)
        2. A detailed day-by-day learning roadmap to bridge these gaps
        
        Please respond with a valid JSON object in this exact format:
        {
          "skillGaps": [
            {
              "skill": "skill name",
              "importance": "high|medium|low",
              "currentLevel": "beginner|intermediate|advanced|none",
              "targetLevel": "intermediate|advanced|expert"
            }
          ],
          "roadmap": [
            {
              "day": 1,
              "title": "Day title",
              "description": "What this day focuses on",
              "tasks": ["Task 1", "Task 2", "Task 3"],
              "estimatedHours": 4
            }
          ],
          "totalDays": 30,
          "estimatedWeeks": 4
        }
        
        Make the roadmap practical and actionable. Include specific learning resources, practice exercises, and project ideas. Each day should have 3-5 concrete tasks that take 3-6 hours total. Focus on the most important skills first.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          }),
        }
      );

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid response from Gemini:', data);
        throw new Error('Invalid response from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      console.log('Generated text for', jobTitle, ':', generatedText.substring(0, 200));

      // Extract JSON from the response
      let roadmapData;
      try {
        // Try to find JSON in the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          roadmapData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        console.error('Raw response:', generatedText);
        
        // Fallback: create a basic roadmap structure
        roadmapData = {
          skillGaps: [
            {
              skill: "Role-specific skills",
              importance: "high",
              currentLevel: "intermediate",
              targetLevel: "advanced"
            }
          ],
          roadmap: [
            {
              day: 1,
              title: "Getting Started",
              description: "Begin your learning journey",
              tasks: ["Research the role requirements", "Assess current skills", "Set learning goals"],
              estimatedHours: 4
            }
          ],
          totalDays: 30,
          estimatedWeeks: 4
        };
      }

      roadmaps.push({
        jobTitle,
        skillGaps: roadmapData.skillGaps || [],
        roadmap: roadmapData.roadmap || [],
        totalDays: roadmapData.totalDays || 30,
        estimatedWeeks: roadmapData.estimatedWeeks || 4
      });

      // Store the roadmap in the database
      try {
        const { error: insertError } = await supabase
          .from('skill_roadmaps')
          .upsert({
            user_id: userId,
            job_title: jobTitle,
            skill_gaps: roadmapData.skillGaps,
            roadmap_data: roadmapData.roadmap,
            total_days: roadmapData.totalDays,
            estimated_weeks: roadmapData.estimatedWeeks,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error storing roadmap:', insertError);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        roadmaps,
        message: `Generated ${roadmaps.length} roadmap(s) successfully`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-skill-roadmap function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
