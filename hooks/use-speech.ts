"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  filterEnglishVoices,
  getDefaultVoiceName,
  getStoredTtsMuted,
  getStoredVoiceName,
  resetStoredVoiceToDefault,
  resolveSpeechVoice,
  setStoredTtsMuted,
  setStoredVoiceName,
  TTS_LANG,
  TTS_PREVIEW_TEXT,
} from "@/lib/speech/tts-preferences";

export { TTS_PREVIEW_TEXT };

const ttsMuteListeners = new Set<() => void>();
const ttsVoiceListeners = new Set<() => void>();
const TTS_UNMUTE_SESSION_KEY = "nextround-tts-unmute-session";

function notifyTtsMuteChange() {
  ttsMuteListeners.forEach((listener) => listener());
}

export function subscribeTtsMuteChange(listener: () => void): () => void {
  ttsMuteListeners.add(listener);
  return () => {
    ttsMuteListeners.delete(listener);
  };
}

function notifyTtsVoiceChange() {
  ttsVoiceListeners.forEach((listener) => listener());
}

export function getTtsMuted(): boolean {
  return getStoredTtsMuted();
}

export function setTtsMuted(muted: boolean): void {
  setStoredTtsMuted(muted);
  if (muted) {
    stopSpeaking();
  }
  notifyTtsMuteChange();
}

export function unmuteInterviewTts(): void {
  setStoredTtsMuted(false);
  notifyTtsMuteChange();
}

export function markInterviewSessionForUnmute(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TTS_UNMUTE_SESSION_KEY, sessionId);
  } catch {
    // ignore private mode / quota
  }
}

export function consumeInterviewSessionUnmute(sessionId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(TTS_UNMUTE_SESSION_KEY) !== sessionId) {
      return false;
    }
    sessionStorage.removeItem(TTS_UNMUTE_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}

export function prepareInterviewSetupTts(): void {
  resetStoredVoiceToDefault(loadVoices());
  unmuteInterviewTts();
  notifyTtsVoiceChange();
}

export function resetVoiceToDefault(): string {
  const name = resetStoredVoiceToDefault(loadVoices());
  notifyTtsVoiceChange();
  return name;
}

export function useTtsMute() {
  const [muted, setMutedState] = useState(() => getTtsMuted());

  useEffect(() => {
    const sync = () => setMutedState(getTtsMuted());
    sync();
    ttsMuteListeners.add(sync);
    return () => {
      ttsMuteListeners.delete(sync);
    };
  }, []);

  const toggle = useCallback(() => {
    setTtsMuted(!getTtsMuted());
  }, []);

  return { muted, toggle, setMuted: setTtsMuted };
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function useSpeechVoices() {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedName, setSelectedNameState] = useState("");

  useEffect(() => {
    setSupported(typeof window !== "undefined" && !!window.speechSynthesis);
  }, []);

  const refreshVoices = useCallback(() => {
    const next = filterEnglishVoices(loadVoices());
    setVoices(next);

    const stored = getStoredVoiceName();
    if (stored) {
      const match = resolveSpeechVoice(next, stored);
      const name = match?.name ?? stored;
      if (match && name !== stored) {
        setStoredVoiceName(name);
      }
      setSelectedNameState(name);
      return;
    }

    const match = resolveSpeechVoice(next, getDefaultVoiceName());
    setSelectedNameState(match?.name ?? getDefaultVoiceName());
  }, []);

  useEffect(() => {
    if (!supported) return;

    refreshVoices();
    ttsVoiceListeners.add(refreshVoices);
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => {
      ttsVoiceListeners.delete(refreshVoices);
      window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
    };
  }, [supported, refreshVoices]);

  const setSelectedName = useCallback((name: string) => {
    setStoredVoiceName(name || null);
    setSelectedNameState(name);
    notifyTtsVoiceChange();
  }, []);

  return { supported, voices, selectedName, setSelectedName };
}

export function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognition() != null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setError("Speech recognition is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    setError(null);
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = TTS_LANG;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text.trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setError(null);
  }, [stop]);

  return {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
    reset,
    setTranscript,
  };
}

export function speakText(
  text: string,
  options?: { force?: boolean }
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  if (!options?.force && getTtsMuted()) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = TTS_LANG;

  const voice = resolveSpeechVoice(loadVoices());
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
