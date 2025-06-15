
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received request with body:', JSON.stringify(body, null, 2));

    const { 
      interviewId, 
      jobTitle, 
      interviewType = 'technical',
      previousQuestions = [],
      userAnswer = '',
      questionNumber = 1,
      userSkills = {}
    } = body;

    console.log('Generating interview question for:', { jobTitle, interviewType, questionNumber });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create context for AI based on previous questions and answers
    let context = `You are conducting a ${interviewType} interview for a ${jobTitle} position. `;
    
    if (userSkills.technical && userSkills.technical.length > 0) {
      context += `The candidate has experience with: ${userSkills.technical.join(', ')}. `;
    }

    if (questionNumber === 1) {
      context += `Generate the first question for this interview. Make it a good opening question that assesses their foundational knowledge.`;
    } else {
      context += `Previous questions and answers: ${previousQuestions.map((q: any, i: number) => 
        `Q${i + 1}: ${q.question} A${i + 1}: ${q.answer || 'No answer'}`
      ).join(' ')} `;
      
      if (userAnswer) {
        context += `The candidate just answered: "${userAnswer}". Generate a thoughtful follow-up question that builds on their response. If they mentioned specific technologies, concepts, or experiences, ask deeper questions about those. Be conversational and natural.`;
      } else {
        context += `Generate the next logical question for this interview.`;
      }
    }

    const prompt = `${context}

Requirements:
- Ask only ONE question
- Keep it concise and clear
- Make it appropriate for the experience level
- If this is a follow-up, reference their previous answer naturally
- Focus on practical knowledge and problem-solving
- Don't ask yes/no questions

Generate just the question text, nothing else:`;

    console.log("--- PROMPT START ---");
    console.log(prompt);
    console.log("--- PROMPT END ---");
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables.');
      throw new Error('Server configuration error: Missing API key.');
    }

    // Updated to use the correct Gemini model name
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        }
      }),
    });

    const responseText = await response.text();
    console.log('Gemini API response status:', response.status);
    console.log('Gemini API response text:', responseText);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response structure:', JSON.stringify(result, null, 2));
      throw new Error('Invalid response from Gemini API');
    }
    
    const questionText = result.candidates[0].content.parts[0].text.trim();

    console.log('Generated question:', questionText);

    // Save the question to database
    const { data: questionData, error: questionError } = await supabase
      .from('interview_questions')
      .insert({
        interview_id: interviewId,
        question_text: questionText,
        question_type: questionNumber === 1 ? 'opening' : 'follow_up',
        question_order: questionNumber,
        ai_follow_up_context: {
          previous_answer: userAnswer,
          context: context
        }
      })
      .select()
      .single();

    if (questionError) {
      console.error('Database error:', questionError);
      throw new Error(`Database error: ${questionError.message}`);
    }

    console.log('Successfully saved question to DB. ID:', questionData.id);

    return new Response(
      JSON.stringify({ 
        question: questionText,
        questionId: questionData.id,
        questionNumber: questionNumber
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Question generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
