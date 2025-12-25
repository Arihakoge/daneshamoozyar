import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
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

        // 1. Save to Database (Reliability layer)
        // Using service role to ensure we can write even if user is guest or RLS is strict
        let savedRecord = null;
        try {
            savedRecord = await base44.asServiceRole.entities.Feedback.create({
                type,
                message,
                page_url: pageUrl,
                user_id: user ? user.id : null,
                user_info: user ? `${user.full_name || user.display_name || 'User'} (${user.email || 'No Email'})` : 'Guest',
                status: 'new'
            });
        } catch (dbError) {
            console.error("Database save failed:", dbError);
            // If DB fails, we still try to send email, but this is critical
            throw new Error("Failed to save feedback: " + dbError.message);
        }

        // 2. Send Email Notification
        const typeLabels = {
            'bug': 'گزارش باگ',
            'suggestion': 'پیشنهاد',
            'criticism': 'انتقاد'
        };
        const typeLabel = typeLabels[type] || type;

        const subject = `[دانش‌آموز‌یار] ${typeLabel} جدید`;
        const body = `
بازخورد جدید دریافت شد
شناسه: ${savedRecord ? savedRecord.id : 'N/A'}

نوع بازخورد: ${typeLabel}
فرستنده: ${user ? `${user.full_name || 'کاربر'} (${user.email || 'بدون ایمیل'})` : 'کاربر مهمان'}
صفحه: ${pageUrl}
زمان: ${new Date().toLocaleString('fa-IR')}

----------------------------------------
متن پیام:
${message}
----------------------------------------
        `;

        let emailSent = false;
        try {
            // Using built-in SendEmail integration
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: 'daneshamoozyar.taklif@gmail.com',
                subject: subject,
                body: body
            });
            emailSent = true;
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            // We don't fail the request if DB save was successful, but we notify frontend
        }

        return Response.json({ 
            success: true, 
            email_sent: emailSent,
            data: savedRecord 
        });

    } catch (e) {
        console.error('Function error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
});