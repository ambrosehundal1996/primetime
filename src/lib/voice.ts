export function parseVoiceTranscript(transcript: string): {
  title: string;
  description: string | null;
} {
  const trimmed = transcript.trim();
  if (!trimmed) return { title: "Untitled task", description: null };

  const sentences = trimmed.split(/(?<=[.!?])\s+/);
  if (sentences.length === 1) {
    return { title: trimmed, description: null };
  }

  return {
    title: sentences[0].trim(),
    description: sentences.slice(1).join(" ").trim() || null,
  };
}
