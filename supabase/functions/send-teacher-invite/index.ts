import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  organization_id: string;
  organization_name: string;
  invite_link: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, organization_name, invite_link }: InviteRequest = await req.json();

    console.log(`Sending teacher invitation to ${email} for ${organization_name}`);

    const emailResponse = await resend.emails.send({
      from: "Klassrum <onboarding@resend.dev>",
      to: [email],
      subject: `Du är inbjuden till ${organization_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Du är inbjuden!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hej!
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Du har blivit inbjuden som lärare till <strong>${organization_name}</strong> på Klassrum.
            </p>
            <p style="font-size: 16px; margin-bottom: 30px;">
              Klicka på knappen nedan för att skapa ditt konto och börja använda tjänsten:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invite_link}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                Acceptera inbjudan
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Eller kopiera denna länk till din webbläsare:<br>
              <a href="${invite_link}" style="color: #6366f1; word-break: break-all;">${invite_link}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Denna inbjudan är giltig i 7 dagar.<br>
              Om du inte förväntade dig denna inbjudan kan du ignorera detta e-postmeddelande.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending teacher invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
