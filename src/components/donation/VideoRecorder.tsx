"use client";

import { useState, useRef, useCallback } from "react";
import { Video, StopCircle, Upload, X, Play, RotateCcw, Loader2 } from "lucide-react";

interface VideoRecorderProps {
  onVideoReady: (videoUrl: string | null) => void;
  donationId?: string;
}

// Quanto tempo o usuário precisa segurar até a gravação começar de fato.
// Tap mais curto que isso é considerado acidental → mostramos a dica.
const HOLD_THRESHOLD_MS = 350;

export function VideoRecorder({ onVideoReady, donationId }: VideoRecorderProps) {
  const [mode, setMode] = useState<"idle" | "recording" | "preview" | "uploading" | "done">("idle");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [holdHint, setHoldHint] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoPreviewUrl(url);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.muted = false;
        }
        stream.getTracks().forEach((t) => t.stop());
        uploadVideo(blob);
      };

      mediaRecorder.start();
      setMode("recording");
      setTimeLeft(10);

      let count = 10;
      timerRef.current = setInterval(() => {
        count--;
        setTimeLeft(count);
        if (count <= 0) {
          stopRecording();
        }
      }, 1000);
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Press-and-hold handlers ──
  // Apenas armam o startRecording após HOLD_THRESHOLD_MS pra evitar acessar
  // câmera em taps acidentais. Soltar antes do threshold mostra a dica.
  const handlePressDown = useCallback(() => {
    if (mode !== "idle") return;
    setHoldHint(false);
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      startRecording();
    }, HOLD_THRESHOLD_MS);
  }, [mode, startRecording]);

  const handlePressUp = useCallback(() => {
    // Se ainda estava no período de "armando" — soltou antes da hora.
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      setHoldHint(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setHoldHint(false), 2500);
      return;
    }
    // Já estava gravando — solta = parar.
    if (mode === "recording") stopRecording();
  }, [mode, stopRecording]);

  const handlePressCancel = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (mode === "recording") stopRecording();
  }, [mode, stopRecording]);

  const resetRecording = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoBlob(null);
    setVideoPreviewUrl(null);
    setMode("idle");
    setTimeLeft(10);
    onVideoReady(null);
  };

  async function uploadVideo(blob: Blob) {
    setMode("uploading");
    const fd = new FormData();
    fd.append("video", blob, "video.webm");
    if (donationId) fd.append("donationId", donationId);

    try {
      const res = await fetch(donationId ? `/api/donations/${donationId}/video` : "/api/upload/video", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        onVideoReady(data.videoUrl);
        setMode("done");
      } else {
        setError("Erro ao enviar vídeo. Tente novamente.");
        setMode("preview");
      }
    } catch {
      setError("Erro ao enviar vídeo.");
      setMode("preview");
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("O vídeo deve ter no máximo 50MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoBlob(file);
    setVideoPreviewUrl(url);
    setMode("preview");
    if (videoRef.current) {
      videoRef.current.src = url;
    }
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      {mode === "idle" && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("record")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === "record"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }`}
          >
            Gravar vídeo
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === "upload"
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }`}
          >
            Enviar arquivo
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-3">
          {error}
        </div>
      )}

      {/* Recording interface */}
      {(mode === "idle" || mode === "recording") && tab === "record" && (
        <div className="space-y-3">
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            {mode === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-center text-white">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-60" />
                  <p className="text-sm">Clique para iniciar a câmera</p>
                </div>
              </div>
            )}
            {mode === "recording" && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {timeLeft}s
              </div>
            )}
          </div>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handlePressDown();
            }}
            onPointerUp={handlePressUp}
            onPointerLeave={handlePressCancel}
            onPointerCancel={handlePressCancel}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full flex items-center justify-center gap-2 text-white font-medium py-3 rounded-xl transition-colors select-none touch-none ${
              mode === "recording"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {mode === "recording" ? (
              <>
                <StopCircle className="w-5 h-5" />
                Gravando… solte para parar
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Segure para gravar (até 10s)
              </>
            )}
          </button>

          {holdHint && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm text-center">
              <span className="font-semibold">Segure</span> o botão para gravar — não solte enquanto fala.
            </div>
          )}
        </div>
      )}

      {/* Upload interface */}
      {mode === "idle" && tab === "upload" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center gap-3 transition-colors"
          >
            <Upload className="w-10 h-10 text-muted-foreground/60" />
            <div>
              <p className="text-sm font-medium text-foreground/80">Clique para selecionar um vídeo</p>
              <p className="text-xs text-muted-foreground/60 mt-1">MP4, MOV, WebM • Máximo 50MB • 10 segundos</p>
            </div>
          </button>
        </>
      )}

      {/* Uploading */}
      {mode === "uploading" && (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Enviando vídeo...</p>
          <button
            onClick={resetRecording}
            className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground"
          >
            <RotateCcw className="w-3 h-3" />
            Regravar
          </button>
        </div>
      )}

      {/* Done */}
      {mode === "done" && (
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <Play className="w-7 h-7 text-green-600" fill="currentColor" />
          </div>
          <p className="text-sm font-medium text-green-700">Vídeo enviado com sucesso!</p>
          <button
            onClick={resetRecording}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground/80"
          >
            <RotateCcw className="w-3 h-3" />
            Regravar
          </button>
          <button
            onClick={resetRecording}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Remover vídeo
          </button>
        </div>
      )}
    </div>
  );
}
