import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash2, Loader2 } from "lucide-react";

export default function AudioRecorder({ onRecordingComplete, initialAudioUrl }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl || null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("دسترسی به میکروفون امکان‌پذیر نیست.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    onRecordingComplete(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-slate-800 rounded-lg border border-slate-700">
      {isRecording ? (
        <div className="flex items-center gap-3 w-full">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={stopRecording}
            className="mr-auto h-8"
          >
            <Square className="w-4 h-4 mr-1" /> توقف
          </Button>
        </div>
      ) : audioUrl ? (
        <div className="flex items-center gap-2 w-full">
          <audio src={audioUrl} controls className="h-8 flex-1 max-w-[200px]" />
          <Button 
            size="icon" 
            variant="ghost" 
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8"
            onClick={deleteRecording}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={startRecording}
          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 w-full"
        >
          <Mic className="w-4 h-4 mr-2" /> ضبط پیام صوتی
        </Button>
      )}
    </div>
  );
}