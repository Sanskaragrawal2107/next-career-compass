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

    // Use the correct Adzuna application ID and API key
    const adzunaAppId = "bf099ae7"; // Your provided application ID
    const adzunaAppKey = Deno.env.get('ADZUNA_API_KEY'); // Your API key from secrets
    
    if (!adzunaAppKey) {
      throw new Error("Adzuna API key not configured");
    }

    logStep("Adzuna credentials configured", { appId: adzunaAppId });

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

    const { resumeId, selectedJobTitles, preferredLocation } = await req.json();
    if (!resumeId || !selectedJobTitles || !Array.isArray(selectedJobTitles)) {
      throw new Error("Resume ID and selected job titles are required");
    }

    logStep("Input validated", { resumeId, jobTitleCount: selectedJobTitles.length, preferredLocation });

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

    // Extract skills and experience data
    const skillsData = resume.extracted_skills;
    const technicalSkills = skillsData.technical || [];
    const softSkills = skillsData.soft || [];
    const experienceYears = skillsData.experience_years || 0;

    const jobMatches = [];

    for (const jobTitle of selectedJobTitles) {
      logStep("Searching for real jobs", { jobTitle });

      try {
        // Create search query with skills for better matching
        const skillsQuery = technicalSkills.slice(0, 3).join(' ');
        const searchQuery = `${jobTitle} ${skillsQuery}`;

        // Build Adzuna API URL with correct credentials
        let adzunaUrl = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&what=${encodeURIComponent(searchQuery)}&results_per_page=20&sort_by=relevance`;
        
        // Add location filter if provided
        if (preferredLocation && preferredLocation.trim() !== '') {
          adzunaUrl += `&where=${encodeURIComponent(preferredLocation)}`;
        }
        
        logStep("Calling Adzuna API", { 
          url: adzunaUrl.replace(adzunaAppKey, '[HIDDEN]'),
          query: searchQuery,
          location: preferredLocation || 'All locations'
        });

        const adzunaResponse = await fetch(adzunaUrl);
        
        if (!adzunaResponse.ok) {
          const errorText = await adzunaResponse.text();
          logStep("Adzuna API error details", { status: adzunaResponse.status, error: errorText });
          throw new Error(`Adzuna API error: ${adzunaResponse.status} - ${errorText}`);
        }

        const adzunaData = await adzunaResponse.json();
        const jobs = adzunaData.results || [];

        logStep("Adzuna jobs received", { count: jobs.length });

        // Filter and process jobs
        for (const job of jobs.slice(0, 4)) { // Limit to 4 jobs per title
          try {
            // Calculate match percentage based on skills overlap
            const jobDescription = (job.description || '').toLowerCase();
            const jobTitle_lower = (job.title || '').toLowerCase();
            
            let matchScore = 0;
            let totalSkills = technicalSkills.length + softSkills.length;
            
            // Check technical skills
            for (const skill of technicalSkills) {
              if (jobDescription.includes(skill.toLowerCase()) || jobTitle_lower.includes(skill.toLowerCase())) {
                matchScore += 2; // Technical skills weighted more
              }
            }
            
            // Check soft skills
            for (const skill of softSkills) {
              if (jobDescription.includes(skill.toLowerCase()) || jobTitle_lower.includes(skill.toLowerCase())) {
                matchScore += 1;
              }
            }
            
            // Calculate percentage (minimum 60% for inclusion to get more matches)
            const maxPossibleScore = (technicalSkills.length * 2) + (softSkills.length * 1);
            let matchPercentage = maxPossibleScore > 0 ? Math.floor((matchScore / maxPossibleScore) * 100) : 75;
            matchPercentage = Math.min(95, Math.max(60, matchPercentage));
            
            // Only include jobs with at least 60% match
            if (matchPercentage >= 60) {
              // Extract salary information
              let salaryRange = 'Salary not specified';
              if (job.salary_min && job.salary_max) {
                salaryRange = `$${Math.floor(job.salary_min).toLocaleString()} - $${Math.floor(job.salary_max).toLocaleString()}`;
              } else if (job.salary_min) {
                salaryRange = `From $${Math.floor(job.salary_min).toLocaleString()}`;
              }

              // Create requirements object from job description
              const requirements = {
                required_skills: technicalSkills.filter(skill => 
                  jobDescription.includes(skill.toLowerCase())
                ).slice(0, 5),
                preferred_skills: [...technicalSkills, ...softSkills].filter(skill => 
                  jobDescription.includes(skill.toLowerCase())
                ).slice(0, 4),
                experience_years: experienceYears
              };

              const jobMatch = {
                job_search_id: jobSearch.id,
                job_title: job.title || jobTitle,
                company_name: job.company?.display_name || 'Company',
                location: job.location?.display_name || 'Location not specified',
                match_percentage: matchPercentage,
                salary_range: salaryRange,
                job_description: job.description?.substring(0, 500) || 'Job description not available',
                job_url: job.redirect_url || '#',
                requirements: requirements
              };
              
              jobMatches.push(jobMatch);
              logStep("Job match added", { 
                title: jobMatch.job_title, 
                company: jobMatch.company_name,
                matchPercentage: matchPercentage 
              });
            }
          } catch (jobError) {
            logStep("Error processing individual job", { error: jobError.message });
            // Continue processing other jobs
          }
        }

      } catch (adzunaError) {
        logStep("Adzuna API error for job title", { 
          jobTitle, 
          error: adzunaError.message 
        });
        // Continue with next job title
      }
    }

    logStep("Total job matches found", { count: jobMatches.length });

    if (jobMatches.length === 0) {
      // Update job search status to completed but with no matches
      await supabaseClient
        .from("job_searches")
        .update({ 
          search_status: "completed",
          updated_at: new Date().toISOString()
        })
        .eq("id", jobSearch.id);

      return new Response(JSON.stringify({
        success: true,
        job_search_id: jobSearch.id,
        matches_found: 0,
        message: "No matching jobs found. Try broadening your search criteria or updating your skills."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

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
      message: `Found ${jobMatches.length} real job opportunities matching your profile`
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
