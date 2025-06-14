
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-JOB-MATCHES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    const { resumeId, selectedJobTitles } = await req.json();
    if (!resumeId || !selectedJobTitles || !Array.isArray(selectedJobTitles)) {
      throw new Error("Resume ID and selected job titles are required");
    }

    logStep("Input validated", { resumeId, jobTitleCount: selectedJobTitles.length });

    // Get the resume data with extracted skills
    const { data: resume, error: resumeError } = await supabaseClient
      .from("resumes")
      .select("extracted_skills, file_name")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      throw new Error("Resume not found or access denied");
    }

    if (!resume.extracted_skills) {
      throw new Error("Resume has not been analyzed yet. Please analyze the resume first.");
    }

    logStep("Resume data fetched", { 
      technicalSkills: resume.extracted_skills.technical?.length || 0,
      softSkills: resume.extracted_skills.soft?.length || 0,
      experienceYears: resume.extracted_skills.experience_years || 0
    });

    // Create job search record
    const { data: jobSearch, error: jobSearchError } = await supabaseClient
      .from("job_searches")
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        selected_job_titles: selectedJobTitles,
        search_status: "processing"
      })
      .select()
      .single();

    if (jobSearchError) throw new Error("Failed to create job search record");
    
    logStep("Job search created", { jobSearchId: jobSearch.id });

    // Generate personalized job matches using Gemini
    const skillsData = resume.extracted_skills;
    const technicalSkills = skillsData.technical || [];
    const softSkills = skillsData.soft || [];
    const experienceYears = skillsData.experience_years || 0;

    const jobMatches = [];

    for (const jobTitle of selectedJobTitles) {
      logStep("Generating matches for job title", { jobTitle });

      // Create a prompt for Gemini to generate realistic job matches
      const prompt = `Generate 3-4 realistic job postings for the position "${jobTitle}" that would be a good match for a candidate with the following profile:

Technical Skills: ${technicalSkills.join(', ')}
Soft Skills: ${softSkills.join(', ')}
Experience: ${experienceYears} years

For each job posting, provide a JSON object with the following structure:
{
  "company_name": "realistic company name",
  "location": "city, state or remote",
  "job_description": "detailed job description that matches the candidate's skills (2-3 sentences)",
  "salary_range": "realistic salary range for this role and experience level",
  "match_percentage": number between 75-95 (how well this job matches the candidate),
  "requirements": {
    "required_skills": [array of 3-5 required skills that overlap with candidate's skills],
    "preferred_skills": [array of 2-4 preferred skills],
    "experience_years": number (years of experience required)
  },
  "job_url": "https://careers.[company-name].com/jobs/[job-title-slug]"
}

Return an array of 3-4 such job objects. Make sure the jobs are realistic and the match percentages accurately reflect how well the candidate's skills align with the job requirements.`;

      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          }),
        });

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates[0].content.parts[0].text;
        
        logStep("Gemini response received", { responseLength: responseText.length });

        // Parse the JSON from Gemini response
        let generatedJobs = [];
        try {
          // Extract JSON from the response (handle markdown code blocks)
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\])/);
          let jsonText = responseText;
          if (jsonMatch) {
            jsonText = jsonMatch[1] || jsonMatch[2];
          }
          
          generatedJobs = JSON.parse(jsonText);
          
          if (!Array.isArray(generatedJobs)) {
            throw new Error("Expected array of jobs");
          }
        } catch (parseError) {
          logStep("Failed to parse Gemini response, using fallback", { error: parseError.message });
          // Fallback to a single realistic job if parsing fails
          generatedJobs = [{
            company_name: "TechCorp Solutions",
            location: "Remote",
            job_description: `We are seeking a talented ${jobTitle} to join our dynamic team. This role involves working with modern technologies including ${technicalSkills.slice(0, 3).join(', ')} and requires strong ${softSkills.slice(0, 2).join(' and ')} skills.`,
            salary_range: `$${Math.floor((experienceYears * 15 + 60))}k - $${Math.floor((experienceYears * 20 + 80))}k`,
            match_percentage: 85,
            requirements: {
              required_skills: technicalSkills.slice(0, 4),
              preferred_skills: technicalSkills.slice(4, 7),
              experience_years: Math.max(experienceYears - 1, 1)
            },
            job_url: `https://careers.techcorp.com/jobs/${jobTitle.toLowerCase().replace(/\s+/g, '-')}`
          }];
        }

        // Process each generated job and add to our matches
        for (const job of generatedJobs) {
          const jobMatch = {
            job_search_id: jobSearch.id,
            job_title: jobTitle,
            company_name: job.company_name || "Company Name",
            location: job.location || "Location TBD",
            match_percentage: Math.min(Math.max(job.match_percentage || 80, 75), 100),
            salary_range: job.salary_range || `$${Math.floor((experienceYears * 15 + 60))}k - $${Math.floor((experienceYears * 20 + 80))}k`,
            job_description: job.job_description || `Seeking a ${jobTitle} with relevant experience and skills.`,
            job_url: job.job_url || `https://careers.company.com/jobs/${jobTitle.replace(/\s+/g, '-').toLowerCase()}`,
            requirements: job.requirements || {
              required_skills: technicalSkills.slice(0, 3),
              preferred_skills: technicalSkills.slice(3, 6),
              experience_years: experienceYears
            }
          };
          
          jobMatches.push(jobMatch);
        }

      } catch (geminiError) {
        logStep("Gemini error, using fallback job", { error: geminiError.message });
        // Fallback job if Gemini fails
        const fallbackJob = {
          job_search_id: jobSearch.id,
          job_title: jobTitle,
          company_name: "Growing Tech Company",
          location: "Remote / Hybrid",
          match_percentage: 78,
          salary_range: `$${Math.floor((experienceYears * 15 + 60))}k - $${Math.floor((experienceYears * 20 + 80))}k`,
          job_description: `We are looking for a skilled ${jobTitle} to join our team. The ideal candidate should have experience with ${technicalSkills.slice(0, 3).join(', ')} and demonstrate strong ${softSkills.slice(0, 2).join(' and ')} abilities.`,
          job_url: `https://careers.company.com/jobs/${jobTitle.replace(/\s+/g, '-').toLowerCase()}`,
          requirements: {
            required_skills: technicalSkills.slice(0, Math.min(4, technicalSkills.length)),
            preferred_skills: technicalSkills.slice(4, Math.min(7, technicalSkills.length)),
            experience_years: Math.max(experienceYears - 1, 1)
          }
        };
        
        jobMatches.push(fallbackJob);
      }
    }

    logStep("Generated personalized job matches", { count: jobMatches.length });

    // Insert job matches into database
    const { error: insertError } = await supabaseClient
      .from("job_matches")
      .insert(jobMatches);

    if (insertError) throw new Error("Failed to insert job matches");

    // Update job search status
    const { error: updateError } = await supabaseClient
      .from("job_searches")
      .update({ 
        search_status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", jobSearch.id);

    if (updateError) throw new Error("Failed to update job search status");

    logStep("Job search completed successfully");

    return new Response(JSON.stringify({
      success: true,
      job_search_id: jobSearch.id,
      matches_found: jobMatches.length,
      message: "Personalized job matches generated successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
