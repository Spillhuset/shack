/* eslint-disable @typescript-eslint/no-invalid-this */
import type { DocumentType } from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";
import { getModelForClass, pre, prop } from "@typegoose/typegoose";
import handleDiscordMessageTimeoutForEvent from "../../handlers/events/timeouts/discordMessages";

@pre<EventSchema>("save", function (next) {
  handleDiscordMessageTimeoutForEvent(this);
  next();
})
export class EventSchema {
  @prop({ type: Date, required: true }) dateEnd!: Date;
  @prop({ type: Date, required: true }) dateStart!: Date;
  @prop({ type: String, default: null }) description!: null | string;
  @prop({ type: String, default: null }) discordMessageId!: null | Snowflake;
  @prop({ type: Number, unique: true, required: true }) eventId!: number;
  @prop({ type: Boolean, default: false }) isCancelled!: boolean;
  @prop({ type: Boolean, default: false }) isCrewOnly!: boolean;
  @prop({ type: Boolean, default: false }) isMembersOnly!: boolean;
  @prop({ type: String, required: true }) name!: string;

  get dateStartFormatted(): string {
    return `${this.dateStart.toLocaleDateString("nb", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Oslo" })} kl. ${this.dateStart.toLocaleTimeString("nb", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo" })}`;
  }

  get title(): string {
    return `${this.name} - ${this.dateStartFormatted}`;
  }
}

export type EventDocument = DocumentType<EventSchema>;

export const Event = getModelForClass(EventSchema);
