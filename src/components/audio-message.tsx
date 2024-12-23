'use client'

import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import WaveSurfer from "wavesurfer.js";

type AudioMessageProps = {
  sender: string;
  audio: string;
};

export default function AudioMessage({ sender, audio }: AudioMessageProps) {
  const [duration, setDuration] = useState('00:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#aeaeae",
        progressColor: "#3b3b3b",
        height: 40,
        barWidth: 2,
        cursorWidth: 0,
      });

      wavesurfer.current.load(audio).then(() => {
        setDuration(formatTime(wavesurfer.current?.getDuration() || 0));
      });

      wavesurfer.current.on("finish", () => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (wavesurfer.current) wavesurfer.current.destroy();
    };
  }, [audio, sender]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(wavesurfer.current.isPlaying());
    }
  };

  return (
    <div className={`flex ${sender === "left" ? "justify-start" : "justify-end"}`}>
      <div className={`flex items-center gap-2 p-2 rounded-full ${sender === "left" ? "bg-gray-100 text-black" : "bg-gray-600 text-white"} w-[60%]`}>
        <button
          className="flex justify-center items-center w-[40px] h-[40px] bg-black shadow rounded-full"
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <FaPause color="white" />
          ) : (
            <FaPlay color="white" />
          )}
        </button>
        <div ref={waveformRef} className="w-[65%]"></div>
        <span className="text-sm">{duration}</span>
      </div>
    </div>
  );
}