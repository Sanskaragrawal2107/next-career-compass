
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

// IMPORTANT: Set GEMINI_API_KEY in your Supabase project's secrets
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY secret');
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { interviewId } = await req.json()

    if (!interviewId) {
      return new Response(JSON.stringify({ error: 'Missing interviewId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 1. Fetch interview details and questions/answers
    const { data: interviewData, error: interviewError } = await supabaseAdmin
      .from('mock_interviews')
      .select('job_title, interview_type')
      .eq('id', interviewId)
      .single()

    if (interviewError) throw interviewError

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('interview_questions')
      .select('question_text, user_answer_text')
      .eq('interview_id', interviewId)
      .order('question_order', { ascending: true })

    if (questionsError) throw questionsError

    // 2. Construct prompt for Gemini
    const qaPairs = questions.map(q => `Q: ${q.question_text}\nA: ${q.user_answer_text || "No answer provided."}`).join('\n\n')

    const prompt = `
      You are an expert hiring manager evaluating a candidate's performance in a mock interview.
      Based on the following interview for a ${interviewData.job_title} (${interviewData.interview_type}) position, please provide a detailed evaluation.

      Interview Transcript:
      ---
      ${qaPairs}
      ---

      Your task is to:
      1. Provide an overall score from 0.0 to 5.0, where 3.5 is the threshold for a "hire" decision. The score should be a floating point number.
      2. Write a concise summary of the candidate's performance.
      3. List their key strengths as an array of strings.
      4. List their main areas for improvement as an array of strings.

      Provide your response as a valid JSON object with the following structure. Do NOT include any other text, comments, or markdown formatting.
      The entire response must be only the JSON object.
      {
        "overall_score": <float>,
        "feedback": {
          "summary": "<string>",
          "strengths": ["<string>", ...],
          "areas_for_improvement": ["<string>", ...]
        }
      }
    `

    // 3. Call Gemini API
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean and parse JSON more robustly
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini response:", text);
      throw new Error("No valid JSON object found in Gemini response.");
    }
    const jsonString = jsonMatch[0];
    let analysis;
    try {
      analysis = JSON.parse(jsonString)
    } catch (e) {
      console.error("Failed to parse JSON:", jsonString);
      throw new Error(`Failed to parse JSON from Gemini response. Details: ${e.message}`);
    }

    // 4. Update the mock_interviews table
    const { error: updateError } = await supabaseAdmin
      .from('mock_interviews')
      .update({
        overall_score: analysis.overall_score,
        feedback: analysis.feedback,
      })
      .eq('id', interviewId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, analysis }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Error analyzing interview performance:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
