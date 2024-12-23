'use client'

import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay, FaTrashAlt } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import WaveSurfer from "wavesurfer.js";

type AudioMessageProps = {
  isPreviewing: boolean;
  audioBlob: Blob | null;
  confirmPreview(): void;
  cancelPreview(): void;
};

export default function AudioPreview({ isPreviewing, audioBlob, confirmPreview, cancelPreview }: AudioMessageProps) {
  const wavesurferRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPreviewing && audioBlob) {
      const wavesurfer = WaveSurfer.create({
        container: wavesurferRef.current,
        waveColor: "#949494",
        progressColor: "#ffffff",
        height: 40,
        barWidth: 2,
        cursorWidth: 0,
      });

      wavesurferRef.current = wavesurfer;
      const audioUrl = URL.createObjectURL(audioBlob);
      wavesurfer.load(audioUrl);

      wavesurfer.on("finish", () => {
        setIsPlaying(false);
      });

      return () => {
        wavesurfer.destroy();
      };
    }
  }, [isPreviewing, audioBlob]);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(wavesurferRef.current.isPlaying());
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 w-[400px]">
      <button
        className="flex justify-center items-center w-[40px] h-[40px] bg-white shadow rounded-full"
        onClick={handlePlayPause}
      >
        {isPlaying ? (
          <FaPause color="black" />
        ) : (
          <FaPlay color="black" />
        )}
      </button>
      <div ref={wavesurferRef} className="w-[60%]"></div>
      <button
        className="flex justify-center items-center w-[40px] h-[40px] bg-blue-400 shadow rounded-full"
        onClick={confirmPreview}
      >
        <IoSend color="white" size={20} />
      </button>
      <button
        className="bg-transparen"
        onClick={cancelPreview}
      >
        <FaTrashAlt color="white" size={25} />
      </button>
    </div>
  );
}