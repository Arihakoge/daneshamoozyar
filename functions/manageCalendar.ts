import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, assignment_id } = await req.json();

    if (!assignment_id) {
      return Response.json({ error: 'Assignment ID required' }, { status: 400 });
    }

    const assignment = await base44.entities.Assignment.get(assignment_id);
    if (!assignment) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Get submission if exists to enhance description
    let submission = null;
    const submissions = await base44.entities.Submission.filter({ 
      student_id: user.id, 
      assignment_id: assignment.id 
    });
    if (submissions.length > 0) submission = submissions[0];

    // Determine status text
    let statusText = "انجام نشده";
    let statusEmoji = "⬜";
    const now = new Date();
    
    if (submission) {
      if (submission.status === 'graded') {
        statusText = `نمره: ${submission.score}/${assignment.max_score}`;
        statusEmoji = "✅";
      } else {
        statusText = "ارسال شده";
        statusEmoji = "📤";
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

لینک تکلیف: ${req.headers.get('origin')}/StudentAssignments
    `.trim();

    const title = `${statusEmoji} تکلیف: ${assignment.title}`;
    const dueDate = new Date(assignment.due_date);
    // 1 hour duration ending at due date
    const endTime = dueDate.toISOString();
    const startTime = new Date(dueDate.getTime() - 60 * 60 * 1000).toISOString();

    if (action === 'sync_google') {
        let accessToken;
        try {
          accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
          if (!accessToken) throw new Error("No access token returned");
        } catch (e) {
          console.error("Calendar Auth Error:", e);
          return Response.json({ 
            error: 'Calendar not connected', 
            details: 'Please authorize Google Calendar first.',
            code: 'AUTH_REQUIRED'
          }, { status: 403 });
        }

        const eventResource = {
          summary: title,
          description: description,
          start: { dateTime: startTime },
          end: { dateTime: endTime },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 24 * 60 },
              { method: 'popup', minutes: 60 }
            ]
          }
        };

        // Check if already synced
        const trackedEvents = await base44.entities.CalendarEvent.filter({ 
          user_id: user.id, 
          assignment_id: assignment.id 
        });
        
        if (trackedEvents.length > 0) {
           const tracked = trackedEvents[0];
           // Update existing
           const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${tracked.google_event_id}`;
           const res = await fetch(url, {
             method: 'PATCH',
             headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
             body: JSON.stringify(eventResource)
           });
           
           if (res.ok) {
             await base44.entities.CalendarEvent.update(tracked.id, { last_synced_at: new Date().toISOString() });
             return Response.json({ success: true, action: 'updated' });
           } else if (res.status === 404) {
             // Re-create if deleted
             const createRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(eventResource)
             });
             if (createRes.ok) {
               const newEvent = await createRes.json();
               await base44.entities.CalendarEvent.update(tracked.id, { 
                 google_event_id: newEvent.id, 
                 last_synced_at: new Date().toISOString() 
               });
               return Response.json({ success: true, action: 're-created' });
             }
           }
           return Response.json({ error: 'Failed to update event' }, { status: 500 });
        } else {
           // Create new
           const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
           const res = await fetch(url, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
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
             return Response.json({ success: true, action: 'created' });
           }
           return Response.json({ error: 'Failed to create event' }, { status: 500 });
        }

    } else if (action === 'get_ics') {
        // Generate ICS content
        const formatDate = (dateStr) => dateStr.replace(/[-:]/g, '').split('.')[0] + 'Z';
        const nowStr = formatDate(new Date().toISOString());
        const startStr = formatDate(startTime);
        const endStr = formatDate(endTime);
        const uid = `assignment-${assignment.id}@daneshamoozyar`;

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Daneshamoozyar//Education Platform//FA
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${nowStr}
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, '\\n')}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

        return Response.json({ success: true, ics_content: icsContent });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});