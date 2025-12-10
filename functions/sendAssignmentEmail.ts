import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { assignment_id, app_url } = await req.json();
        const origin = app_url || 'https://app.base44.com'; // Fallback if not provided

        // 1. Validate Auth
        const user = await base44.auth.me();
        if (!user || user.student_role !== 'teacher') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get Assignment Details
        const assignments = await base44.entities.Assignment.filter({ id: assignment_id });
        if (assignments.length === 0) {
            return Response.json({ error: 'Assignment not found' }, { status: 404 });
        }
        const assignment = assignments[0];

        // 3. Find Target Students
        const profileFilter = { 
            grade: assignment.grade,
            student_role: 'student'
        };
        if (assignment.class_id) {
            profileFilter.class_id = assignment.class_id;
        }

        const profiles = await base44.entities.PublicProfile.filter(profileFilter);
        
        if (profiles.length === 0) {
            return Response.json({ message: 'No students found for this assignment', count: 0 });
        }

        const studentUserIds = profiles.map(p => p.user_id);
        
        // Fetch users to get emails
        const allUsers = await base44.asServiceRole.entities.User.list();
        const targetEmails = allUsers
            .filter(u => studentUserIds.includes(u.id) && u.email)
            .map(u => u.email);

        if (targetEmails.length === 0) {
            return Response.json({ message: 'No valid email addresses found', count: 0 });
        }

        // 4. Send Email via Resend
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) {
            throw new Error("RESEND_API_KEY is not set");
        }

        // Professional HTML Template
        const emailBody = `
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Tahoma', 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                    .header { background: linear-gradient(to right, #8B5CF6, #6366f1); color: white; padding: 30px 20px; text-align: center; }
                    .content { padding: 30px; }
                    .card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                    .label { color: #6b7280; font-weight: 500; }
                    .value { color: #111827; font-weight: 700; }
                    .btn { display: inline-block; background-color: #8B5CF6; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; transition: background-color 0.2s; }
                    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0; font-size: 24px;">📚 تکلیف جدید ثبت شد</h1>
                    </div>
                    <div class="content">
                        <p style="font-size: 16px;">دانش‌آموز گرامی، سلام 👋</p>
                        <p>یک تکلیف جدید در درس <strong>${assignment.subject}</strong> برای شما تعریف شده است. لطفاً در اسرع وقت نسبت به انجام آن اقدام نمایید.</p>
                        
                        <div class="card">
                            <h3 style="margin-top: 0; color: #4B5563; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px; display: inline-block;">${assignment.title}</h3>
                            
                            <div class="info-row">
                                <span class="label">📅 مهلت تحویل:</span>
                                <span class="value">${assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('fa-IR') : 'تعیین نشده'}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">🪙 پاداش انجام:</span>
                                <span class="value">${assignment.coins_reward} سکه</span>
                            </div>
                            <div class="info-row" style="border: none;">
                                <span class="label">📝 توضیحات:</span>
                            </div>
                            <p style="background-color: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 5px; font-size: 14px;">
                                ${assignment.description || 'توضیحات تکمیلی ندارد.'}
                            </p>
                        </div>

                        <div style="text-align: center;">
                            <a href="${origin}/StudentAssignments" class="btn">
                                ورود به پنل و انجام تکلیف
                            </a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>این ایمیل به صورت خودکار از طرف سامانه آموزشی ارسال شده است.</p>
                        <p style="direction: ltr;">Sent with ❤️ by Base44</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const sendEmail = async (to, bcc, subject, html) => {
             const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                    from: "noreply@daneshamoozyar.org", 
                    to,
                    bcc,
                    subject,
                    html
                })
            });
            return { response, data: await response.json() };
        };

        // Attempt 1: Standard send
        // Note: "to" is usually for the primary recipient. For bulk notifications where we hide emails, 
        // we send 'to' the teacher (or a no-reply) and 'bcc' the students.
        let { response, data } = await sendEmail(user.email, targetEmails, `تکلیف جدید: ${assignment.title}`, emailBody);

        if (!response.ok) {
            // Handle Resend Test Mode Limitation (Retrying with permitted email for testing purposes)
            if (data.message && data.message.includes("only send testing emails to your own email address")) {
                console.log("Resend test limit detected. Retrying with allowed email.");
                
                const match = data.message.match(/\(([^)]+)\)/);
                const allowedEmail = match ? match[1] : null;

                if (allowedEmail) {
                    const testBody = `
                        <div style="background: #fff3cd; padding: 15px; border: 1px solid #ffeeba; color: #856404; margin-bottom: 20px; direction: ltr; text-align: left; font-family: sans-serif; border-radius: 8px;">
                            <strong>⚠️ هشدار حالت آزمایشی (Resend Test Mode):</strong><br/>
                            این ایمیل فقط به <u>${allowedEmail}</u> ارسال شد زیرا حساب Resend شما در حالت آزمایشی است و دامنه تأیید نشده است.<br/>
                            <br/>
                            <strong>برای ارسال واقعی به همه دانش‌آموزان:</strong><br/>
                            1. به پنل Resend بروید (Domains).<br/>
                            2. دامنه خود را اضافه و تأیید کنید (Verify Domain).<br/>
                            3. آدرس فرستنده (From) را در کد به ایمیل دامنه خود تغییر دهید.<br/>
                            <hr style="margin: 10px 0; border-color: #ffeeba;">
                            <strong>گیرندگان اصلی (که ایمیل را دریافت نکردند):</strong><br/> ${targetEmails.join(', ')}
                        </div>
                        ${emailBody}
                    `;
                    
                    const retry = await sendEmail(allowedEmail, undefined, `[TEST] تکلیف جدید: ${assignment.title}`, testBody);
                    
                    if (retry.response.ok) {
                        return Response.json({ 
                            success: true, 
                            message: 'Email sent to test address (Domain verification needed for production)', 
                            recipient_count: 1,
                            resend_id: retry.data.id,
                            note: "Redirected to allowed address due to Resend testing limitation"
                        });
                    } else {
                        data = retry.data;
                    }
                }
            }
            
            return Response.json({ error: 'Failed to send email', details: data }, { status: 500 });
        }

        return Response.json({ 
            success: true, 
            message: 'Emails sent successfully', 
            recipient_count: targetEmails.length,
            resend_id: data.id 
        });

    } catch (error) {
        console.error("Function Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});