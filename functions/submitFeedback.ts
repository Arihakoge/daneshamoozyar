import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

        // Translate type
        const typeLabels = {
            'bug': 'گزارش باگ',
            'suggestion': 'پیشنهاد',
            'criticism': 'انتقاد'
        };
        const typeLabel = typeLabels[type] || type;

        const subject = `[دانش‌آموز‌یار] ${typeLabel} جدید`;
        const body = `
بازخورد جدید دریافت شد

نوع بازخورد: ${typeLabel}
فرستنده: ${user ? `${user.full_name || 'کاربر'} (${user.email || 'بدون ایمیل'})` : 'کاربر مهمان'}
صفحه: ${pageUrl}
زمان: ${new Date().toLocaleString('fa-IR')}

----------------------------------------
متن پیام:
${message}
----------------------------------------
        `;

        // Using built-in SendEmail integration
        const result = await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'daneshamoozyar.taklif@gmail.com',
            subject: subject,
            body: body
        });

        return Response.json({ success: true, data: result });
    } catch (e) {
        console.error('Function error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
});