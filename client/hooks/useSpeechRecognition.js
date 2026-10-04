import { useState, useEffect, useRef, useCallback } from 'react';

export default function useSpeechRecognition({ language = 'en-US', onResult, onStop }) {
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');
  const [unsupported, setUnsupported] = useState(false);
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      stopListening();
    };
  }, []);
  
  const stopListening = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (isMounted.current) {
      setListening(false);
      setInterimText('');
    }
    if (onStop) onStop();
  }, [onStop]);
  
  const startListening = useCallback(() => {
    setError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setUnsupported(true);
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    
    recognition.onstart = () => {
      if (!isMounted.current) return;
      setListening(true);
    };
    
    recognition.onresult = (event) => {
      if (!isMounted.current) return;
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (interimTranscript) {
        setInterimText(interimTranscript);
      }
      
      if (finalTranscript) {
        if (onResult) onResult(finalTranscript);
        setInterimText('');
      }
      
      // Auto-stop after 2 seconds of silence
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 2000);
    };
    
    recognition.onerror = (event) => {
      if (!isMounted.current) return;
      if (event.error === 'not-allowed') {
        setError('Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        setError("I didn't hear you, try again.");
      } else if (event.error === 'network') {
        setError('Network error occurred.');
      } else {
        setError(`Error: ${event.error}`);
      }
      stopListening();
    };
    
    recognition.onend = () => {
      if (!isMounted.current) return;
      // Chrome quirk: restarts itself sometimes or ends unexpectedly
      // Let's just set listening to false for now unless we manually stopped it
      setListening(false);
      setInterimText('');
    };
    
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setError('Could not start speech recognition.');
    }
  }, [language, onResult, stopListening]);
  
  const toggleListening = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);
  
  return {
    listening,
    interimText,
    error,
    unsupported,
    startListening,
    stopListening,
    toggleListening
  };
}
