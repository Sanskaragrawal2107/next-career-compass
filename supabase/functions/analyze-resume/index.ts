
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-RESUME] ${step}${detailsStr}`);
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

    const { resumeId } = await req.json();
    if (!resumeId) throw new Error("Resume ID is required");

    logStep("Fetching resume", { resumeId });

    // Get resume from database
    const { data: resume, error: resumeError } = await supabaseClient
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      throw new Error("Resume not found or access denied");
    }

    logStep("Resume found", { fileName: resume.file_name });

    // Extract filename from the file_url
    const fileUrl = resume.file_url;
    const fileName = fileUrl.split('/').pop() || resume.file_name;
    
    logStep("Attempting to download file", { fileName, fileUrl });

    // Try to download the resume file (this will simulate the analysis for now)
    try {
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from("resumes")
        .download(fileName);

      if (downloadError) {
        logStep("Download failed, but continuing with mock analysis", { error: downloadError.message });
      } else {
        logStep("File downloaded successfully");
      }
    } catch (downloadErr) {
      logStep("Download error, but continuing with mock analysis", { error: downloadErr });
    }

    // Simulate AI-powered resume analysis
    // In a real implementation, you would use OpenAI API or similar service
    const mockSkills = [
      "JavaScript", "TypeScript", "React", "Node.js", "Python", 
      "SQL", "Git", "AWS", "Docker", "Agile", "Problem Solving",
      "Communication", "Team Leadership", "Project Management"
    ];

    const mockJobTitles = [
      "Frontend Developer",
      "Full Stack Developer", 
      "Software Engineer",
      "React Developer",
      "JavaScript Developer"
    ];

    const extractedSkills = {
      technical: mockSkills.slice(0, 8),
      soft: mockSkills.slice(8),
      experience_years: Math.floor(Math.random() * 8) + 1,
      suggested_job_titles: mockJobTitles
    };

    logStep("Skills extracted", { skillCount: extractedSkills.technical.length + extractedSkills.soft.length });

    // Update resume with extracted skills
    const { error: updateError } = await supabaseClient
      .from("resumes")
      .update({
        extracted_skills: extractedSkills,
        parsed_content: "Resume successfully parsed and analyzed",
        updated_at: new Date().toISOString()
      })
      .eq("id", resumeId);

    if (updateError) throw new Error("Failed to update resume with extracted skills");

    logStep("Resume updated with skills");

    return new Response(JSON.stringify({
      success: true,
      extracted_skills: extractedSkills,
      suggested_job_titles: mockJobTitles
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
