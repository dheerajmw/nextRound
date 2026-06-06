"use client";

import { Button } from "@/components/ui/button";
import { speakText, stopSpeaking, useTtsMute } from "@/hooks/use-speech";
import { Volume2 } from "lucide-react";
import { useEffect } from "react";

export function QuestionSpeaker({
  question,
  autoSpeak,
}: {
  question: string;
  autoSpeak?: boolean;
}) {
  const { muted } = useTtsMute();

  useEffect(() => {
    if (autoSpeak && question && !muted) {
      speakText(question);
    }
    return () => stopSpeaking();
  }, [question, autoSpeak, muted]);

  useEffect(() => {
    if (muted) {
      stopSpeaking();
    }
  }, [muted]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-1"
      disabled={muted}
      onClick={() => speakText(question)}
    >
      <Volume2 className="size-4" />
      {muted ? "Voice muted" : "Listen to question"}
    </Button>
  );
}
