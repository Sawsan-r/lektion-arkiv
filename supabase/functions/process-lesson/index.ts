import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to make Supabase REST API calls
async function supabaseQuery(url: string, options: RequestInit = {}) {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const response = await fetch(`${SUPABASE_URL}${url}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

async function supabaseStorageDownload(bucket: string, path: string): Promise<Blob> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Storage download error: ${response.status}`);
  }
  
  return response.blob();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestBody = await req.json();
  const { lessonId } = requestBody;

  try {
    if (!lessonId) {
      throw new Error("lessonId is required");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("OpenAI API key not configured");
    }

    // Get lesson details
    const lessons = await supabaseQuery(
      `/rest/v1/lessons?id=eq.${lessonId}&select=*,classes(name,teacher_id)`
    );
    
    const lesson = lessons[0];
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    console.log(`Processing lesson: ${lesson.title} (${lessonId})`);

    // Update status to processing
    await supabaseQuery(`/rest/v1/lessons?id=eq.${lessonId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "processing" }),
    });

    let transcription = "";

    // If we have an audio file, transcribe it with Whisper
    if (lesson.audio_url) {
      console.log("Downloading audio file:", lesson.audio_url);
      
      const audioData = await supabaseStorageDownload("lesson-audio", lesson.audio_url);
      console.log(`Audio file downloaded, size: ${audioData.size} bytes`);

      // Prepare form data for Whisper API
      const formData = new FormData();
      formData.append("file", audioData, "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("language", "sv");
      formData.append("response_format", "text");

      console.log("Sending to Whisper API for transcription...");

      const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text();
        console.error("Whisper API error:", whisperResponse.status, errorText);
        throw new Error(`Whisper API error: ${whisperResponse.status}`);
      }

      transcription = await whisperResponse.text();
      console.log(`Transcription received, length: ${transcription.length} characters`);
    } else {
      console.log("No audio file found, creating placeholder transcription");
      transcription = `[Ingen ljudfil tillgänglig för denna lektion. Titel: ${lesson.title}]`;
    }

    // Generate summary using GPT
    console.log("Generating summary with GPT...");
    
    const summaryResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Du är en pedagogisk AI-assistent som skapar sammanfattningar av skollektioner på svenska.

Dina sammanfattningar ska vara:
- Strukturerade med tydliga rubriker (använd ## för huvudrubriker och ### för underrubriker)
- Innehålla de viktigaste punkterna från lektionen
- Använda punktlistor för att göra informationen lättläst
- Anpassade för elever som vill repetera materialet
- Koncisa men informativa (300-500 ord)
- På svenska

Inkludera alltid:
1. En kort översikt av vad lektionen handlade om
2. De viktigaste begreppen/fakta som togs upp
3. Eventuella exempel som nämndes
4. Sammanfattande punkter att komma ihåg`
          },
          {
            role: "user",
            content: `Sammanfatta följande lektionstranskription för "${lesson.title}":

Ämne: ${lesson.subject || "Ej angivet"}
Klass: ${lesson.classes?.name || "Okänd klass"}

Transkription:
${transcription}

Skapa en välstrukturerad sammanfattning som hjälper eleverna förstå och repetera lektionens innehåll.`
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      console.error("GPT API error:", summaryResponse.status, errorText);
      throw new Error(`GPT API error: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices?.[0]?.message?.content || "Kunde inte skapa sammanfattning.";
    console.log("Summary complete, length:", summary.length);

    // Update lesson with transcription and summary
    await supabaseQuery(`/rest/v1/lessons?id=eq.${lessonId}`, {
      method: "PATCH",
      body: JSON.stringify({
        transcription,
        summary,
        status: "ready",
        updated_at: new Date().toISOString(),
      }),
    });

    console.log(`Lesson ${lessonId} processed successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lessonId,
        transcriptionLength: transcription.length,
        summaryLength: summary.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing lesson:", error);
    
    // Update lesson status to error
    try {
      if (lessonId) {
        await supabaseQuery(`/rest/v1/lessons?id=eq.${lessonId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "error" }),
        });
      }
    } catch (e) {
      console.error("Could not update lesson status:", e);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Okänt fel" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
