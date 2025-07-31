import type { Timeout } from "safe-timers";
import { setTimeoutAt } from "safe-timers";
import type { EventDocument } from "../../../database/models/Event";
import createOrUpdateDiscordMessageForEvent from "../discordMessage";

const timeouts = new Map<number, Timeout[]>();

const timeBeforeEventToSendDiscordMessage = 6 * 24 * 60 * 60 * 1000;
export default function handleDiscordMessageTimeoutForEvent(event: EventDocument): void {
  const existingTimeouts = timeouts.get(event.eventId);
  if (existingTimeouts) {
    existingTimeouts.forEach(timeout => {
      timeout.clear();
    });
  }

  const now = Date.now();
  const timeToCreateDiscordMessage = event.dateStart.getTime() - timeBeforeEventToSendDiscordMessage;
  if (timeToCreateDiscordMessage < now) void createOrUpdateDiscordMessageForEvent(event);

  const otherTimesToUpdate = [
    event.dateStart.getTime(),
    event.dateEnd.getTime(),
  ];

  timeouts.set(event.eventId, [
    timeToCreateDiscordMessage >= now && setTimeoutAt(() => void createOrUpdateDiscordMessageForEvent(event), timeToCreateDiscordMessage),
    ...otherTimesToUpdate
      .filter(time => time > now)
      .map(time => setTimeoutAt(() => void createOrUpdateDiscordMessageForEvent(event), time)),
  ].filter(Boolean) as Timeout[]);
}
