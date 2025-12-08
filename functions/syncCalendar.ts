import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export const syncCalendar = async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we can get the token (user has authorized)
    let accessToken;
    try {
      accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");
    } catch (e) {
      // If error, likely not authorized
      return Response.json({ 
        error: 'Calendar not connected', 
        details: 'Please ask Yara to connect your Google Calendar first.' 
      }, { status: 403 });
    }

    if (!accessToken) {
      return Response.json({ 
        error: 'Calendar not connected', 
        details: 'Please ask Yara to connect your Google Calendar first.' 
      }, { status: 403 });
    }

    // Fetch active assignments for the student
    // We need to know the student's grade/class to filter assignments
    // Ideally we fetch the student profile
    const profiles = await base44.entities.PublicProfile.filter({ user_id: user.id });
    const profile = profiles[0] || user;
    
    if (!profile.grade) {
      return Response.json({ error: 'Grade not found', details: 'Please complete your profile first.' }, { status: 400 });
    }

    const assignments = await base44.entities.Assignment.filter({ 
      grade: profile.grade,
      is_active: true 
    });

    // Filter assignments that have a due date in the future (or recent past)
    const now = new Date();
    const futureAssignments = assignments.filter(a => {
      if (!a.due_date) return false;
      const due = new Date(a.due_date);
      // Filter filtering by class if applicable
      if (a.class_id && a.class_id !== profile.class_id) return false;
      return due > new Date(now.setDate(now.getDate() - 7)); // Include last week just in case
    });

    if (futureAssignments.length === 0) {
      return Response.json({ message: 'No upcoming assignments to sync' });
    }

    let addedCount = 0;

    for (const assignment of futureAssignments) {
      const dueDate = new Date(assignment.due_date);
      // Set time to 23:59 if it's just a date, or use the time if provided
      // Assuming due_date is ISO string. If it's YYYY-MM-DD, we should set it to end of day.
      
      const event = {
        summary: `تکلیف: ${assignment.title}`,
        description: `${assignment.description}\n\nدرس: ${assignment.subject}\nامتیاز: ${assignment.max_score}`,
        start: {
          dateTime: dueDate.toISOString(), // Simplified: set start = end for deadlines
          timeZone: 'Asia/Tehran',
        },
        end: {
          dateTime: dueDate.toISOString(),
          timeZone: 'Asia/Tehran',
        },
      };

      // We should check if event exists to avoid duplicates.
      // A simple check is to query events around this time with this title.
      // For simplicity in this v1, we'll just try to insert and ignore logic for duplicates for now, 
      // OR we can list events and check. Listing is safer.
      
      const timeMin = new Date(dueDate);
      timeMin.setHours(0, 0, 0, 0);
      const timeMax = new Date(dueDate);
      timeMax.setHours(23, 59, 59, 999);

      const listRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&q=${encodeURIComponent(assignment.title)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (listRes.ok) {
        const listData = await listRes.json();
        // If we found an event with similar title, skip
        if (listData.items && listData.items.some(e => e.summary.includes(assignment.title))) {
          continue;
        }
      }

      // Create event
      const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (createRes.ok) {
        addedCount++;
      }
    }

    return Response.json({ 
      success: true, 
      message: `Successfully synced ${addedCount} assignments to your calendar.`,
      added: addedCount
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};

Deno.serve(syncCalendar);