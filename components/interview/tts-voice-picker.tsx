"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  TTS_PREVIEW_TEXT,
  useSpeechVoices,
  speakText,
} from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

export function TtsVoicePicker({ className }: { className?: string }) {
  const { supported, voices, selectedName, setSelectedName } = useSpeechVoices();

  if (!supported) {
    return null;
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor="tts-voice" className="text-xs text-muted-foreground">
        Interviewer voice
      </Label>
      <div className="flex gap-2">
        <select
          id="tts-voice"
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          className="flex h-9 min-w-0 flex-1 rounded-lg border border-input bg-[var(--nr-surface-container)] px-3 py-1 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {voices.map((voice) => (
            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
              {voice.name}
              {voice.localService ? "" : " (network)"}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => speakText(TTS_PREVIEW_TEXT, { force: true })}
        >
          Preview
        </Button>
      </div>
    </div>
  );
}
