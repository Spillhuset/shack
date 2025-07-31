import "dotenv/config";

export default {
  client: {
    id: String(process.env["CLIENT_ID"]),
    token: String(process.env["CLIENT_TOKEN"]),
  },

  databaseUri: String(process.env["DATABASE_URI"]),

  ownerId: String(process.env["OWNER_ID"]),
  guildId: String(process.env["GUILD_ID"]),

  channels: {
    events: String(process.env["CHANNEL_EVENTS"]),
  },

  themeColor: parseInt(process.env["THEME_COLOR"] ?? "0", 16) || 0x5865F2,
} as const;
