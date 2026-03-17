import React, { useRef, useState, useCallback } from 'react';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoSelected: (file: File) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ currentPhotoUrl, onPhotoSelected }) => {
  const [mode, setMode] = useState<'idle' | 'webcam' | 'preview'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startWebcam = useCallback(async () => {
    setWebcamError(null);
    setMode('webcam');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setWebcamError('Não foi possível acessar a câmera. Verifique as permissões.');
      setMode('idle');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Center-crop square
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setMode('preview');
        onPhotoSelected(file);
        stopStream();
        setCapturing(false);
      },
      'image/jpeg',
      0.92
    );
  }, [onPhotoSelected, stopStream]);

  const cancelWebcam = useCallback(() => {
    stopStream();
    setMode('idle');
  }, [stopStream]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setMode('preview');
      onPhotoSelected(file);
    },
    [onPhotoSelected]
  );

  const reset = useCallback(() => {
    stopStream();
    setMode('idle');
    setPreviewUrl(currentPhotoUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [stopStream, currentPhotoUrl]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview / Placeholder */}
      {mode !== 'webcam' && (
        <div className="relative">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Foto de perfil"
              className="w-32 h-32 rounded-full object-cover border-4 border-orange-200 shadow"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-orange-50 border-4 border-orange-200 border-dashed flex items-center justify-center">
              <span className="text-4xl">📷</span>
            </div>
          )}
          {mode === 'preview' && (
            <button
              type="button"
              onClick={reset}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              title="Remover foto"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Webcam view */}
      {mode === 'webcam' && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative rounded-full overflow-hidden w-48 h-48 border-4 border-orange-300 shadow-lg bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={capturing}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {capturing ? 'Capturando...' : '📸 Tirar foto'}
            </button>
            <button
              type="button"
              onClick={cancelWebcam}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Action buttons (not in webcam mode) */}
      {mode !== 'webcam' && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={startWebcam}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <span>📷</span> Usar câmera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <span>🖼️</span> Enviar arquivo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {webcamError && (
        <p className="text-sm text-red-500 text-center">{webcamError}</p>
      )}
      <p className="text-xs text-gray-400 text-center">JPG, PNG ou WebP · máx. 5MB</p>
    </div>
  );
};

export default PhotoUpload;
