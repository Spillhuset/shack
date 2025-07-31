/* eslint-disable max-classes-per-file */
import type { DocumentType } from "@typegoose/typegoose";
import type { Snowflake } from "discord.js";
import { getModelForClass, prop } from "@typegoose/typegoose";

export enum EventAttendeeStatus { Nah, Hmm, Yah }

export class EventAttendeeResponseSchema {
  @prop({ type: String }) comment?: string;
  @prop({ type: Date }) expectedDate?: Date;
  @prop({ enum: () => EventAttendeeStatus, type: Number, required: true }) status!: EventAttendeeStatus;
}

export class EventAttendeeSchema {
  @prop({ type: Number, required: true }) eventId!: number;
  @prop({ type: () => EventAttendeeResponseSchema, required: true }) response!: EventAttendeeResponseSchema;
  @prop({ type: String, required: true }) userId!: Snowflake;
}

export type EventAttendeeDocument = DocumentType<EventAttendeeSchema>;

export const EventAttendee = getModelForClass(EventAttendeeSchema);
