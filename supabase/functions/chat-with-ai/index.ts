import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  
  if (!groqApiKey) {
    console.error('GROQ_API_KEY is not set');
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY is not configured' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { messages, conversationId } = await req.json();
    console.log('Received request:', { messages, conversationId });

    // Format messages for Groq API
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    console.log('Calling Groq API with messages:', formattedMessages);

    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2-70b-4096',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful customer service assistant. Be concise, professional, and friendly.'
          },
          ...formattedMessages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      throw new Error(`Groq API returned status ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    console.log('Groq API response:', data);

    if (!data.choices || !data.choices[0]?.message) {
      console.error('Invalid Groq API response structure:', data);
      throw new Error('Invalid response structure from Groq API');
    }

    const aiMessage = data.choices[0].message;

    // Store the AI response in Supabase
    if (conversationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase configuration');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: aiMessage.content,
          sender_type: 'company',
        });

      if (messageError) {
        console.error('Error storing message:', messageError);
        throw messageError;
      }

      const { error: conversationError } = await supabase
        .from('conversations')
        .update({
          last_message: aiMessage.content,
        })
        .eq('id', conversationId);

      if (conversationError) {
        console.error('Error updating conversation:', conversationError);
        throw conversationError;
      }
    }

    return new Response(
      JSON.stringify(aiMessage),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});