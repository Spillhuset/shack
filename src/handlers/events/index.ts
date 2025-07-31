import { decode } from "html-entities";
import type { EventSchema } from "../../database/models/Event";
import { Event } from "../../database/models/Event";
import mainLogger from "../../utils/logger/main";
import { fetchNextEvents } from "./rest";
import { NumBool } from "./rest/types";

export default function handleEvents(): void {
  setInterval(() => void eventsSync(true), 60 * 60 * 1000);
}

export async function eventsSync(routine = false): Promise<Record<"created" | "updated", number>> {
  const events = await fetchNextEvents();

  const result = { created: 0, updated: 0 };

  for (const eventIdString in events) {
    const eventId = parseInt(eventIdString, 10);
    const event = events[`${eventId}`]!; // eslint-disable-line no-implicit-coercion
    const dbEvent = await Event.findOne({ eventId }) ?? new Event({ eventId, dateStart: new Date(0), dateEnd: new Date(0) });

    event.title = decode(event.title);

    const difference: Record<Exclude<keyof EventSchema, "dateStartFormatted" | "discordMessageId" | "eventId" | "title">, boolean> = {
      name: dbEvent.name !== event.title,
      description: (dbEvent.description ?? null) !== (event.description ?? null),
      dateEnd: dbEvent.dateEnd.getTime() !== event.datetime_end * 1000,
      dateStart: dbEvent.dateStart.getTime() !== event.datetime_start * 1000,
      isCancelled: dbEvent.isCancelled !== (event.cancelled === NumBool.True),
      isMembersOnly: dbEvent.isMembersOnly !== (event.members_only === NumBool.True),
      isCrewOnly: dbEvent.isCrewOnly !== (event.crew_only === NumBool.True),
    };
    if (Object.values(difference).some(value => value)) {
      if (difference.name) dbEvent.name = event.title;
      if (difference.description) dbEvent.description = event.description ?? null;
      if (difference.dateEnd) dbEvent.dateEnd = new Date(event.datetime_end * 1000);
      if (difference.dateStart) dbEvent.dateStart = new Date(event.datetime_start * 1000);
      if (difference.isCancelled) dbEvent.isCancelled = event.cancelled === NumBool.True;
      if (difference.isMembersOnly) dbEvent.isMembersOnly = event.members_only === NumBool.True;
      if (difference.isCrewOnly) dbEvent.isCrewOnly = event.crew_only === NumBool.True;

      await dbEvent.save();
      if (dbEvent.isNew) result.created += 1;
      else result.updated += 1;
    }
  }

  if (routine) mainLogger.info(`Synced ${result.created} new and ${result.updated} updated events from the website.`);
  return result;
}
