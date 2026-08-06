import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, User, Sparkles, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface CameraAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraAvatarModal: React.FC<CameraAvatarModalProps> = ({ isOpen, onClose }) => {
  const { firebaseUser, userProfile } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions in your browser or try again.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);
    canvas.width = 300;
    canvas.height = 300;

    // Draw square cropped image
    const startX = ((video.videoWidth || 400) - size) / 2;
    const startY = ((video.videoHeight || 400) - size) / 2;

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 300, 300);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSaveAvatar = async () => {
    if (!firebaseUser || !capturedImage) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        avatarUrl: capturedImage
      });

      setSuccessMsg('✅ Profile photo updated successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Save avatar error:', err);
      setCameraError('Failed to update avatar photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Profile Photo Studio</h3>
              <p className="text-xs text-slate-400">Take a photo to set as your avatar</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cameraError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Video stream / Captured photo view */}
        <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-2 border-emerald-500/40 bg-slate-950 shadow-inner flex items-center justify-center">
          {capturedImage ? (
            <img src={capturedImage} alt="Avatar Snapshot" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              {!stream && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-500 text-xs gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>Initializing Camera...</span>
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {!capturedImage ? (
            <button
              onClick={capturePhoto}
              disabled={!stream}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Camera className="w-4 h-4" /> Take Snapshot
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={retakePhoto}
                disabled={saving}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={handleSaveAvatar}
                disabled={saving}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Set as Avatar'}
              </button>
            </div>
          )}
        </div>

        {/* Current Avatar preview */}
        {userProfile?.avatarUrl && (
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <span>Current Avatar:</span>
            <img src={userProfile.avatarUrl} alt="Current" className="w-6 h-6 rounded-full object-cover border border-emerald-400" />
          </div>
        )}

      </div>
    </div>
  );
};
