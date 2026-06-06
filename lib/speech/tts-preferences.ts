export const TTS_VOICE_STORAGE_KEY = "nextround-tts-voice";
export const TTS_MUTE_STORAGE_KEY = "nextround-tts-muted";
export const TTS_LANG = "en-US";
export const TTS_PREVIEW_TEXT =
  "Hello, I'll be your interviewer today. Let's begin with your first question.";

export function getDefaultVoiceNameFromEnv(): string | null {
  const name = process.env.NEXT_PUBLIC_TTS_VOICE?.trim();
  return name || null;
}

export function getStoredVoiceName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(TTS_VOICE_STORAGE_KEY)?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function setStoredVoiceName(name: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!name) {
      localStorage.removeItem(TTS_VOICE_STORAGE_KEY);
    } else {
      localStorage.setItem(TTS_VOICE_STORAGE_KEY, name);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function getStoredTtsMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(TTS_MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setStoredTtsMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (muted) {
      localStorage.setItem(TTS_MUTE_STORAGE_KEY, "1");
    } else {
      localStorage.removeItem(TTS_MUTE_STORAGE_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function filterEnglishVoices(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice[] {
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => {
      if (a.default !== b.default) return a.default ? -1 : 1;
      if (a.localService !== b.localService) return a.localService ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function resolveSpeechVoice(
  voices: SpeechSynthesisVoice[],
  preferredName?: string | null
): SpeechSynthesisVoice | undefined {
  const english = filterEnglishVoices(voices);
  if (english.length === 0) return undefined;

  const wanted =
    preferredName?.trim() ||
    getStoredVoiceName() ||
    getDefaultVoiceNameFromEnv();

  if (wanted) {
    const exact = english.find((v) => v.name === wanted);
    if (exact) return exact;

    const lower = wanted.toLowerCase();
    const partial = english.find((v) => v.name.toLowerCase().includes(lower));
    if (partial) return partial;
  }

  return (
    english.find((v) => v.default) ??
    english.find((v) => v.lang === TTS_LANG) ??
    english[0]
  );
}
