"use client";

import { Button } from "@/components/ui/button";
import { speakText, stopSpeaking } from "@/hooks/use-speech";
import { Volume2 } from "lucide-react";
import { useEffect } from "react";

export function QuestionSpeaker({
  question,
  autoSpeak,
}: {
  question: string;
  autoSpeak?: boolean;
}) {
  useEffect(() => {
    if (autoSpeak && question) {
      speakText(question);
    }
    return () => stopSpeaking();
  }, [question, autoSpeak]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-1"
      onClick={() => speakText(question)}
    >
      <Volume2 className="size-4" />
      Listen to question
    </Button>
  );
}
