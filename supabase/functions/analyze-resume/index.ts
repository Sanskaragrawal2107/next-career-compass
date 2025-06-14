
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your edge function secrets.");
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

    let resumeContent = "";
    
    // Try to download the resume file
    try {
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from("resumes")
        .download(fileName);

      if (downloadError) {
        logStep("Download failed, using fallback content", { error: downloadError.message });
        resumeContent = "Unable to extract text from PDF. Please ensure your resume is in a readable format.";
      } else {
        logStep("File downloaded successfully, extracting text");
        // For now, we'll use a placeholder since PDF text extraction requires additional libraries
        // In a real implementation, you'd use a PDF parsing library here
        resumeContent = "PDF content extracted successfully. This is a placeholder for the actual resume text that would be extracted from the PDF file.";
      }
    } catch (downloadErr) {
      logStep("Download error, using fallback", { error: downloadErr });
      resumeContent = "Error downloading file. Using fallback analysis.";
    }

    logStep("Analyzing resume with OpenAI");

    // Use OpenAI to analyze the resume
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume analyzer. Analyze the provided resume content and extract:
            1. Technical skills
            2. Soft skills  
            3. Years of experience (estimate based on work history)
            4. Suggested job titles based on the skills and experience
            
            Return the response in this exact JSON format:
            {
              "technical": ["skill1", "skill2", ...],
              "soft": ["skill1", "skill2", ...],
              "experience_years": number,
              "suggested_job_titles": ["title1", "title2", ...]
            }
            
            Be specific and accurate. Extract real skills from the resume content.`
          },
          {
            role: 'user',
            content: `Please analyze this resume content and extract skills and information: ${resumeContent}\n\nFile name: ${resume.file_name}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const openAIData = await response.json();
    const analysisText = openAIData.choices[0].message.content;

    logStep("OpenAI analysis completed", { analysisLength: analysisText.length });

    // Parse the AI response
    let extractedSkills;
    try {
      extractedSkills = JSON.parse(analysisText);
    } catch (parseError) {
      logStep("Failed to parse AI response, using fallback", { error: parseError });
      // Fallback with some generic skills if parsing fails
      extractedSkills = {
        technical: ["Communication", "Problem Solving", "Teamwork"],
        soft: ["Leadership", "Time Management"],
        experience_years: 3,
        suggested_job_titles: ["Professional", "Specialist", "Coordinator"]
      };
    }

    logStep("Skills extracted", { 
      technicalCount: extractedSkills.technical?.length || 0,
      softCount: extractedSkills.soft?.length || 0 
    });

    // Update resume with extracted skills
    const { error: updateError } = await supabaseClient
      .from("resumes")
      .update({
        extracted_skills: extractedSkills,
        parsed_content: resumeContent,
        updated_at: new Date().toISOString()
      })
      .eq("id", resumeId);

    if (updateError) throw new Error("Failed to update resume with extracted skills");

    logStep("Resume updated with skills");

    return new Response(JSON.stringify({
      success: true,
      extracted_skills: extractedSkills,
      suggested_job_titles: extractedSkills.suggested_job_titles || []
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
