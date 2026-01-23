import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

// Convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 32768;
  
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
    binary += String.fromCharCode(...chunk);
  }
  
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate the caller is authenticated
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.error("No authorization header provided");
    return new Response(
      JSON.stringify({ error: "Unauthorized - no token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create a client to verify identity
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // Verify the token by passing it directly to getUser
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    console.error("Invalid token:", userError?.message || "No user found");
    return new Response(
      JSON.stringify({ error: "Unauthorized - invalid token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`Processing request from user: ${user.id}`);

  const requestBody = await req.json();
  const { lessonId } = requestBody;

  try {
    if (!lessonId) {
      throw new Error("lessonId is required");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("Gemini API key not configured");
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
    let summary = "";

    // If we have an audio file, process it with Gemini
    if (lesson.audio_url) {
      console.log("Downloading audio file:", lesson.audio_url);
      
      const audioData = await supabaseStorageDownload("lesson-audio", lesson.audio_url);
      console.log(`Audio file downloaded, size: ${audioData.size} bytes`);

      // Convert to base64 for Gemini API
      const base64Audio = await blobToBase64(audioData);
      console.log(`Audio converted to base64, length: ${base64Audio.length} characters`);

      // Determine mime type (webm is common for browser recordings)
      const mimeType = "audio/webm";

      console.log("Sending to Gemini API for transcription and summarization...");

      // Single Gemini call for BOTH transcription and summary
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Audio,
                  },
                },
                {
                  text: `Du är en transkriptions- och sammanfattningsassistent. Din uppgift är att ENDAST återge vad som faktiskt sades i inspelningen - lägg INTE till egen information, förklaringar eller antaganden.

UPPGIFT 1 - TRANSKRIPTION:
Skapa en ordagrann transkription av allt som sägs i inspelningen.
- Skriv transkriptionen på SAMMA SPRÅK som talades i inspelningen (om det är engelska, skriv på engelska; om det är svenska, skriv på svenska)
- Inkludera INGA tidsstämplar (som "Minut 1:" eller "[00:01]") i transkriptionen
- Skriv sammanhängande text utan tidsmarkeringar

UPPGIFT 2 - SAMMANFATTNING:
Skapa en strukturerad sammanfattning som ENDAST innehåller information som faktiskt nämndes i inspelningen.
- Skriv sammanfattningen på SAMMA SPRÅK som talades i inspelningen

VIKTIGA REGLER:
- Sammanfatta BARA det som sades - lägg inte till egen kunskap
- Gör INGA antaganden om vad läraren "menade"
- Lägg INTE till förklaringar eller kontext som inte nämndes
- Om något är oklart i inspelningen, skriv att det var oklart istället för att gissa
- Var en trogen spegel av lektionens innehåll
- Hitta INTE på exempel eller fakta som inte sades
- INGEN tidsstämplar i output

Sammanfattningens format:
- Använd tydliga rubriker (## för huvudrubriker)
- Använd punktlistor för att göra det lättläst
- Håll sammanfattningen koncis (200-400 ord)

Lektionsinformation:
- Titel: ${lesson.title}
- Ämne: ${lesson.subject || "Ej angivet"}
- Klass: ${lesson.classes?.name || "Okänd klass"}

SVARA I FÖLJANDE FORMAT:
---TRANSKRIPTION---
[Ordagrann transkription här, på samma språk som inspelningen, UTAN tidsstämplar]

---SAMMANFATTNING---
[Sammanfattning av ENDAST det som sades, på samma språk som inspelningen]`,
                },
              ],
            }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.3,
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error("Gemini API error:", geminiResponse.status, errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }

      const geminiData = await geminiResponse.json();
      console.log("Gemini response received");

      const fullResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (!fullResponse) {
        console.error("Empty response from Gemini:", JSON.stringify(geminiData));
        throw new Error("Empty response from Gemini API");
      }

      // Parse the response to extract transcription and summary
      const transcriptionMatch = fullResponse.match(/---TRANSKRIPTION---\s*([\s\S]*?)(?=---SAMMANFATTNING---|$)/);
      const summaryMatch = fullResponse.match(/---SAMMANFATTNING---\s*([\s\S]*?)$/);
      
      transcription = transcriptionMatch?.[1]?.trim() || fullResponse;
      summary = summaryMatch?.[1]?.trim() || "Kunde inte skapa sammanfattning.";
      
      console.log(`Transcription received, length: ${transcription.length} characters`);
      console.log(`Summary received, length: ${summary.length} characters`);
    } else {
      console.log("No audio file found, creating placeholder");
      transcription = `[Ingen ljudfil tillgänglig för denna lektion. Titel: ${lesson.title}]`;
      summary = "Ingen sammanfattning tillgänglig - ljudfil saknas.";
    }

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
