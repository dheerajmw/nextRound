"use client";

import { Button } from "@/components/ui/button";
import { useTtsMute } from "@/hooks/use-speech";
import { Volume2, VolumeX } from "lucide-react";

export function TtsMuteButton() {
  const { muted, toggle } = useTtsMute();

  return (
    <Button
      type="button"
      variant={muted ? "secondary" : "outline"}
      size="sm"
      className="gap-1.5 shrink-0"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute interviewer voice" : "Mute interviewer voice"}
    >
      {muted ? (
        <>
          <VolumeX className="size-4" />
          Unmute voice
        </>
      ) : (
        <>
          <Volume2 className="size-4" />
          Mute voice
        </>
      )}
    </Button>
  );
}
