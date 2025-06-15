
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { jobMatchId, theme, userId } = await req.json()

    if (!jobMatchId || !theme || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch job match details
    const { data: jobMatch, error: jobError } = await supabaseClient
      .from('job_matches')
      .select('*')
      .eq('id', jobMatchId)
      .single()

    if (jobError) throw jobError

    // Fetch user's latest resume and skills
    const { data: resume, error: resumeError } = await supabaseClient
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (resumeError) throw resumeError

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Generate optimized resume using Gemini AI
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const prompt = `
    Generate an ATS-friendly resume optimized for this job posting. Use the provided theme format and tailor the content to match job requirements.

    THEME: ${theme}
    
    JOB DETAILS:
    - Title: ${jobMatch.job_title}
    - Company: ${jobMatch.company_name || 'Not specified'}
    - Description: ${jobMatch.job_description || 'Not specified'}
    - Requirements: ${JSON.stringify(jobMatch.requirements || {})}
    
    USER PROFILE:
    - Name: ${profile.full_name || 'Professional Name'}
    - Email: ${profile.email}
    
    USER SKILLS & EXPERIENCE:
    ${JSON.stringify(resume.extracted_skills || {})}
    
    PARSED RESUME CONTENT:
    ${resume.parsed_content || 'No content available'}

    Instructions:
    1. Create an ATS-optimized resume that matches the job requirements
    2. Use keywords from the job description naturally throughout
    3. Prioritize skills that match the job requirements
    4. Rewrite experience bullets to align with the target role
    5. Keep formatting clean and ATS-scannable
    6. Use action verbs and quantify achievements where possible
    7. Ensure the content flows naturally and doesn't feel keyword-stuffed
    
    Return ONLY the resume content in HTML format with appropriate styling for the ${theme} theme.
    Use professional formatting with clear sections: Contact, Summary, Skills, Experience, Education.
    `

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.statusText}`)
    }

    const geminiData = await geminiResponse.json()
    const optimizedContent = geminiData.candidates[0]?.content?.parts[0]?.text

    if (!optimizedContent) {
      throw new Error('Failed to generate resume content')
    }

    // Save the generated resume to database
    const { data: generatedResume, error: saveError } = await supabaseClient
      .from('generated_resumes')
      .insert({
        user_id: userId,
        job_match_id: jobMatchId,
        job_title: jobMatch.job_title,
        job_description: jobMatch.job_description,
        theme: theme,
        optimized_content: optimizedContent
      })
      .select()
      .single()

    if (saveError) throw saveError

    return new Response(
      JSON.stringify({ 
        success: true, 
        resume: generatedResume,
        content: optimizedContent 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating optimized resume:', error)
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
