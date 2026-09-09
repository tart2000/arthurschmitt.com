import { getCalendarClient } from './googlecalendar.utils.ts';

global.registerAction('googlecalendar/freebusy-query', async ({ args }: ActionParams, context: ActionContext) => {
    const calendar = getCalendarClient(context.connection);

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin: args.timeMin,
            timeMax: args.timeMax,
            items: args.items,
            timeZone: args.timeZone,
            groupExpansionMax: args.groupExpansionMax,
            calendarExpansionMax: args.calendarExpansionMax,
        },
    });
    return response.data;
});

global.registerAction('googlecalendar/events-insert', async ({ args }: ActionParams, context: ActionContext) => {
    const calendar = getCalendarClient(context.connection);

    const response = await calendar.events.insert({
        calendarId: args.calendarId || 'primary',
        requestBody: {
            summary: args.summary,
            start: args.start,
            end: args.end,
            description: args.description,
            location: args.location,
            attendees: args.attendees,
            recurrence: args.recurrence,
            reminders: args.reminders,
            visibility: args.visibility,
            status: args.status,
            colorId: args.colorId,
        },
        sendUpdates: args.sendUpdates,
        conferenceDataVersion: args.conferenceDataVersion,
        maxAttendees: args.maxAttendees,
    });
    return response.data;
});

global.registerAction('googlecalendar/events-delete', async ({ args }: ActionParams, context: ActionContext) => {
    const calendar = getCalendarClient(context.connection);

    await calendar.events.delete({
        calendarId: args.calendarId || 'primary',
        eventId: args.eventId,
        sendUpdates: args.sendUpdates,
    });
});

global.registerAction('googlecalendar/events-get', async ({ args }: ActionParams, context: ActionContext) => {
    const calendar = getCalendarClient(context.connection);

    const response = await calendar.events.get({
        calendarId: args.calendarId || 'primary',
        eventId: args.eventId,
        timeZone: args.timeZone,
        maxAttendees: args.maxAttendees,
    });
    return response.data;
});

global.registerAction('googlecalendar/events-list', async ({ args }: ActionParams, context: ActionContext) => {
    const calendar = getCalendarClient(context.connection);

    const response = await calendar.events.list({
        calendarId: args.calendarId || 'primary',
        timeMin: args.timeMin,
        timeMax: args.timeMax,
        q: args.q,
        maxResults: args.maxResults,
        orderBy: args.orderBy,
        singleEvents: args.singleEvents,
        showDeleted: args.showDeleted,
        pageToken: args.pageToken,
        timeZone: args.timeZone,
        updatedMin: args.updatedMin,
        eventTypes: args.eventTypes,
        maxAttendees: args.maxAttendees,
        showHiddenInvitations: args.showHiddenInvitations,
        iCalUID: args.iCalUID,
        syncToken: args.syncToken,
    });
    return response.data;
});

global.registerAction('googlecalendar/events-update', async ({ args }: ActionParams, context: ActionContext) => {
    const calendar = getCalendarClient(context.connection);

    const response = await calendar.events.update({
        calendarId: args.calendarId || 'primary',
        eventId: args.eventId,
        requestBody: {
            summary: args.summary,
            start: args.start,
            end: args.end,
            description: args.description,
            location: args.location,
            attendees: args.attendees,
            recurrence: args.recurrence,
            reminders: args.reminders,
            visibility: args.visibility,
            status: args.status,
            colorId: args.colorId,
        },
        sendUpdates: args.sendUpdates,
        conferenceDataVersion: args.conferenceDataVersion,
        maxAttendees: args.maxAttendees,
        supportsAttachments: args.supportsAttachments,
    });
    return response.data;
});
