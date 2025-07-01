
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ASSEMBLYAI_API_KEY = Deno.env.get('ASSEMBLYAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${ASSEMBLYAI_API_KEY}`,
      },
      body: JSON.stringify({ expires_in: 3600 }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Failed to get AssemblyAI token: ${errorBody.error}`);
    }

    const { token } = await response.json();

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
