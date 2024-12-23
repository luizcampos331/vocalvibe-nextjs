import { FaMicrophone, FaStop } from "react-icons/fa"

type AudioRecordProps = {
  isRecording: boolean
  startRecording(): void
  stopRecording(): void
}

export default function AudioRedord({ isRecording, startRecording, stopRecording }: AudioRecordProps) {
  return !isRecording ? (
    <button
      className="bg-green-500 text-white p-4 rounded-full"
      onClick={startRecording}
    >
      <FaMicrophone size={30} />
    </button>
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
  )
}