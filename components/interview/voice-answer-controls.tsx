"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/use-speech";
import { Mic, MicOff, Square } from "lucide-react";
import { useEffect } from "react";

export function VoiceAnswerControls({
  value,
  onChange,
  disabled,
  voiceOnly,
}: {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  voiceOnly?: boolean;
}) {
  const speech = useSpeechRecognition();

  useEffect(() => {
    if (speech.transcript) {
      onChange(speech.transcript);
    }
  }, [speech.transcript, onChange]);

  if (!speech.supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Voice input requires Chrome or Edge. You can still type your answer
        below.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!speech.listening ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={speech.start}
          >
            <Mic className="size-4" />
            Start speaking
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={disabled}
            onClick={speech.stop}
          >
            <Square className="size-4" />
            Stop recording
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => {
            speech.reset();
            onChange("");
          }}
        >
          <MicOff className="size-4" />
          Clear
        </Button>
      </div>

      {speech.listening ? (
        <p className="text-xs text-primary animate-pulse">Listening…</p>
      ) : null}

      {speech.error ? (
        <p className="text-sm text-destructive" role="alert">
          {speech.error}
        </p>
      ) : null}

      {!voiceOnly ? (
        <div className="space-y-2">
          <Label htmlFor="answer">Or type your answer</Label>
          <Textarea
            id="answer"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your response…"
            rows={6}
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm min-h-[120px] whitespace-pre-wrap">
          {value || "Your spoken answer will appear here…"}
        </div>
      )}
    </div>
  );
}
