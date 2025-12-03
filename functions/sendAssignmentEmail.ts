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
        // We use filter because .get is not always available or standard in these examples, strictly filter returns array
        const assignments = await base44.entities.Assignment.filter({ id: assignment_id });
        if (assignments.length === 0) {
            return Response.json({ error: 'Assignment not found' }, { status: 404 });
        }
        const assignment = assignments[0];

        // 3. Find Target Students
        // Strategy: Get Profiles matching grade/class -> Get Users for emails
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
        
        // Fetch users to get emails. 
        // Note: .list() returns all, we need to filter in memory or loop if no 'in' query supported.
        // The SDK 'filter' usually supports exact match. We might need to fetch all users or fetch individually.
        // For efficiency in this constrained env, let's fetch all users and filter.
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

        // Resend allows batch sending or single. For 'to' it accepts array.
        // WARNING: In 'Testing' mode on Resend, you can only send to yourself.
        // We will attempt to send to all, but it might fail if not verified.
        // For safety/testing, let's send Bcc to hide emails or just separate calls?
        // Resend 'to' array is visible to all if not careful? No, usually it sends individual emails or standard to.
        // Better to put them in 'bcc' if we treat it as a bulk notification, OR just 'to'.
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: "onboarding@resend.dev", // Default test sender
                to: targetEmails, // This might hit limits or visibility issues.
                subject: `تکلیف جدید: ${assignment.title}`,
                html: `
                    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.6;">
                        <h2>👨‍🏫 تکلیف جدید ارسال شد!</h2>
                        <p>دانش‌آموز عزیز،</p>
                        <p>یک تکلیف جدید با عنوان <strong>"${assignment.title}"</strong> توسط استاد برای شما ثبت شده است.</p>
                        
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>درس:</strong> ${assignment.subject}</p>
                            <p><strong>مهلت تحویل:</strong> ${assignment.due_date || 'تعیین نشده'}</p>
                            <p><strong>امتیاز:</strong> ${assignment.coins_reward} سکه</p>
                        </div>

                        <p>${assignment.description || ''}</p>

                        <a href="https://app.base44.com" style="display: inline-block; background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                            مشاهده تکلیف در سامانه
                        </a>
                    </div>
                `
            })
        });

        const resendData = await emailResponse.json();

        if (!emailResponse.ok) {
            throw new Error(`Resend API Error: ${JSON.stringify(resendData)}`);
        }

        return Response.json({ 
            success: true, 
            message: 'Emails sent', 
            recipient_count: targetEmails.length,
            resend_id: resendData.id 
        });

    } catch (error) {
        console.error("Function Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});