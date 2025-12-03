import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { assignment_id } = await req.json();

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

        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: "onboarding@resend.dev",
                to: user.email, // Send TO the teacher (ensures delivery in Test Mode)
                bcc: targetEmails, // BCC the students
                subject: `تکلیف جدید: ${assignment.title}`,
                html: `
                    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="background-color: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0;">📚 تکلیف جدید</h1>
                        </div>
                        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                            <p>دانش‌آموز عزیز،</p>
                            <p>یک تکلیف جدید در درس <strong>${assignment.subject}</strong> برای شما ثبت شده است.</p>
                            
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h3 style="margin-top: 0; color: #4B5563;">${assignment.title}</h3>
                                <p style="margin: 5px 0;"><strong>📅 مهلت تحویل:</strong> ${assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('fa-IR') : 'تعیین نشده'}</p>
                                <p style="margin: 5px 0;"><strong>🪙 پاداش:</strong> ${assignment.coins_reward} سکه</p>
                                <p style="margin: 5px 0;"><strong>📝 توضیحات:</strong></p>
                                <p style="background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">${assignment.description || 'توضیحات ندارد'}</p>
                            </div>

                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://app.base44.com" style="display: inline-block; background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                    مشاهده و انجام تکلیف
                                </a>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 20px; color: #9CA3AF; font-size: 12px;">
                            <p>این ایمیل به صورت خودکار ارسال شده است.</p>
                        </div>
                    </div>
                `
            })
        });

        const resendData = await emailResponse.json();

        if (!emailResponse.ok) {
            console.error("Resend Error:", resendData);
            // Don't throw, just return error to caller
            return Response.json({ error: 'Failed to send email', details: resendData }, { status: 500 });
        }

        return Response.json({ 
            success: true, 
            message: 'Emails sent successfully', 
            recipient_count: targetEmails.length,
            resend_id: resendData.id 
        });

    } catch (error) {
        console.error("Function Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});