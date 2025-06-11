
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

    // Generate mock job matches for each selected job title
    const mockCompanies = ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Uber", "Airbnb", "Spotify", "Slack"];
    const mockLocations = ["San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Chicago, IL", "Remote"];

    const jobMatches = [];

    for (const jobTitle of selectedJobTitles) {
      // Generate 3-5 job matches per title
      const matchCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < matchCount; i++) {
        const company = mockCompanies[Math.floor(Math.random() * mockCompanies.length)];
        const location = mockLocations[Math.floor(Math.random() * mockLocations.length)];
        const matchPercentage = Math.floor(Math.random() * 30) + 70; // 70-100%
        
        const jobMatch = {
          job_search_id: jobSearch.id,
          job_title: jobTitle,
          company_name: company,
          location: location,
          match_percentage: matchPercentage,
          salary_range: `$${(Math.floor(Math.random() * 50) + 80)}k - $${(Math.floor(Math.random() * 50) + 120)}k`,
          job_description: `We are looking for a talented ${jobTitle} to join our team at ${company}. You will work on cutting-edge technologies and collaborate with world-class engineers.`,
          job_url: `https://careers.${company.toLowerCase()}.com/jobs/${jobTitle.replace(/\s+/g, '-').toLowerCase()}`,
          requirements: {
            required_skills: ["JavaScript", "React", "Node.js"],
            preferred_skills: ["TypeScript", "AWS", "Docker"],
            experience_years: Math.floor(Math.random() * 5) + 2
          }
        };
        
        jobMatches.push(jobMatch);
      }
    }

    logStep("Generated job matches", { count: jobMatches.length });

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
      message: "Job matches generated successfully"
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
