
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

    console.log('Checking for existing roadmaps for job titles:', selectedJobTitles);

    // Check if roadmaps already exist for these job titles
    const { data: existingRoadmaps, error: fetchError } = await supabase
      .from('skill_roadmaps')
      .select('*')
      .eq('user_id', userId)
      .in('job_title', selectedJobTitles);

    if (fetchError) {
      console.error('Error fetching existing roadmaps:', fetchError);
    }

    const existingJobTitles = existingRoadmaps?.map(r => r.job_title) || [];
    const jobTitlesToGenerate = selectedJobTitles.filter(title => !existingJobTitles.includes(title));
    
    console.log('Existing roadmaps found for:', existingJobTitles);
    console.log('Need to generate roadmaps for:', jobTitlesToGenerate);

    let generatedRoadmaps = [];

    // Generate roadmaps only for job titles that don't exist
    if (jobTitlesToGenerate.length > 0) {
      console.log('Generating new roadmaps for:', jobTitlesToGenerate);

      const roadmapPromises = jobTitlesToGenerate.map(async (jobTitle) => {
        console.log('Processing job title:', jobTitle);

        const prompt = `
          As a career development expert, analyze the skill gap for someone wanting to become a ${jobTitle}.
          
          Current user skills:
          - Technical skills: ${userSkills.technical.join(', ')}
          - Soft skills: ${userSkills.soft.join(', ')}
          - Experience: ${userSkills.experience_years} years
          
          Create a comprehensive analysis with:
          1. Skill gaps (what skills are missing or need improvement).
          2. A detailed day-by-day learning roadmap to bridge these gaps, covering exactly 30 days.
          
          CRITICAL: Your response must be ONLY a valid JSON object. Do not include any markdown formatting, explanations, or text outside the JSON. Do not wrap the JSON in \`\`\`json blocks. Start directly with { and end with }.
          
          The JSON format must be exactly:
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
                "title": "Day 1 title",
                "description": "What this day focuses on",
                "tasks": ["Task 1.1", "Task 1.2", "Task 1.3"],
                "estimatedHours": 4
              }
            ],
            "totalDays": 30,
            "estimatedWeeks": 4
          }
          
          IMPORTANT: 
          - Generate exactly 30 day objects in the roadmap array (day 1 through day 30)
          - Each day should have 3-5 concrete tasks that take 3-6 hours total
          - Focus on the most important skills first
          - Make the roadmap practical and actionable
          - Do not include any comments or placeholders in the JSON
          - Return ONLY the JSON object, nothing else
        `;

        try {
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

          let generatedText = data.candidates[0].content.parts[0].text.trim();
          console.log('Generated text for', jobTitle, ' (first 200 chars):', generatedText.substring(0, 200));

          // Clean the response - remove markdown formatting if present
          if (generatedText.startsWith('```json')) {
            generatedText = generatedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (generatedText.startsWith('```')) {
            generatedText = generatedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          let roadmapData;
          try {
            roadmapData = JSON.parse(generatedText);
            
            // Validate the roadmap structure
            if (!roadmapData.roadmap || !Array.isArray(roadmapData.roadmap)) {
              throw new Error("Invalid roadmap structure");
            }
            
            if (roadmapData.roadmap.length < 30) {
              console.warn(`Roadmap only has ${roadmapData.roadmap.length} days, expected 30`);
            }
            
          } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            console.error('Raw response that failed parsing:', generatedText);
            
            // Fallback: create a basic 30-day roadmap structure
            roadmapData = {
              skillGaps: [
                {
                  skill: "Role-specific skills for " + jobTitle,
                  importance: "high",
                  currentLevel: "intermediate",
                  targetLevel: "advanced"
                }
              ],
              roadmap: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                title: `Day ${i + 1}: Learning ${jobTitle} Skills`,
                description: `Focus on developing key skills for ${jobTitle} role.`,
                tasks: [
                  "Research industry best practices",
                  "Complete relevant online course modules",
                  "Practice hands-on exercises",
                  "Review and reflect on progress"
                ],
                estimatedHours: 4
              })),
              totalDays: 30,
              estimatedWeeks: 4
            };
            
            console.log("Using fallback roadmap structure");
          }

          // Store the roadmap in the database
          try {
            const { data: insertedRoadmap, error: insertError } = await supabase
              .from('skill_roadmaps')
              .insert({
                user_id: userId,
                job_title: jobTitle,
                skill_gaps: roadmapData.skillGaps,
                roadmap_data: roadmapData.roadmap,
                total_days: roadmapData.totalDays,
                estimated_weeks: roadmapData.estimatedWeeks,
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error storing roadmap:', insertError);
              throw insertError;
            }

            console.log('Successfully stored roadmap for', jobTitle);
            return {
              jobTitle,
              skillGaps: roadmapData.skillGaps || [],
              roadmap: roadmapData.roadmap || [],
              totalDays: roadmapData.totalDays || roadmapData.roadmap?.length || 30,
              estimatedWeeks: roadmapData.estimatedWeeks || Math.ceil((roadmapData.roadmap?.length || 30) / 7)
            };
          } catch (dbError) {
            console.error('Database error during roadmap storage:', dbError);
            throw dbError;
          }

        } catch (error) {
          console.error(`Error generating roadmap for ${jobTitle}:`, error);
          throw error;
        }
      });

      // Wait for all new roadmaps to be generated
      generatedRoadmaps = await Promise.all(roadmapPromises);
    }

    // Combine existing roadmaps with newly generated ones
    const existingRoadmapsFormatted = existingRoadmaps?.map(roadmap => ({
      jobTitle: roadmap.job_title,
      skillGaps: roadmap.skill_gaps || [],
      roadmap: roadmap.roadmap_data || [],
      totalDays: roadmap.total_days || 30,
      estimatedWeeks: roadmap.estimated_weeks || 4
    })) || [];

    const allRoadmaps = [...existingRoadmapsFormatted, ...generatedRoadmaps];

    return new Response(
      JSON.stringify({ 
        success: true, 
        roadmaps: allRoadmaps,
        message: `Loaded ${existingRoadmapsFormatted.length} existing and generated ${generatedRoadmaps.length} new roadmap(s)`
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
