"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseVoiceTranscript } from "@/lib/voice";

interface VoiceInputProps {
  onTranscript: (title: string, description: string | null) => void;
  disabled?: boolean;
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setSupported(!!getSpeechRecognition());
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text;
        } else {
          interimText += text;
        }
      }
      setInterim(interimText || finalTranscript);
    };

    recognition.onend = () => {
      setListening(false);
      if (finalTranscript.trim()) {
        const parsed = parseVoiceTranscript(finalTranscript);
        onTranscript(parsed.title, parsed.description);
        setInterim("");
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    setListening(true);
    setInterim("");
    recognition.start();
  }, [onTranscript]);

  if (!supported) {
    return (
      <p className="text-sm text-gray-500">
        Voice input is not supported in this browser. Use Chrome or Safari, or add
        tasks manually.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full transition-all",
          listening
            ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200"
            : "bg-gray-900 text-white hover:bg-gray-800",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {listening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>
      <p className="text-sm text-gray-500">
        {listening ? "Listening… tap to stop" : "Tap to add a task by voice"}
      </p>
      {interim && (
        <p className="max-w-md text-center text-sm italic text-gray-600">
          &ldquo;{interim}&rdquo;
        </p>
      )}
    </div>
  );
}
