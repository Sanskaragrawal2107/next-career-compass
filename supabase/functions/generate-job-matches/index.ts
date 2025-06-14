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

    const adzunaAppId = "bf099ae7"; 
    const adzunaAppKey = Deno.env.get('ADZUNA_API_KEY'); 
    
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

    const { data: jobSearch, error: jobSearchError } = await supabaseClient
      .from("job_searches")
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        selected_job_titles: selectedJobTitles,
        search_status: "processing",
        // Storing preferred_location in job_searches might be useful for future reference/filtering
        // preferred_location: preferredLocation 
      })
      .select()
      .single();

    if (jobSearchError) throw new Error("Failed to create job search record");
    
    logStep("Job search created", { jobSearchId: jobSearch.id });
    
    const skillsData = resume.extracted_skills;
    const technicalSkills = skillsData.technical || [];
    const softSkills = skillsData.soft || [];
    const experienceYears = skillsData.experience_years || 0;

    const jobMatches = [];

    // Determine Adzuna country code based on preferredLocation
    let adzunaCountry = 'us'; // Default to US
    const locationLowerCase = preferredLocation?.toLowerCase() || '';
    const indianCities = ["indore", "mumbai", "delhi", "bangalore", "pune", "hyderabad", "chennai", "kolkata", "india"];
    if (indianCities.some(city => locationLowerCase.includes(city))) {
      adzunaCountry = 'in'; // Switch to India
    }
    logStep("Determined Adzuna country", { country: adzunaCountry, preferredLocation });


    for (const jobTitle of selectedJobTitles) {
      logStep("Searching for real jobs", { jobTitle, country: adzunaCountry });

      try {
        const searchStrategies = [
          jobTitle,
          jobTitle.replace(/\s+/g, '+'),
          jobTitle.split(' ')[0],
          `${jobTitle} entry level`,
        ];

        let jobs = [];
        
        for (const searchQuery of searchStrategies) {
          let adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${adzunaCountry}/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&what=${encodeURIComponent(searchQuery)}&results_per_page=50&sort_by=relevance`;
          
          if (preferredLocation && preferredLocation.trim() !== '') {
            adzunaUrl += `&where=${encodeURIComponent(preferredLocation)}`;
          }
          
          logStep("Calling Adzuna API", { 
            strategy: searchQuery,
            url: adzunaUrl.replace(adzunaAppKey, '[HIDDEN]'), // Hide API key in logs
            location: preferredLocation || `All locations in ${adzunaCountry.toUpperCase()}`,
            country: adzunaCountry
          });

          const adzunaResponse = await fetch(adzunaUrl);
          
          if (!adzunaResponse.ok) {
            const errorText = await adzunaResponse.text();
            logStep("Adzuna API error details", { 
              status: adzunaResponse.status, 
              statusText: adzunaResponse.statusText,
              error: errorText,
              strategy: searchQuery,
              country: adzunaCountry
            });
            continue; 
          }

          const adzunaData = await adzunaResponse.json();
          const searchJobs = adzunaData.results || [];

          logStep("Adzuna jobs received", { 
            count: searchJobs.length,
            strategy: searchQuery,
            totalCount: adzunaData.count || 0,
            country: adzunaCountry
          });

          if (searchJobs.length > 0) {
            jobs = searchJobs;
            break; 
          }
        }

        if (jobs.length === 0) {
          const broadTerms = ['marketing', 'assistant', 'coordinator', 'specialist', 'manager'];
          const relevantTerm = broadTerms.find(term => 
            jobTitle.toLowerCase().includes(term)
          ) || 'entry level';

          let adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${adzunaCountry}/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&what=${encodeURIComponent(relevantTerm)}&results_per_page=50&sort_by=relevance`;
          
          if (preferredLocation && preferredLocation.trim() !== '') {
            adzunaUrl += `&where=${encodeURIComponent(preferredLocation)}`;
          }

          logStep("Trying broad search", { term: relevantTerm, country: adzunaCountry });

          const adzunaResponse = await fetch(adzunaUrl);
          if (adzunaResponse.ok) {
            const adzunaData = await adzunaResponse.json();
            jobs = adzunaData.results || [];
            logStep("Broad search results", { count: jobs.length, country: adzunaCountry });
          } else {
            const errorText = await adzunaResponse.text();
            logStep("Adzuna API error (broad search)", { 
              status: adzunaResponse.status, 
              statusText: adzunaResponse.statusText,
              error: errorText,
              country: adzunaCountry
            });
          }
        }

        for (const job of jobs.slice(0, 5)) { // Limit to 5 jobs per title
          try {
            // Calculate match percentage based on skills overlap
            const jobDescription = (job.description || '').toLowerCase();
            const jobTitle_lower = (job.title || '').toLowerCase();
            
            let matchScore = 0;
            
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
            
            const maxPossibleScore = (technicalSkills.length * 2) + (softSkills.length * 1);
            let matchPercentage = maxPossibleScore > 0 ? Math.floor((matchScore / maxPossibleScore) * 100) : 70; // Default to 70% if no skills
            
            matchPercentage = Math.min(95, Math.max(60, matchPercentage)); // Ensure 60-95% range
            
            let salaryRange = 'Salary not specified';
            if (job.salary_min && job.salary_max) {
              salaryRange = `$${Math.floor(job.salary_min).toLocaleString()} - $${Math.floor(job.salary_max).toLocaleString()}`;
            } else if (job.salary_min) {
              salaryRange = `From $${Math.floor(job.salary_min).toLocaleString()}`;
            } else if (job.salary_is_predicted === "1" && job.salary) { // Adzuna sometimes provides a single salary field
                salaryRange = `Around $${Math.floor(job.salary).toLocaleString()} (Predicted)`;
            }

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

          } catch (jobError) {
            logStep("Error processing individual job", { error: jobError.message });
          }
        }

      } catch (apiError) {
        logStep("API or processing error for job title", { 
          jobTitle, 
          error: apiError.message 
        });
      }
    }

    logStep("Total job matches found", { count: jobMatches.length });

    if (jobMatches.length === 0) {
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
        message: "No matching jobs found. Try broadening your search criteria, checking the location, or using different job titles."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { error: insertError } = await supabaseClient
      .from("job_matches")
      .insert(jobMatches);

    if (insertError) throw new Error(`Failed to insert job matches: ${insertError.message}`);

    const { error: updateError } = await supabaseClient
      .from("job_searches")
      .update({ 
        search_status: "completed",
        updated_at: new Date().toISOString()
      })
      .eq("id", jobSearch.id);

    if (updateError) throw new Error(`Failed to update job search status: ${updateError.message}`);

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
    
    // Attempt to update job search status to 'failed' if possible
    // This is a best-effort attempt and might not always succeed if jobSearch.id is not available
    // For example, if the error occurred before jobSearch was created.
    // A more robust solution would be to pass the jobSearchId to a final logging/cleanup step.
    // For now, this is a simple attempt.
    // if (jobSearch && jobSearch.id) { // Check if jobSearch and id exist
    //   try {
    //     await supabaseClient
    //       .from("job_searches")
    //       .update({ search_status: "failed", updated_at: new Date().toISOString() })
    //       .eq("id", jobSearch.id);
    //     logStep("Job search status updated to failed due to error");
    //   } catch (updateErr) {
    //     logStep("Error updating job search status to failed", { error: updateErr.message });
    //   }
    // }

    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, // Ensure status 500 for errors
    });
  }
});
