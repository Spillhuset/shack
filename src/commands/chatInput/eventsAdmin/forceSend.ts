import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { SecondLevelChatInputCommand } from "..";
import eventIdAutocomplete from "../../../constants/autocompletes/events";
import { Event } from "../../../database/models/Event";
import createOrUpdateDiscordMessageForEvent from "../../../handlers/events/discordMessage";

export default {
  name: "force-send",
  description: "Tving et event fra nettsiden til å bli sendt til oppmøte-kanalen",
  options: [
    {
      name: "event",
      description: "Event ID for eventet",
      type: ApplicationCommandOptionType.String,
      required: true,
      autocomplete: eventIdAutocomplete,
    },
  ],
  async execute(interaction) {
    const eventId = interaction.options.getString("event", true);
    const event = await Event.findOne({ eventId: String(eventId) });
    if (!event) return void interaction.reply({ content: "❌ Noe gikk galt :(", flags: MessageFlags.Ephemeral });

    const exists = Boolean(event.discordMessageId);

    await createOrUpdateDiscordMessageForEvent(event);
    return void interaction.reply({ content: `✅ Eventet \`${event.name}\` er nå ${exists ? "sendt" : "oppdatert"} i oppmøte-kanalen.`, flags: MessageFlags.Ephemeral });
  },
} satisfies SecondLevelChatInputCommand;
