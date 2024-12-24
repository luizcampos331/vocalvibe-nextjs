'use client'
import { useEffect, useRef, useState } from "react";
import AudioMessage from "../components/audio-message";
import AudioPreview from "@/components/audio-preview";
import AudioRedord from "@/components/audio-record";
import ConversationCommands from "@/components/conversation-commands";
import api from "@/services/api";
import WebSocketService from "@/services/web-socket";

export default function Home() {
  const [conversationStarted, setConversationStarted] = useState(false);
  const [conversationFinished, setConversationFinished] = useState(false);
  const [audioMessages, setAudioMessages] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleStartConversation = async () => {
    try {
      const createResponse = await api.post("/pipeline-conversations");
      await api.post(`/pipeline-conversations/${createResponse.data.id}/start`);
      setConversationStarted(true);
    } catch (error) {
      console.error(error);
    }
  }

  const handleResetConversation = () => {
    setAudioMessages([])
    setConversationStarted(false);
    setConversationFinished(false);
  }

  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    streamRef.current = stream;

    const audioChunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
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

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleConfirmPreview = async () => {
    if (audioBlob) {
      const webSocketService = new WebSocketService();

      const fileBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(Buffer.from(reader.result as ArrayBuffer));
        reader.onerror = reject;
        reader.readAsArrayBuffer(audioBlob);
      });

      webSocketService.emit("answer-question", {
        fileBuffer,
        filename: `awnser-question-${audioMessages[audioMessages.length - 1].pipelineConversationQuestionId}.webm`,
        pipelineConversationQuestionId: audioMessages[audioMessages.length - 1].pipelineConversationQuestionId,
      });

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

  useEffect(() => {
    const webSocketService = new WebSocketService();
    webSocketService.listen("send-question-to-user", (data) => {
      const audioBlob = new Blob([data.question.audio], { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);

      setAudioMessages((prev) => [
        ...prev,
        { sender: "left", audio: audioUrl, pipelineConversationQuestionId: data.pipelineConversationQuestionId },
      ]);
    });

    webSocketService.listen("finish-pipeline-conversation", (data) => {
      setConversationFinished(true);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-10">
      <main className="flex flex-col gap-8 items-center flex-grow">
        <h1 className="text-3xl font-bold text-center">Conversation</h1>
        <div>
          <ConversationCommands
            conversationStarted={conversationStarted}
            startConversation={handleStartConversation}
            resetConversation={handleResetConversation}
          />
        </div>

        <div className="min-w-[350px] max-w-[500px] w-full">
          <div className=" flex flex-col overflow-y-auto border border-solid border-black/[.08] dark:border-white/[.145] p-4 rounded max-h-[calc(100vh-20rem)] min-h-[50px] gap-5">
            {!conversationStarted && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Press "start" button and initiate your conversation with the AI
              </p>
            )}
            {conversationFinished && (
              <>
                <h3 className="text-2xl text-center text-gray-500 dark:text-gray-400">
                  Converssation finished
                </h3>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Press "restart" button and reinitiate your conversation with the AI
                </p>
              </>
            )}
            {audioMessages.map((msg, index) => (
              <AudioMessage
                key={index}
                sender={msg.sender}
                audio={msg.audio}
              />
            ))}
          </div>

          {conversationStarted && !conversationFinished && (
            <div className="flex justify-center gap-4 mt-4">
              {!isPreviewing ? (
                <div className="flex items-center gap-4">
                  <AudioRedord
                    isRecording={isRecording}
                    startRecording={handleStartRecording}
                    stopRecording={handleStopRecording}
                  />
                </div>
              ) : (
                <AudioPreview
                  isPreviewing={isPreviewing}
                  audioBlob={audioBlob}
                  confirmPreview={handleConfirmPreview}
                  cancelPreview={handleCancelPreview}
                />
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