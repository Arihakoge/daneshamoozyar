import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        let user = null;
        try {
            user = await base44.auth.me();
        } catch (e) {
            // User might not be logged in
        }
        
        const { type, message, pageUrl } = await req.json();

        // Translate type
        const typeLabels = {
            'bug': 'گزارش باگ',
            'suggestion': 'پیشنهاد',
            'criticism': 'انتقاد'
        };
        const typeLabel = typeLabels[type] || type;

        const subject = `[دانش‌آموز‌یار] ${typeLabel} جدید`;
        const body = `
            <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4f46e5;">بازخورد جدید دریافت شد</h2>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p><strong>نوع بازخورد:</strong> <span style="color: #d97706;">${typeLabel}</span></p>
                    <p><strong>فرستنده:</strong> ${user ? `${user.full_name || 'کاربر'} (${user.email || 'بدون ایمیل'})` : 'کاربر مهمان'}</p>
                    <p><strong>صفحه:</strong> ${pageUrl}</p>
                    <p><strong>زمان:</strong> ${new Date().toLocaleString('fa-IR')}</p>
                </div>
                <div style="margin-top: 20px;">
                    <h3 style="border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">متن پیام:</h3>
                    <p style="white-space: pre-wrap; background: #fff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">${message}</p>
                </div>
                <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #888; text-align: center;">ارسال شده توسط سیستم بازخورد دانش‌آموز‌یار</p>
            </div>
        `;

        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
            // Use Resend directly
            const sendEmail = async (to, subject, html) => {
                 const response = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${resendApiKey}`
                    },
                    body: JSON.stringify({
                        from: "noreply@daneshamoozyar.org", 
                        to,
                        subject,
                        html
                    })
                });
                return { response, data: await response.json() };
            };

            const targetEmail = 'daneshamoozyar.taklif@gmail.com';
            let { response, data } = await sendEmail(targetEmail, subject, body);

            // Handle Test Mode logic
            if (!response.ok && data.message && data.message.includes("only send testing emails to your own email address")) {
                const match = data.message.match(/\(([^)]+)\)/);
                const allowedEmail = match ? match[1] : null;
                if (allowedEmail) {
                    await sendEmail(allowedEmail, `[TEST MODE] ${subject}`, body + `<br/><br/>(Redirected from ${targetEmail} due to test mode)`);
                    return Response.json({ success: true, note: "Sent to test email" });
                }
            }
            
            if (!response.ok) {
                 throw new Error(data.message || "Failed to send email via Resend");
            }
            return Response.json({ success: true, provider: "resend" });

        } else {
            // Fallback to built-in integration
            const result = await base44.asServiceRole.integrations.Core.SendEmail({
                to: 'daneshamoozyar.taklif@gmail.com',
                subject: subject,
                body: body
            });
            return Response.json({ success: true, data: result, provider: "core" });
        }

    } catch (e) {
        console.error('Function error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
});