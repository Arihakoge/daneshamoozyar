import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
    try {
        if (req.method !== "POST") {
             return new Response("Method not allowed", { status: 405 });
        }

        const base44 = createClientFromRequest(req);
        let user = null;
        try {
            user = await base44.auth.me();
        } catch (e) {
            // User might be guest
        }

        const { type, message, contact } = await req.json();

        if (!message) {
            return Response.json({ error: "Message is required" }, { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'Daneshamoozyar <onboarding@resend.dev>',
            to: ['daneshamoozyar.taklif@gmail.com'],
            subject: `گزارش جدید: ${type} - ${user ? user.full_name : 'مهمان'}`,
            html: `
                <div dir="rtl" style="font-family: Tahoma, Arial; text-align: right;">
                    <h2>گزارش جدید ثبت شد</h2>
                    <p><strong>نوع:</strong> ${type}</p>
                    <p><strong>کاربر:</strong> ${user ? `${user.full_name} (ID: ${user.id})` : 'مهمان'}</p>
                    <p><strong>اطلاعات تماس:</strong> ${contact || 'ندارد'}</p>
                    <hr />
                    <h3>متن پیام:</h3>
                    <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>
                    <hr />
                    <p>تاریخ: ${new Date().toLocaleString('fa-IR')}</p>
                </div>
            `
        });

        if (error) {
            console.error("Resend Error:", error);
            return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ success: true, data });
    } catch (error) {
        console.error("Function Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});