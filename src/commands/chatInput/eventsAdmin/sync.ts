import type { SecondLevelChatInputCommand } from "..";
import { eventsSync } from "../../../handlers/events";

export default {
  name: "sync",
  description: "Force-sync alle events fra nettsiden",
  async execute(interaction) {
    const [{ created, updated, time }] = await Promise.all([
      (async () => {
        const start = Date.now();
        const result = await eventsSync();
        return { ...result, time: Date.now() - start };
      })(),
      interaction.deferReply(),
    ]);

    return void interaction.editReply(`✅ Fant ${[created && `${created} nye events`, updated && `${updated} oppdaterte events`].filter(Boolean).join(" og ") || "ingen endringer"} (${time}ms)`);
  },
} satisfies SecondLevelChatInputCommand;
