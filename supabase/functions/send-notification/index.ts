import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'schedule_run' | 'threshold_alert';
  user_email: string;
  user_name?: string;
  data: {
    schedule_name?: string;
    zone_name?: string;
    schedule_type?: string;
    metric?: string;
    current_value?: number;
    threshold?: number;
    threshold_type?: 'min' | 'max';
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, user_email, user_name, data }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${user_email}`);

    let subject: string;
    let htmlContent: string;

    if (type === 'schedule_run') {
      subject = `🌱 Schedule "${data.schedule_name}" has started`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background: #0a0a0a; color: #fafafa; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: linear-gradient(135deg, #1a2e1a 0%, #0d1f0d 100%); border-radius: 16px; padding: 32px; border: 1px solid #22c55e33; }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .title { font-size: 20px; margin: 16px 0 8px; }
            .info { background: #0a0a0a; border-radius: 12px; padding: 16px; margin: 16px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #888; }
            .value { color: #22c55e; font-weight: 500; }
            .footer { text-align: center; margin-top: 24px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">🌿 GreenHouse Pro</div>
                <h1 class="title">Schedule Started</h1>
              </div>
              <p>Hello${user_name ? ` ${user_name}` : ''},</p>
              <p>Your scheduled ${data.schedule_type} task has started running:</p>
              <div class="info">
                <div class="info-row">
                  <span class="label">Schedule</span>
                  <span class="value">${data.schedule_name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Zone</span>
                  <span class="value">${data.zone_name || 'All Zones'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Type</span>
                  <span class="value">${data.schedule_type === 'irrigation' ? '💧 Irrigation' : '💡 Lighting'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Time</span>
                  <span class="value">${new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <p>Your greenhouse is being taken care of automatically! 🌱</p>
              <div class="footer">
                <p>GreenHouse Pro - Smart Greenhouse Management</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Threshold alert
      const isAbove = data.threshold_type === 'max';
      subject = `⚠️ Alert: ${data.metric} ${isAbove ? 'exceeded' : 'below'} threshold`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background: #0a0a0a; color: #fafafa; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: linear-gradient(135deg, #2e1a1a 0%, #1f0d0d 100%); border-radius: 16px; padding: 32px; border: 1px solid #ef444433; }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: bold; color: #22c55e; }
            .alert-badge { display: inline-block; background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .title { font-size: 20px; margin: 16px 0 8px; }
            .info { background: #0a0a0a; border-radius: 12px; padding: 16px; margin: 16px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #888; }
            .value { color: #ef4444; font-weight: 500; }
            .footer { text-align: center; margin-top: 24px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">🌿 GreenHouse Pro</div>
                <span class="alert-badge">⚠️ ALERT</span>
                <h1 class="title">Sensor Threshold ${isAbove ? 'Exceeded' : 'Below Minimum'}</h1>
              </div>
              <p>Hello${user_name ? ` ${user_name}` : ''},</p>
              <p>A sensor reading in your greenhouse has ${isAbove ? 'exceeded the maximum' : 'dropped below the minimum'} threshold:</p>
              <div class="info">
                <div class="info-row">
                  <span class="label">Metric</span>
                  <span class="value">${data.metric}</span>
                </div>
                <div class="info-row">
                  <span class="label">Current Value</span>
                  <span class="value">${data.current_value}</span>
                </div>
                <div class="info-row">
                  <span class="label">${isAbove ? 'Max Threshold' : 'Min Threshold'}</span>
                  <span class="value">${data.threshold}</span>
                </div>
                <div class="info-row">
                  <span class="label">Zone</span>
                  <span class="value">${data.zone_name || 'Main Greenhouse'}</span>
                </div>
              </div>
              <p>Please check your greenhouse controls and adjust settings if necessary.</p>
              <div class="footer">
                <p>GreenHouse Pro - Smart Greenhouse Management</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Use Resend API directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GreenHouse Pro <onboarding@resend.dev>",
        to: [user_email],
        subject,
        html: htmlContent,
      }),
    });

    const emailResponse = await response.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
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
