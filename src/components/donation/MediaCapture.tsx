"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Video, RotateCcw, Loader2, X, Check } from "lucide-react";

type Mode = "idle" | "camera" | "recording" | "uploading" | "done";

interface MediaCaptureProps {
  onVideoReady: (url: string | null) => void;
  primaryColor?: string;
}

const MAX_SECONDS = 60;

export function MediaCapture({
  onVideoReady,
  primaryColor = "#d4a017",
}: MediaCaptureProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mode === "camera" || mode === "recording") {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [mode]);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const flipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    flipCanvasRef.current = null;
  }, []);

  const openCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      setMode("camera");
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  useEffect(() => {
    if (mode === "camera" && liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
      liveVideoRef.current.muted = true;
      liveVideoRef.current.play();
    }
  }, [mode]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    const video = liveVideoRef.current;
    if (!stream || !video) return;
    if (mediaRecorderRef.current?.state === "recording") return;

    const settings = stream.getVideoTracks()[0]?.getSettings();
    const shouldFlip = settings?.facingMode === "user";

    let recordStream: MediaStream = stream;

    if (shouldFlip) {
      const width = video.videoWidth || settings?.width || 720;
      const height = video.videoHeight || settings?.height || 1280;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      flipCanvasRef.current = canvas;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const draw = () => {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -width, 0, width, height);
          ctx.restore();
          rafRef.current = requestAnimationFrame(draw);
        };
        draw();
        const canvasStream = canvas.captureStream(30);
        stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
        recordStream = canvasStream;
      }
    }

    chunksRef.current = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(recordStream);
    } catch {
      recorder = new MediaRecorder(stream);
    }
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const localUrl = URL.createObjectURL(blob);
      setPreviewUrl(localUrl);
      setMode("uploading");
      stopStream();

      const fd = new FormData();
      fd.append("video", blob, "video.webm");
      try {
        const res = await fetch("/api/upload/video", {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          const data = await res.json();
          onVideoReady(data.videoUrl);
        } else {
          setError("Erro ao enviar vídeo. Tente novamente.");
        }
      } catch {
        setError("Erro ao enviar vídeo.");
      }
      setMode("done");
    };

    recorder.start();
    setMode("recording");
    setElapsed(0);

    let count = 0;
    timerRef.current = setInterval(() => {
      count++;
      setElapsed(count);
      if (count >= MAX_SECONDS) stopRecording();
    }, 1000);
  }, [stopStream, stopRecording, onVideoReady]);

  const reset = useCallback(() => {
    stopStream();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMode("idle");
    setElapsed(0);
    setError("");
    onVideoReady(null);
  }, [previewUrl, stopStream, onVideoReady]);

  const closeCamera = useCallback(() => {
    stopStream();
    setMode("idle");
  }, [stopStream]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      startRecording();
    },
    [startRecording],
  );

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      stopRecording();
    },
    [stopRecording],
  );

  const timeLeft = Math.max(0, MAX_SECONDS - elapsed);
  const progress = elapsed / MAX_SECONDS;
  const ringRadius = 44;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative">
        <div
          onClick={mode === "idle" ? openCamera : undefined}
          role={mode === "idle" ? "button" : undefined}
          tabIndex={mode === "idle" ? 0 : undefined}
          onKeyDown={(e) => {
            if (mode === "idle" && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              openCamera();
            }
          }}
          className="relative w-36 h-36 rounded-full overflow-hidden transition-all"
          style={{
            cursor: mode === "idle" ? "pointer" : "default",
            background:
              mode === "idle"
                ? `linear-gradient(160deg, ${primaryColor}28 0%, ${primaryColor}10 60%, #ffffff 100%)`
                : "#0a0a0a",
            border:
              mode === "idle"
                ? `2px dashed ${primaryColor}55`
                : mode === "done"
                ? `2px solid ${primaryColor}`
                : "2px solid transparent",
            boxShadow:
              mode === "done"
                ? `0 12px 28px -12px ${primaryColor}80`
                : mode === "idle"
                ? `0 8px 18px -12px ${primaryColor}55`
                : "0 8px 18px -12px rgba(0,0,0,0.25)",
          }}
        >
          {mode === "idle" && (
            <>
              <div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                  backgroundImage: `radial-gradient(${primaryColor}30 1px, transparent 1px)`,
                  backgroundSize: "12px 12px",
                }}
              />
              <div className="relative h-full w-full flex flex-col items-center justify-center gap-1.5 px-3 text-center">
                <div
                  className="w-11 h-11 rounded-full bg-white flex items-center justify-center"
                  style={{
                    boxShadow: `0 8px 18px -10px ${primaryColor}90, 0 0 0 1px ${primaryColor}20 inset`,
                  }}
                >
                  <Video className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
                <p
                  className="text-[0.7rem] font-semibold leading-tight"
                  style={{ color: primaryColor }}
                >
                  Gravar vídeo
                </p>
                <p className="text-[0.6rem] text-foreground/55 leading-tight">
                  até 1min
                </p>
              </div>
            </>
          )}

          {(mode === "uploading" || mode === "done") && previewUrl && (
            <video
              src={previewUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          )}

          {mode === "uploading" && (
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {mode === "done" && (
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.65rem] font-semibold text-white shadow-lg whitespace-nowrap"
            style={{ backgroundColor: primaryColor }}
          >
            <Check className="w-3 h-3" strokeWidth={3} />
            Anexado
          </div>
        )}
      </div>

      {mode === "done" && (
        <button
          onClick={reset}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors"
          style={{
            borderColor: `${primaryColor}40`,
            color: primaryColor,
            backgroundColor: "white",
          }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Gravar de novo
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive text-center max-w-[220px]">
          {error}
        </p>
      )}

      {/* Camera overlay — fullscreen, via portal */}
      {mounted &&
        (mode === "camera" || mode === "recording") &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
            <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
              <button
                onClick={closeCamera}
                className="text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Fechar câmera"
              >
                <X className="w-5 h-5" />
              </button>
              {mode === "recording" && (
                <div
                  className="flex items-center gap-2 text-white text-sm font-semibold px-3.5 py-1.5 rounded-full shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {timeLeft}s
                </div>
              )}
              <div className="w-10" />
            </div>

            <div className="flex-1 relative overflow-hidden">
              <video
                ref={liveVideoRef}
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                muted
                playsInline
              />
              {mode === "recording" && (
                <div className="absolute top-3 left-3 right-3 h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                    style={{
                      width: `${progress * 100}%`,
                      backgroundColor: "white",
                      boxShadow: `0 0 8px ${primaryColor}`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="px-6 pt-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onContextMenu={(e) => e.preventDefault()}
                className="relative active:scale-95 transition-transform select-none touch-none"
                style={{ WebkitTapHighlightColor: "transparent" }}
                aria-label={
                  mode === "recording"
                    ? "Solte para parar"
                    : "Segure para gravar"
                }
              >
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 96 96"
                  className="-rotate-90"
                >
                  <circle
                    cx="48"
                    cy="48"
                    r={ringRadius}
                    fill="none"
                    stroke="white"
                    strokeOpacity="0.35"
                    strokeWidth="3"
                  />
                  {mode === "recording" && (
                    <circle
                      cx="48"
                      cy="48"
                      r={ringRadius}
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringCircumference * (1 - progress)}
                      style={{
                        transition: "stroke-dashoffset 1s linear",
                      }}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="rounded-full transition-all duration-200 ease-out"
                    style={{
                      width: mode === "recording" ? "36px" : "68px",
                      height: mode === "recording" ? "36px" : "68px",
                      backgroundColor:
                        mode === "recording" ? primaryColor : "white",
                      borderRadius: mode === "recording" ? "8px" : "9999px",
                      boxShadow:
                        mode === "recording"
                          ? `0 0 24px ${primaryColor}90`
                          : "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
              </button>
              <span className="text-white/85 text-xs font-medium">
                {mode === "recording"
                  ? "Solte para parar"
                  : "Segure para gravar · até 1min"}
              </span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
