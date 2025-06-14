
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
        1. Skill gaps (what skills are missing or need improvement).
        2. A detailed day-by-day learning roadmap to bridge these gaps, covering approximately 30 days.
        
        Please respond with a valid JSON object in this exact format. The JSON object should be the *only* content in your response, without any surrounding text, explanations, or markdown formatting like \`\`\`json.
        {
          "skillGaps": [
            {
              "skill": "skill name",
              "importance": "high|medium|low",
              "currentLevel": "beginner|intermediate|advanced|none",
              "targetLevel": "intermediate|advanced|expert"
            }
          ],
          "roadmap": [ // This array MUST contain an object for each day of the roadmap, up to 'totalDays'.
            {
              "day": 1,
              "title": "Day 1 title",
              "description": "What this day focuses on",
              "tasks": ["Task 1.1", "Task 1.2", "Task 1.3"],
              "estimatedHours": 4
            },
            { // Example for Day 2 - continue this pattern for all days.
              "day": 2,
              "title": "Day 2 title",
              "description": "Focus of Day 2",
              "tasks": ["Task 2.1", "Task 2.2"],
              "estimatedHours": 3
            }
            // IMPORTANT: Do NOT include comments like this or ellipsis (...) in your actual JSON output. 
            // Generate all required day objects fully.
          ],
          "totalDays": 30, // Ensure this matches the number of day objects in the 'roadmap' array.
          "estimatedWeeks": 4 // Calculate based on totalDays.
        }
        
        Make the roadmap practical and actionable. The 'roadmap' array MUST contain an entry for each day.
        Each day should have 3-5 concrete tasks that take 3-6 hours total. Focus on the most important skills first.
        Do not include any comments (e.g., starting with //) or ellipsis (...) placeholders within the JSON output, especially in the 'roadmap' array. Generate the complete JSON.
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
              maxOutputTokens: 8192, // Increased to ensure space for a full 30-day roadmap
            }
          }),
        }
      );

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid response from Gemini:', data);
        throw new Error('Invalid response from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text.trim();
      console.log('Generated text for', jobTitle, ' (first 200 chars):', generatedText.substring(0, 200));

      let roadmapData;
      try {
        // Attempt to parse the entire generatedText as JSON, assuming it's purely JSON.
        roadmapData = JSON.parse(generatedText);
        if (!roadmapData.roadmap || roadmapData.roadmap.length === 0) {
          console.warn("Parsed JSON but roadmap array is empty or missing. Will use fallback.");
          throw new Error("Parsed JSON but roadmap array is empty or missing.");
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response as pure JSON:', parseError);
        console.error('Raw response that failed parsing:', generatedText);
        
        // Fallback: create a basic roadmap structure if parsing fails
        roadmapData = {
          skillGaps: [
            {
              skill: "Role-specific skills",
              importance: "high",
              currentLevel: "intermediate",
              targetLevel: "advanced"
            },
            {
              skill: "AI response parsing",
              importance: "high",
              currentLevel: "beginner",
              targetLevel: "intermediate"
            }
          ],
          roadmap: [
            {
              day: 1,
              title: "Getting Started & Troubleshooting",
              description: "Begin your learning journey and understand AI response issues.",
              tasks: ["Research the role requirements", "Assess current skills", "Review AI interaction logs for parsing errors", "Adjust AI prompt for clearer JSON output"],
              estimatedHours: 4
            }
          ],
          totalDays: 1, // Fallback to 1 day if generation fails
          estimatedWeeks: 1
        };
        toast({ // Using a toast-like structure for logs, actual toast won't work here.
          title: "Roadmap Fallback Used",
          description: `Failed to parse AI response for ${jobTitle}. Using a default 1-day roadmap.`,
          variant: "warning",
        });
      }

      roadmaps.push({
        jobTitle,
        skillGaps: roadmapData.skillGaps || [],
        roadmap: roadmapData.roadmap || [],
        totalDays: roadmapData.totalDays || (roadmapData.roadmap ? roadmapData.roadmap.length : 1),
        estimatedWeeks: roadmapData.estimatedWeeks || Math.ceil((roadmapData.roadmap ? roadmapData.roadmap.length : 1) / 7)
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
            // created_at will be set by default by the DB
          }, { onConflict: 'user_id, job_title' }); // Assuming user_id and job_title form a unique constraint for upsert

        if (insertError) {
          console.error('Error storing roadmap:', insertError);
          // Do not throw here, allow the function to return successfully with potentially a fallback roadmap
        }
      } catch (dbError) {
        console.error('Database error during roadmap storage:', dbError);
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

