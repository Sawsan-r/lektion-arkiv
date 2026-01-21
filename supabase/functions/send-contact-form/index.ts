import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Admin emails to receive notifications
const ADMIN_EMAILS = [
  "sawsan.soso.perates.46@gmail.com",
  "flashzook@gmail.com",
];

interface ContactFormRequest {
  name: string;
  email: string;
  organization?: string;
  role?: string;
  subject: string;
  message: string;
}

const subjectLabels: Record<string, string> = {
  interest: "Intresse för Notera",
  pilot: "Pilotprogrammet (Grundskola)",
  pro: "Skola Pro-förfrågan",
  demo: "Demo-förfrågan",
  support: "Teknisk support",
  other: "Övrigt",
};

const roleLabels: Record<string, string> = {
  teacher: "Lärare",
  principal: "Rektor",
  it: "IT-ansvarig",
  other: "Annan",
};

async function sendEmail(payload: {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Resend API error: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const data: ContactFormRequest = await req.json();
    const { name, email, organization, role, subject, message } = data;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const subjectLabel = subjectLabels[subject] || subject;
    const roleLabel = role ? (roleLabels[role] || role) : "Ej angiven";
    const organizationText = organization || "Ej angivet";

    console.log(`Processing contact form from ${name} (${email})`);

    // Send email to admins
    const adminEmailResult = await sendEmail({
      from: "Notera <onboarding@resend.dev>",
      to: ADMIN_EMAILS,
      reply_to: email,
      subject: `[Notera Kontakt] ${subjectLabel} från ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .field { margin-bottom: 16px; }
            .label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 0.5px; }
            .value { font-size: 16px; color: #111827; margin-top: 4px; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Nytt meddelande från kontaktformuläret</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Svara direkt på detta mail för att kontakta avsändaren.</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Namn</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">E-post</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              <div class="field">
                <div class="label">Organisation</div>
                <div class="value">${organizationText}</div>
              </div>
              <div class="field">
                <div class="label">Roll</div>
                <div class="value">${roleLabel}</div>
              </div>
              <div class="field">
                <div class="label">Ämne</div>
                <div class="value">${subjectLabel}</div>
              </div>
              <div class="message-box">
                <div class="label">Meddelande</div>
                <div class="value" style="white-space: pre-wrap;">${message}</div>
              </div>
            </div>
            <div class="footer">
              Detta meddelande skickades via Notera kontaktformulär
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin email sent:", adminEmailResult);

    // Send confirmation email to sender
    const confirmationResult = await sendEmail({
      from: "Notera <onboarding@resend.dev>",
      to: [email],
      subject: "Tack för ditt meddelande - Notera",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .summary { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0; }
            .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .summary-item:last-child { border-bottom: none; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Tack för ditt meddelande!</h1>
            </div>
            <div class="content">
              <p>Hej ${name}!</p>
              <p>Vi har mottagit ditt meddelande och återkommer så snart som möjligt, vanligtvis inom 24 timmar.</p>
              
              <div class="summary">
                <h3 style="margin-top: 0; color: #374151;">Ditt ärende</h3>
                <div class="summary-item">
                  <span style="color: #6b7280;">Ämne:</span>
                  <span style="font-weight: 500;">${subjectLabel}</span>
                </div>
                ${organization ? `
                <div class="summary-item">
                  <span style="color: #6b7280;">Organisation:</span>
                  <span style="font-weight: 500;">${organization}</span>
                </div>
                ` : ''}
              </div>

              <p>Om du har ytterligare frågor kan du svara direkt på detta mail.</p>
              
              <p style="margin-bottom: 0;">
                Med vänliga hälsningar,<br>
                <strong>Notera-teamet</strong>
              </p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Notera. Alla rättigheter förbehållna.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Confirmation email sent:", confirmationResult);

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-form function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
