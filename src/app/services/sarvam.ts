const SARVAM_API_URL = 'https://api.sarvam.ai';

export interface SarvamSTTResponse {
    transcript: string;
    confidence: number;
}

export interface SarvamTTSResponse {
    audio_content: string; // Base64 encoded audio
}

export class SarvamService {
    private static apiKey = (import.meta as any).env.VITE_SARVAM_API_KEY || '';

    static setApiKey(key: string) {
        this.apiKey = key;
    }

    static async speechToText(audioBlob: Blob): Promise<SarvamSTTResponse> {
        if (!this.apiKey) {
            throw new Error('Sarvam AI API Key is missing');
        }

        const formData = new FormData();
        // Browser MediaRecorder usually outputs webm audio
        formData.append('file', audioBlob, 'speech.webm');
        formData.append('model', 'saaras:v3');
        formData.append('language_code', 'en-IN');

        const response = await fetch(`${SARVAM_API_URL}/speech-to-text`, {
            method: 'POST',
            headers: {
                'api-subscription-key': this.apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Speech to text failed');
        }

        return response.json();
    }

    static async textToSpeech(text: string, languageCode: string = 'hi-IN'): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Sarvam AI API Key is missing');
        }

        const response = await fetch(`${SARVAM_API_URL}/text-to-speech`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': this.apiKey,
            },
            body: JSON.stringify({
                inputs: [text],
                target_language_code: languageCode,
                speaker: "meera",
                pitch: 0,
                pace: 1.0,
                loudness: 1.5,
                speech_sample_rate: 8000,
                enable_preprocessing: true,
                model: "bulbul:v1"
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Text to speech failed');
        }

        const data = await response.json();
        return data.audios[0]; // Accessing the first audio output from the audios array
    }
}
