
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
        resumeContent = "Unable to download PDF file. Please ensure the file was uploaded correctly.";
      } else {
        logStep("File downloaded successfully, extracting text");
        // Extract actual text from PDF
        resumeContent = await extractTextFromPDF(fileData);
        logStep("Text extraction completed", { contentLength: resumeContent.length });
      }
    } catch (downloadErr) {
      logStep("Download error, using fallback", { error: downloadErr });
      resumeContent = "Error downloading file. Please try uploading your resume again.";
    }

    logStep("Analyzing resume with Gemini");

    // Use Gemini to analyze the resume
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
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
            3. Years of experience (estimate based on work history and dates mentioned)
            4. Suggested job titles based on the skills and experience found
            
            Return the response in this exact JSON format:
            {
              "technical": ["skill1", "skill2", "skill3"],
              "soft": ["skill1", "skill2", "skill3"],
              "experience_years": number,
              "suggested_job_titles": ["title1", "title2", "title3"]
            }
            
            Be specific and accurate. Extract real skills from the resume content. If the content seems incomplete or corrupted, do your best to extract what you can find.
            
            Resume content: ${resumeContent}
            File name: ${resume.file_name}`
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const geminiData = await response.json();
    const analysisText = geminiData.candidates[0].content.parts[0].text;

    logStep("Gemini analysis completed", { analysisLength: analysisText.length });

    // Parse the AI response
    let extractedSkills;
    try {
      // Clean up the response text to extract JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : analysisText;
      extractedSkills = JSON.parse(jsonText);
      
      // Ensure the structure is correct
      if (!extractedSkills.technical) extractedSkills.technical = [];
      if (!extractedSkills.soft) extractedSkills.soft = [];
      if (!extractedSkills.experience_years) extractedSkills.experience_years = 0;
      if (!extractedSkills.suggested_job_titles) extractedSkills.suggested_job_titles = [];
      
    } catch (parseError) {
      logStep("Failed to parse AI response, using fallback", { error: parseError, rawResponse: analysisText });
      // Enhanced fallback - try to extract some basic info
      extractedSkills = {
        technical: [],
        soft: [],
        experience_years: 0,
        suggested_job_titles: ["Entry Level Position", "Professional", "Specialist"]
      };
    }

    logStep("Skills extracted", { 
      technicalCount: extractedSkills.technical?.length || 0,
      softCount: extractedSkills.soft?.length || 0,
      experienceYears: extractedSkills.experience_years || 0
    });

    // Update resume with extracted skills
    const { error: updateError } = await supabaseClient
      .from("resumes")
      .update({
        extracted_skills: extractedSkills,
        parsed_content: resumeContent.substring(0, 10000), // Store first 10k chars
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
