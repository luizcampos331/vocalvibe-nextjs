'use client'
import { useCallback, useEffect, useRef, useState } from "react";
import AudioMessage from "../components/audio-message";
import { FaMicrophone, FaPause, FaPlay, FaStop, FaTrashAlt } from "react-icons/fa";
import WaveSurfer from "wavesurfer.js";
import { IoSend } from "react-icons/io5";

export default function Home() {
  const [conversationStarted, setConversationStarted] = useState(false);
  const [audioMessages, setAudioMessages] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wavesurferRef = useRef<any>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPreviewing && audioBlob) {
      const wavesurfer = WaveSurfer.create({
        container: "#waveform",
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

    console.log('wavesurferRef.current', wavesurferRef.current)

      return () => {
        wavesurfer.destroy();
      };
    }
  }, [isPreviewing, audioBlob]);

  const handleStartConversation = () => {
    setAudioMessages([
      { sender: "left", audio: "f272033daf-question.mp3" },
      { sender: "right", audio: "f272033daf-question.mp3" },
      { sender: "left", audio: "f272033daf-question.mp3" },
      { sender: "right", audio: "f272033daf-question.mp3" },
    ])
    setConversationStarted(true);
  }

  const handleResetConversation = () => {
    setAudioMessages([])
    setConversationStarted(false);
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    streamRef.current = stream;

    const audioChunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/mp3" });
      setAudioBlob(blob);
      setIsPreviewing(true);
    };

    mediaRecorder.start();
    setIsRecording(true);

    audioContext.current = new AudioContext();
    const source = audioContext.current.createMediaStreamSource(stream);
    const analyser = audioContext.current.createAnalyser();
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateWave = () => {
      analyser.getByteFrequencyData(dataArray);
      if (isRecording) requestAnimationFrame(updateWave);
    };
    updateWave();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleAddToMessages = () => {
    if (audioBlob) {
      setAudioMessages((prev) => [
        ...prev,
        { sender: "right", audio: URL.createObjectURL(audioBlob) },
      ]);
      setAudioBlob(null);
      setIsPreviewing(false);
    }
    setIsRecording(false);
  };

  const handleCancelPreview = () => {
    setAudioBlob(null);
    setIsPreviewing(false);
    setIsRecording(false);
  };

  const handlePlayPause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
      setIsPlaying(wavesurferRef.current.isPlaying());
    }
  }, [wavesurferRef.current]);

  return (
    <div className="flex flex-col min-h-screen p-10">
      <main className="flex flex-col gap-8 items-center flex-grow">
        <h1 className="text-3xl font-bold text-center">Interview simulation</h1>
        <div>
          {audioMessages.length ? (
            <button
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
              onClick={handleResetConversation}
            >
              Restart
            </button>
          ) : (
            <button
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
              onClick={handleStartConversation}
            >
              Start
            </button>
          )}

        </div>

        <div className="min-w-[350px] max-w-[500px] w-full">
          <div className=" flex flex-col overflow-y-auto border border-solid border-black/[.08] dark:border-white/[.145] p-4 rounded max-h-[calc(100vh-20rem)] min-h-[50px] gap-5">
            {!conversationStarted && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Press "start" button and initiate the simularion interview in English
              </p>
            )}
            {audioMessages.map((msg, index) => (
              <AudioMessage
                key={index}
                sender={msg.sender}
                audio={msg.audio}
              />
            ))}
          </div>

          {conversationStarted && (
            <div className="flex justify-center gap-4 mt-4">
              {isRecording ? (
                <div className="flex items-center gap-4">
                  {isPreviewing ? (
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
                      <div id="waveform" className="w-[60%]"></div>
                      <button
                        className="flex justify-center items-center w-[40px] h-[40px] bg-blue-400 shadow rounded-full"
                        onClick={handleAddToMessages}
                      >
                        <IoSend color="white" size={20} />
                      </button>
                      <button
                        className="bg-transparen"
                        onClick={handleCancelPreview}
                      >
                        <FaTrashAlt color="white" size={25} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FaMicrophone size={30} />
                      <span>Recording...</span>
                      <button
                        className="bg-red-500 text-white p-3 rounded-full"
                        onClick={stopRecording}
                      >
                        <FaStop size={20} />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <button
                  className="bg-green-500 text-white p-4 rounded-full"
                  onClick={startRecording}
                >
                  <FaMicrophone size={30} />
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <footer className="text-center pt-10">
        <p>© 2025</p>
      </footer>
    </div>
  );
}