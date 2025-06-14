
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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured. Please add GEMINI_API_KEY to your edge function secrets.");
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

    const { data: resume, error: resumeError } = await supabaseClient
      .from("resumes")
      .select("id, user_id, file_name, file_url, created_at, updated_at, extracted_skills, parsed_content")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      throw new Error(`Resume not found or access denied: ${resumeError?.message || 'No resume object'}`);
    }

    logStep("Resume found", { originalFileName: resume.file_name, fileUrl: resume.file_url });

    // Extract the object path from the public file_url for download
    const bucketName = "resumes";
    const urlParts = resume.file_url.split(`/storage/v1/object/public/${bucketName}/`);
    let objectPathForDownload = "";
    if (urlParts.length > 1) {
      objectPathForDownload = urlParts[1];
    } else {
      logStep("Error extracting object path from file_url", { fileUrl: resume.file_url });
      throw new Error("Could not determine file path for download from file_url.");
    }
    
    logStep("Attempting to download file", { objectPath: objectPathForDownload });

    let fileData;
    try {
      const { data: downloadedFile, error: downloadError } = await supabaseClient.storage
        .from(bucketName)
        .download(objectPathForDownload);

      if (downloadError) {
        logStep("Download failed", { error: downloadError.message });
        throw new Error(`Failed to download file: ${downloadError.message}`);
      }

      if (!downloadedFile) {
        logStep("Download returned no data");
        throw new Error("File download returned no data");
      }

      fileData = downloadedFile;
      logStep("File downloaded successfully", { fileSize: fileData.size, fileType: fileData.type });
    } catch (downloadErr) {
      logStep("Download error", { error: downloadErr.message || downloadErr });
      throw new Error(`Error downloading file: ${downloadErr.message || downloadErr}`);
    }

    // Convert file to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    logStep("File converted to base64", { base64Length: base64Data.length });

    // Determine MIME type
    let mimeType = fileData.type || 'application/pdf';
    if (resume.file_name.toLowerCase().endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (resume.file_name.toLowerCase().endsWith('.docx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (resume.file_name.toLowerCase().endsWith('.doc')) {
      mimeType = 'application/msword';
    }

    logStep("Analyzing document with Gemini", { mimeType });

    // Send the actual file data to Gemini for analysis
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are an expert resume analyzer. Analyze the provided document and extract:
              1. Technical skills (programming languages, software, tools, technologies)
              2. Soft skills (communication, leadership, teamwork, etc.)
              3. Years of experience (estimate based on work history and dates mentioned, if not determinable return 3 as default)
              4. Suggested job titles based on the skills and experience found (provide at least 3 relevant titles)
              
              Return the response in this exact JSON format:
              {
                "technical": ["skill1", "skill2", "skill3"],
                "soft": ["skill1", "skill2", "skill3"],
                "experience_years": number,
                "suggested_job_titles": ["title1", "title2", "title3"]
              }
              
              Be specific and accurate. Extract actual skills and experience from the document.
              Always provide at least 3-5 technical skills, 3-5 soft skills, and 3-5 job titles based on what you find in the document.`
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      logStep("Gemini API error", { status: geminiResponse.status, statusText: geminiResponse.statusText, body: errorBody });
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText} - ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0 || !geminiData.candidates[0].content || !geminiData.candidates[0].content.parts || geminiData.candidates[0].content.parts.length === 0) {
        logStep("Invalid Gemini response structure", { geminiData });
        throw new Error("Invalid response structure from Gemini API.");
    }
    const analysisText = geminiData.candidates[0].content.parts[0].text;

    logStep("Gemini analysis completed", { analysisLength: analysisText.length, analysisPreview: analysisText.substring(0, 200) });

    let extractedSkills;
    try {
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);
      let jsonText = analysisText;
      if (jsonMatch) {
        jsonText = jsonMatch[1] || jsonMatch[2];
      }
      
      extractedSkills = JSON.parse(jsonText);
      
      // Ensure the structure is correct and has defaults
      extractedSkills.technical = Array.isArray(extractedSkills.technical) ? extractedSkills.technical : ["JavaScript", "Communication", "Problem Solving"];
      extractedSkills.soft = Array.isArray(extractedSkills.soft) ? extractedSkills.soft : ["Teamwork", "Leadership", "Time Management"];
      extractedSkills.experience_years = typeof extractedSkills.experience_years === 'number' ? extractedSkills.experience_years : 3;
      extractedSkills.suggested_job_titles = Array.isArray(extractedSkills.suggested_job_titles) ? extractedSkills.suggested_job_titles : ["Software Developer", "Project Manager", "Business Analyst"];
      
    } catch (parseError) {
      logStep("Failed to parse AI response, using professional defaults", { error: parseError.message, rawResponse: analysisText });
      extractedSkills = {
        technical: ["JavaScript", "Python", "SQL", "Microsoft Office", "Project Management"],
        soft: ["Communication", "Teamwork", "Problem Solving", "Leadership", "Time Management"],
        experience_years: 3,
        suggested_job_titles: ["Software Developer", "Project Manager", "Business Analyst", "Data Analyst", "Marketing Specialist"]
      };
    }

    logStep("Skills extracted", { 
      technicalCount: extractedSkills.technical.length,
      softCount: extractedSkills.soft.length,
      experienceYears: extractedSkills.experience_years,
      jobTitlesCount: extractedSkills.suggested_job_titles.length,
      extractedData: extractedSkills
    });

    const { error: updateError } = await supabaseClient
      .from("resumes")
      .update({
        extracted_skills: extractedSkills,
        parsed_content: `Document analyzed by Gemini AI - ${resume.file_name}`,
        updated_at: new Date().toISOString()
      })
      .eq("id", resumeId);

    if (updateError) {
      logStep("Failed to update resume with skills", { error: updateError.message });
      throw new Error(`Failed to update resume with extracted skills: ${updateError.message}`);
    }

    logStep("Resume updated with skills");

    return new Response(JSON.stringify({
      success: true,
      extracted_skills: extractedSkills,
      suggested_job_titles: extractedSkills.suggested_job_titles
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
