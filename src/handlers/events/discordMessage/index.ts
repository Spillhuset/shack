import type { EventDocument } from "../../../database/models/Event";
import config from "../../../config";
import { EventAttendee } from "../../../database/models/EventAttendee";
import client from "../../../utils/client";
import mainLogger from "../../../utils/logger/main";
import generateMessageForEvent from "./generateMessage";

export default async function createOrUpdateDiscordMessageForEvent(event: EventDocument): Promise<void> {
  // this fetch function is caching, so we don't need to worry about overloading the discord API
  const channel = await client.channels.fetch(config.channels.events, { cache: true, force: false }).catch(() => null);
  if (!channel?.isSendable()) return void mainLogger.error("Event channel is not set up correctly, womp womp");

  if (event.discordMessageId) {
    const message = await channel.messages.fetch({ message: event.discordMessageId, cache: true, force: false }).catch(() => null);
    if (message) return void await message.edit(generateMessageForEvent(event, await EventAttendee.find({ eventId: event.eventId })));
    // else don't return and continue with the code below to make a new message
  }

  const message = await channel.send(generateMessageForEvent(event, await EventAttendee.find({ eventId: event.eventId }))).catch(() => null);
  if (!message) return void mainLogger.error("Failed to send event message");
  event.discordMessageId = message.id;
  await event.save();
}
