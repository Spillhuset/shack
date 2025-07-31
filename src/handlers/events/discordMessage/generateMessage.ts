import type { MessageCreateOptions, MessageEditOptions } from "discord.js";
import dedent from "dedent";
import { blockQuote, ButtonStyle, Colors, ComponentType, heading, MessageFlags, TextInputStyle, time, TimestampStyles } from "discord.js";
import html2md from "html-to-md";
import type { EventSchema } from "../../../database/models/Event";
import type { EventAttendeeSchema } from "../../../database/models/EventAttendee";
import { Event } from "../../../database/models/Event";
import { EventAttendee, EventAttendeeStatus } from "../../../database/models/EventAttendee";
import { buttonComponents, selectMenuComponents } from "../../interactions/components";
import { createModalTextInput, getModalTextInput, modals } from "../../interactions/modals";

const timeZone = "Europe/Oslo";

export default function generateMessageForEvent(event: EventSchema, attendees: EventAttendeeSchema[]): MessageCreateOptions & MessageEditOptions {
  let color: number = Colors.Blue;
  if (event.isMembersOnly) color = Colors.Orange;
  if (event.isCrewOnly) color = Colors.Purple;
  if (event.isCancelled) color = Colors.Red;

  return {
    embeds: [
      {
        title: event.title,
        url: `https://spillhuset.com/events/${event.eventId}`,
        ...event.description && { description: blockQuote(html2md(event.description)) },
        color,
        fields: [
          {
            name: `✅ Kommer (${attendees.filter(attendee => attendee.response.status === EventAttendeeStatus.Yah).length})`,
            value: attendees
              .filter(attendee => attendee.response.status === EventAttendeeStatus.Yah)
              .sort((a, b) => (a.response.expectedDate?.getTime() ?? Infinity) - (b.response.expectedDate?.getTime() ?? Infinity))
              .map(attendee => `> <@${attendee.userId}> ${attendee.response.expectedDate ? `(${attendee.response.expectedDate.getTime() === 0 ? "tidlig" : time(attendee.response.expectedDate, TimestampStyles.ShortTime)})` : "(usikker)"}`)
              .join("\n") || "> *Ingen*",
            inline: true,
          },
          {
            name: `❔ Tentativ (${attendees.filter(attendee => attendee.response.status === EventAttendeeStatus.Hmm).length})`,
            value: attendees.filter(attendee => attendee.response.status === EventAttendeeStatus.Hmm)
              .map(attendee => `> <@${attendee.userId}>`)
              .join("\n") || "> *Ingen*",
            inline: true,
          },
          {
            name: `❌ Kommer ikke (${attendees.filter(attendee => attendee.response.status === EventAttendeeStatus.Nah).length})`,
            value: attendees.filter(attendee => attendee.response.status === EventAttendeeStatus.Nah)
              .map(attendee => `> <@${attendee.userId}>`)
              .join("\n") || "> *Ingen*",
            inline: true,
          },
        ],
      },
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Success,
            emoji: "✔️",
            label: "Kommer",
            customId: "respond-yah",
            disabled: event.isCancelled || event.dateEnd < new Date(),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            emoji: "❔",
            label: "Tentativ",
            customId: "respond-hmm",
            disabled: event.isCancelled || event.dateEnd < new Date(),
          },
          {
            type: ComponentType.Button,
            style: ButtonStyle.Danger,
            emoji: "✖️",
            label: "Kommer ikke",
            customId: "respond-nah",
            disabled: event.isCancelled || event.dateEnd < new Date(),
          },
        ],
      },
    ],
  };
}

const selectableTimeBeforeEvent = 30 * 60 * 1000;
const selectableTimeInterval = 15 * 60 * 1000;
buttonComponents.set("respond-yah", {
  persistent: true,
  allowedUsers: "all",
  async callback(interaction) {
    const event = await Event.findOne({ discordMessageId: interaction.message.id });
    if (!event) return;

    if (event.dateEnd < new Date()) return void interaction.reply({ content: "Har du en tidsmaskin? lol.", flags: MessageFlags.Ephemeral });

    void interaction.reply({
      content: dedent`
        ${heading("Når tenker du at du kommer?")}
        > ${event.title}
      `,
      flags: MessageFlags.Ephemeral,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.StringSelect,
              customId: interaction.id,
              placeholder: "Velg et tidspunkt",
              minValues: 1,
              maxValues: 1,
              // this has a limit of 25 options, so we need to ensure we don't exceed this limit
              options: [
                {
                  label: `Før kl. ${new Date(event.dateStart.getTime() - selectableTimeBeforeEvent).toLocaleTimeString("nb", { timeStyle: "short", timeZone })}`,
                  value: "before",
                },
                ...Array.from({ length: Math.min(Math.floor((event.dateEnd.getTime() - (event.dateStart.getTime() - selectableTimeBeforeEvent)) / selectableTimeInterval), 25 - 2) }, (_, i) => {
                  const date = new Date(event.dateStart.getTime() - selectableTimeBeforeEvent + i * selectableTimeInterval);
                  const timeString = date.toLocaleTimeString("nb", { timeStyle: "short", timeZone });
                  return {
                    label: `Cirka kl. ${timeString}`,
                    value: String(date.getTime()),
                  };
                }),
                { label: "Usikker", value: "unsure" },
              ],
            },
          ],
        },
      ],
    });

    selectMenuComponents.set(interaction.id, {
      allowedUsers: [interaction.user.id],
      selectType: "string",
      async callback(select) {
        const selected = select.values[0]!;
        let expectedDate: Date | null = null;
        switch (selected) {
          case "before": {
            expectedDate = new Date(0);
            break;
          }
          case "unsure": {
            // expectedDate = null;
            break;
          }
          default: {
            const timestamp = Number(selected);
            expectedDate = new Date(timestamp);
            break;
          }
        }

        const attendees = await EventAttendee.find({ eventId: event.eventId });
        const attendee = attendees.find(inter => inter.userId === interaction.user.id) ?? new EventAttendee({ eventId: event.eventId, userId: interaction.user.id });
        attendee.response = { status: EventAttendeeStatus.Yah, ...expectedDate && { expectedDate } };
        if (attendee.isNew) attendees.push(attendee);

        void attendee.save();
        void select.update({ content: "✅ Du er nå påmeldt. Du kan når som helst endre svaret ditt, eksempelvis om du på et senere tidspunkt vet at du kan/kan ikke komme, eller om du kommer til en annen tid.", components: [] });

        void interaction.message.edit(generateMessageForEvent(event, attendees));
      },
    });
  },
});

buttonComponents.set("respond-hmm", {
  persistent: true,
  allowedUsers: "all",
  async callback(interaction) {
    const event = await Event.findOne({ discordMessageId: interaction.message.id });
    if (!event) return;

    if (event.dateEnd < new Date()) return void interaction.reply({ content: "Har du en tidsmaskin? lol.", flags: MessageFlags.Ephemeral });

    const existingAttendee = await EventAttendee.findOne({ eventId: event.eventId, userId: interaction.user.id });

    void interaction.showModal({
      customId: interaction.id,
      title: `Tentativ for ${event.name}`,
      components: [
        createModalTextInput({
          label: "Grunn for tentativ (valgfritt)",
          style: TextInputStyle.Paragraph,
          placeholder: "NB! Dette er valgfritt, og du må ikke oppgi en grunn om ikke du ønsker selv.",
          ...existingAttendee?.response.status === EventAttendeeStatus.Hmm && existingAttendee.response.comment && { value: existingAttendee.response.comment },
          customId: "reason",
        }),
      ],
    });

    modals.set(interaction.id, async modal => {
      const comment = getModalTextInput(modal.components, "reason");
      const attendees = await EventAttendee.find({ eventId: event.eventId });
      const attendee = attendees.find(inter => inter.userId === interaction.user.id) ?? new EventAttendee({ eventId: event.eventId, userId: interaction.user.id });

      attendee.response = {
        status: EventAttendeeStatus.Hmm,
        ...comment && { comment },
      };
      if (attendee.isNew) attendees.push(attendee);

      void attendee.save();

      void modal.reply({
        content: "✅ Du er nå registrert som tentativ. Du kan når som helst endre svaret ditt, eksempelvis om du på et senere tidspunkt vet at du kan/kan ikke komme.",
        flags: MessageFlags.Ephemeral,
      });

      void interaction.message.edit(generateMessageForEvent(event, attendees));
    });
  },
});

buttonComponents.set("respond-nah", {
  persistent: true,
  allowedUsers: "all",
  async callback(interaction) {
    const event = await Event.findOne({ discordMessageId: interaction.message.id });
    if (!event) return;

    if (event.dateEnd < new Date()) return void interaction.reply({ content: "Har du en tidsmaskin? lol.", flags: MessageFlags.Ephemeral });

    const attendees = await EventAttendee.find({ eventId: event.eventId });
    const attendee = attendees.find(inter => inter.userId === interaction.user.id) ?? new EventAttendee({ eventId: event.eventId, userId: interaction.user.id });
    attendee.response = { status: EventAttendeeStatus.Nah };
    if (attendee.isNew) attendees.push(attendee);

    void attendee.save();

    await interaction.update(generateMessageForEvent(event, attendees));
  },
});
