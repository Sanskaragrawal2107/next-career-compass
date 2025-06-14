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

// Function to extract text from PDF using a simple approach
async function extractTextFromPDF(fileData: Blob): Promise<string> {
  try {
    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to string and look for text content
    const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
    
    // Simple PDF text extraction - look for readable text patterns
    // This is a basic approach - in production you'd use a proper PDF library
    const textContent = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Remove non-printable chars except whitespace
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // If we found substantial text content, return it
    if (textContent.length > 100) {
      return textContent;
    }
    
    // Fallback: try to extract text using a different approach
    const lines = text.split('\n').filter(line => {
      const cleaned = line.trim();
      return cleaned.length > 3 && /[a-zA-Z]/.test(cleaned);
    });
    
    if (lines.length > 5) {
      return lines.join(' ').substring(0, 5000); // Limit to 5000 chars
    }
    
    return "Unable to extract readable text from PDF. Please ensure your PDF contains selectable text.";
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return "Error extracting text from PDF. Please try uploading the PDF again.";
  }
}

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
      .select("id, user_id, file_name, file_url, created_at, updated_at, extracted_skills, parsed_content") // Explicitly list columns
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      throw new Error(`Resume not found or access denied: ${resumeError?.message || 'No resume object'}`);
    }

    logStep("Resume found", { originalFileName: resume.file_name, fileUrl: resume.file_url });

    // Correctly extract the object path from the public file_url for download
    // Example file_url: https://<project-ref>.supabase.co/storage/v1/object/public/resumes/user-id/timestamp.pdf
    // We need "user-id/timestamp.pdf" for the download path
    const bucketName = "resumes"; // Assuming the bucket name is 'resumes'
    const urlParts = resume.file_url.split(`/storage/v1/object/public/${bucketName}/`);
    let objectPathForDownload = "";
    if (urlParts.length > 1) {
      objectPathForDownload = urlParts[1];
    } else {
      // Fallback or error if path extraction fails - though this shouldn't happen with valid URLs
      logStep("Error extracting object path from file_url", { fileUrl: resume.file_url });
      throw new Error("Could not determine file path for download from file_url.");
    }
    
    logStep("Attempting to download file", { objectPath: objectPathForDownload });

    let resumeContent = "";
    
    try {
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from(bucketName) // Use the bucket name variable
        .download(objectPathForDownload);

      if (downloadError) {
        logStep("Download failed, using fallback content", { error: downloadError.message, pathAttempted: objectPathForDownload });
        resumeContent = "Unable to download PDF file. Please ensure the file was uploaded correctly and is accessible.";
      } else if (!fileData) {
        logStep("Download returned no data, using fallback content", { pathAttempted: objectPathForDownload });
        resumeContent = "Downloaded PDF file is empty or unreadable.";
      }
      else {
        logStep("File downloaded successfully, extracting text");
        resumeContent = await extractTextFromPDF(fileData);
        logStep("Text extraction completed", { contentLength: resumeContent.length, first100Chars: resumeContent.substring(0, 100) });
      }
    } catch (downloadErr) {
      logStep("Download or extraction error, using fallback", { error: downloadErr.message || downloadErr });
      resumeContent = "Error processing resume file. Please try uploading your resume again.";
    }

    logStep("Analyzing resume with Gemini");

    // Use Gemini to analyze the resume
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert resume analyzer. Analyze the provided resume content and extract:
            1. Technical skills (programming languages, software, tools, technologies)
            2. Soft skills (communication, leadership, teamwork, etc.)
            3. Years of experience (estimate based on work history and dates mentioned, return 0 if not determinable)
            4. Suggested job titles based on the skills and experience found (return empty array if not determinable)
            
            Return the response in this exact JSON format:
            {
              "technical": ["skill1", "skill2", "skill3"],
              "soft": ["skill1", "skill2", "skill3"],
              "experience_years": number,
              "suggested_job_titles": ["title1", "title2", "title3"]
            }
            
            Be specific and accurate. Extract real skills from the resume content. 
            If the resume content is short, seems like an error message, or uninformative (e.g., "Unable to download PDF file"),
            return empty arrays for skills and job titles, and 0 for experience_years.
            Do not invent skills or experience if the input is not a real resume.
            
            Resume content: ${resumeContent}
            File name (for context, not analysis): ${resume.file_name}`
          }]
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

    logStep("Gemini analysis completed", { analysisLength: analysisText.length });

    let extractedSkills;
    try {
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/);
      let jsonText = analysisText;
      if (jsonMatch) {
        jsonText = jsonMatch[1] || jsonMatch[2]; // Use the content within ```json ... ``` or the direct object
      }
      
      extractedSkills = JSON.parse(jsonText);
      
      // Ensure the structure is correct and has defaults
      extractedSkills.technical = extractedSkills.technical || [];
      extractedSkills.soft = extractedSkills.soft || [];
      extractedSkills.experience_years = typeof extractedSkills.experience_years === 'number' ? extractedSkills.experience_years : 0;
      extractedSkills.suggested_job_titles = Array.isArray(extractedSkills.suggested_job_titles) ? extractedSkills.suggested_job_titles : [];
      
    } catch (parseError) {
      logStep("Failed to parse AI response, using fallback", { error: parseError.message, rawResponse: analysisText });
      extractedSkills = {
        technical: [],
        soft: [],
        experience_years: 0,
        suggested_job_titles: [] // Default to empty rather than generic titles
      };
    }

    logStep("Skills extracted", { 
      technicalCount: extractedSkills.technical.length,
      softCount: extractedSkills.soft.length,
      experienceYears: extractedSkills.experience_years,
      jobTitlesCount: extractedSkills.suggested_job_titles.length
    });

    const { error: updateError } = await supabaseClient
      .from("resumes")
      .update({
        extracted_skills: extractedSkills,
        parsed_content: resumeContent.substring(0, 10000),
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
