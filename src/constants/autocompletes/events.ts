import { matchSorter } from "match-sorter";
import type { EventDocument } from "../../database/models/Event";
import type { Autocomplete } from "../../handlers/interactions/autocompletes";
import { Event } from "../../database/models/Event";

let eventCache: EventDocument[] = [];
let eventCacheTimeout: NodeJS.Timeout | null = null;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const eventIdAutocomplete: Autocomplete<string> = async (query, _interaction) => {
  if (eventCacheTimeout) {
    clearTimeout(eventCacheTimeout);
    eventCacheTimeout = setTimeout(() => {
      eventCache = [];
    }, 30_000);
  }


  // eslint-disable-next-line require-atomic-updates
  if (eventCache.length === 0) eventCache = await Event.find();

  return matchSorter(
    eventCache.map(
      event => ({
        event,
        name: event.name,
        description: event.description ?? "",
        date: event.dateStartFormatted,
      }),
    ), query, { keys: ["name", "description", "date"] },
  )
    .map(({ event }) => ({
      name: event.title,
      value: event.eventId.toString(),
    }));
};

export default eventIdAutocomplete;
