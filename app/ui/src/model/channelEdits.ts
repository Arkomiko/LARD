// Правки каналов (стойки инструментов).

import { clampInteger, cleanName } from "./limits";
import { findById, replaceById } from "./listHelpers";
import { type Channel, MIDI_CHANNEL_COUNT, type Project } from "./types";

/** Добавляет готовый канал (его создаёт createChannel) в конец стойки. */
export function addChannel(project: Project, channel: Channel): Project {
  if (findById(project.channels, channel.id)) return project;
  return { ...project, channels: [...project.channels, channel] };
}

export function renameChannel(project: Project, channelId: string, name: string): Project {
  const channels = replaceById(project.channels, channelId, (channel) => {
    const cleaned = cleanName(name, channel.name);
    return cleaned === channel.name ? channel : { ...channel, name: cleaned };
  });
  return channels === project.channels ? project : { ...project, channels };
}

/** На какой MIDI-канал (0…15) уходят ноты канала в DAW. */
export function setChannelMidiChannel(project: Project, channelId: string, midiChannel: number): Project {
  const value = clampInteger(midiChannel, 0, MIDI_CHANNEL_COUNT - 1);
  const channels = replaceById(project.channels, channelId, (channel) =>
    channel.midiChannel === value ? channel : { ...channel, midiChannel: value },
  );
  return channels === project.channels ? project : { ...project, channels };
}

/**
 * Удаляет канал вместе со всеми его нотами во всех паттернах — как в FL Studio:
 * ноты без инструмента играть некому.
 * Последний канал не удаляется: новой ноте всегда нужен канал.
 */
export function removeChannel(project: Project, channelId: string): Project {
  if (project.channels.length <= 1 || !findById(project.channels, channelId)) return project;
  const patterns = project.patterns.map((pattern) => {
    const notes = pattern.notes.filter((note) => note.channelId !== channelId);
    return notes.length === pattern.notes.length ? pattern : { ...pattern, notes };
  });
  return {
    ...project,
    channels: project.channels.filter((channel) => channel.id !== channelId),
    patterns,
  };
}
