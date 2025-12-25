import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get Google Calendar Access Token
    let accessToken;
    try {
      accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    } catch (e) {
      return Response.json({ 
        error: 'Calendar not connected', 
        details: 'Please authorize Google Calendar first.',
        code: 'AUTH_REQUIRED'
      }, { status: 403 });
    }

    // 2. Fetch Assignments & Submissions
    // Robustly get grade and class from PublicProfile if missing on User
    let grade = user.grade;
    let classId = user.class_id;

    if (!grade) {
        const profiles = await base44.entities.PublicProfile.filter({ user_id: user.id });
        if (profiles.length > 0) {
            grade = profiles[0].grade;
            classId = profiles[0].class_id;
        }
    }

    // Get assignments for student's grade
    let assignments = [];
    if (grade) {
      const gradeAssignments = await base44.entities.Assignment.filter(
        { grade: grade, is_active: true }
      );
      // Filter by class if needed
      assignments = gradeAssignments.filter(a => 
        !a.class_id || (classId && a.class_id === classId)
      );
    }

    // Filter mainly for future or recent assignments (e.g. due in last 30 days or future)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    assignments = assignments.filter(a => {
      if (!a.due_date) return false;
      const due = new Date(a.due_date);
      return due > thirtyDaysAgo;
    });

    const assignmentIds = assignments.map(a => a.id);
    
    // Get submissions to check status/grades
    const submissions = await base44.entities.Submission.filter({ student_id: user.id });
    const submissionMap = {};
    submissions.forEach(s => submissionMap[s.assignment_id] = s);

    // Get existing tracked calendar events
    const trackedEvents = await base44.entities.CalendarEvent.filter({ user_id: user.id });
    const trackedMap = {}; // assignment_id -> event object
    trackedEvents.forEach(e => trackedMap[e.assignment_id] = e);

    let addedCount = 0;
    let updatedCount = 0;

    // 3. Sync Logic
    for (const assignment of assignments) {
      const submission = submissionMap[assignment.id];
      const tracked = trackedMap[assignment.id];

      // Determine status and description
      let statusText = "انجام نشده";
      let statusEmoji = "⬜";
      if (submission) {
        if (submission.status === 'graded') {
          statusText = `نمره: ${submission.score}/${assignment.max_score}`;
          statusEmoji = "✅";
        } else {
          statusText = "ارسال شده (در انتظار نمره)";
          statusEmoji = "elu";
        }
      } else if (new Date(assignment.due_date) < now) {
         statusText = "مهلت گذشته";
         statusEmoji = "⚠️";
      }

      const description = `
درس: ${assignment.subject}
وضعیت: ${statusText}
حداکثر نمره: ${assignment.max_score}
پاداش: ${assignment.coins_reward} سکه

توضیحات:
${assignment.description || '-'}
      `.trim();

      const title = `${statusEmoji} تکلیف: ${assignment.title}`;
      
      const dueDate = new Date(assignment.due_date);
      // Event time: 1 hour duration ending at due date
      const endTime = dueDate.toISOString();
      const startTime = new Date(dueDate.getTime() - 60 * 60 * 1000).toISOString();

      const eventResource = {
        summary: title,
        description: description,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }       // 1 hour before
          ]
        }
      };

      if (tracked) {
        // UPDATE existing event
        try {
          const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${tracked.google_event_id}`;
          const res = await fetch(url, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventResource)
          });

          if (res.ok) {
            updatedCount++;
            await base44.entities.CalendarEvent.update(tracked.id, { last_synced_at: new Date().toISOString() });
          } else {
             if (res.status === 404) {
               // Event deleted on calendar, re-create? or delete track?
               // Let's re-create
               const createRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(eventResource)
               });
               if (createRes.ok) {
                 const newEvent = await createRes.json();
                 await base44.entities.CalendarEvent.update(tracked.id, { 
                   google_event_id: newEvent.id,
                   last_synced_at: new Date().toISOString()
                 });
                 updatedCount++;
               }
             }
          }
        } catch (err) {
          console.error(`Failed to update event for ${assignment.id}`, err);
        }
      } else {
        // CREATE new event
        try {
          const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventResource)
          });

          if (res.ok) {
            const newEvent = await res.json();
            await base44.entities.CalendarEvent.create({
              user_id: user.id,
              assignment_id: assignment.id,
              google_event_id: newEvent.id,
              last_synced_at: new Date().toISOString()
            });
            addedCount++;
          }
        } catch (err) {
          console.error(`Failed to create event for ${assignment.id}`, err);
        }
      }
    }

    return Response.json({ success: true, added: addedCount, updated: updatedCount });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});