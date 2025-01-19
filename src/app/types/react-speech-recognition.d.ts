declare module 'react-speech-recognition' {
    const SpeechRecognition: {
        startListening: (options?: { continuous?: boolean }) => void;
        stopListening: () => void;
    };

    export function useSpeechRecognition(): {
        transcript: string;
        resetTranscript: () => void;
        browserSupportsSpeechRecognition: boolean;
    };

    export default SpeechRecognition;
} 