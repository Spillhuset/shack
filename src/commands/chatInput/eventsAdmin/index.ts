import type { FirstLevelChatInputCommand } from "..";
import forceSend from "./forceSend";
import sync from "./sync";

export default {
  name: "events-admin",
  description: "Administrer events",
  subcommands: [forceSend, sync],
} satisfies FirstLevelChatInputCommand;
