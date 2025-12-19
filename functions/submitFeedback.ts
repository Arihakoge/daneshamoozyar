import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

        const { data, error } = await resend.emails.send({
            from: 'Feedback System <onboarding@resend.dev>',
            to: ['daneshamoozyar.taklif@gmail.com'],
            subject: `[دانش‌آموز‌یار] ${typeLabel} جدید`,
            html: `
                <div dir="rtl" style="font-family: Tahoma, Arial; line-height: 1.6;">
                    <h2 style="color: #4f46e5;">📝 بازخورد جدید دریافت شد</h2>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>نوع بازخورد:</strong> <span style="color: #dc2626;">${typeLabel}</span></p>
                        <p><strong>فرستنده:</strong> ${user ? `${user.first_name || ''} ${user.last_name || ''} (${user.email || 'بدون ایمیل'})` : 'کاربر مهمان'}</p>
                        <p><strong>صفحه:</strong> ${pageUrl}</p>
                        <p><strong>زمان:</strong> ${new Date().toLocaleString('fa-IR')}</p>
                    </div>
                    <h3>متن پیام:</h3>
                    <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; background: #fff;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ success: true, data });
    } catch (e) {
        console.error('Function error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
});