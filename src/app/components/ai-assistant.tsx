import { useState } from 'react';
import {
    Search, Mic, Sparkles, ArrowRight,
    Loader2, MessageSquare, BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useStore } from '../store';
import { SarvamService } from '../services/sarvam';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';
import stringSimilarity from 'string-similarity';

export function AiAssistant() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [isListening, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);

    const products = useStore((s) => s.products);
    const setSearchQuery = useStore((s) => s.setSearchQuery);
    const navigate = useNavigate();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/wav' });
                setIsRecording(false);
                setIsProcessing(true);
                try {
                    const result = await SarvamService.speechToText(audioBlob);
                    if (result.transcript) {
                        setQuery(result.transcript);
                        handleAiAction(result.transcript);
                    }
                } catch (err: any) {
                    toast.error(err.message || 'Speech recognition failed');
                } finally {
                    setIsProcessing(false);
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            toast.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isListening) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
            setMediaRecorder(null);
        }
    };

    const handleAiAction = async (text: string) => {
        setIsProcessing(true);
        setAiResponse(null);
        setRecommendations([]);

        const lowerText = text.toLowerCase();

        // 1. Check for product search intent
        const searchTerms = ['find', 'search', 'show', 'looking for', 'want', 'buy', 'need'];
        const isSearch = searchTerms.some(term => lowerText.includes(term));

        // 2. Extract product name if it's a search
        let targetProduct = text;
        if (isSearch) {
            searchTerms.forEach(term => {
                if (lowerText.startsWith(term)) {
                    targetProduct = text.slice(term.length).trim();
                }
            });
        }

        // 3. Find best matches
        const targets = Array.from(new Set([
            ...products.map(p => p.name),
            ...products.map(p => p.category.replace('-', ' ')),
            ...products.map(p => p.brand)
        ])).filter(Boolean);

        const match = stringSimilarity.findBestMatch(targetProduct.toLowerCase(), targets.map(t => t.toLowerCase()));

        if (match.bestMatch.rating > 0.3) {
            const bestMatchName = targets[match.bestMatchIndex];
            const matchedProducts = products.filter(p =>
                p.name.toLowerCase().includes(bestMatchName.toLowerCase()) ||
                p.category.toLowerCase().includes(bestMatchName.toLowerCase()) ||
                p.brand.toLowerCase().includes(bestMatchName.toLowerCase())
            ).slice(0, 3);

            if (matchedProducts.length > 0) {
                setRecommendations(matchedProducts);
                setAiResponse(`I found some ${bestMatchName} for you. Would you like to see them?`);
            } else {
                setAiResponse(`I couldn't find exactly what you're looking for, but here are some popular items.`);
                setRecommendations(products.slice(0, 3));
            }
        } else {
            setAiResponse("I'm not sure what you're looking for. Could you be more specific? I can help you find groceries, personal care items, or household essentials.");
        }

        setIsProcessing(false);
    };

    const handleSearch = () => {
        if (!query.trim()) return;
        setSearchQuery(query);
        setOpen(false);
        navigate('/products');
    };

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="fixed bottom-20 right-6 sm:bottom-10 sm:right-10 w-14 h-14 rounded-full shadow-2xl z-40 bg-gradient-to-br from-primary to-emerald-600 hover:scale-110 transition-all group"
                size="icon"
            >
                <BrainCircuit className="w-7 h-7 text-white animate-pulse" />
                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">AI</span>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-white">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                <span>Smart Assistant</span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="mt-6 relative">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="How can I help you today?"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-14 pl-12 pr-12 rounded-2xl focus-visible:ring-primary/50"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <button
                                onClick={isListening ? stopRecording : startRecording}
                                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                            {['Best deals', 'Fresh milk', 'Shampoo', 'Wholesale'].map(tag => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className="bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer text-white/70 py-1 px-3"
                                    onClick={() => { setQuery(tag); handleAiAction(tag); }}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 min-h-[200px] flex flex-col">
                        <AnimatePresence mode="wait">
                            {isProcessing ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-10 gap-3"
                                >
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <p className="text-sm text-muted-foreground font-medium text-center italic">
                                        {isListening ? 'Listening to you...' : 'Thinking...'}
                                    </p>
                                </motion.div>
                            ) : aiResponse ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <BrainCircuit className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="bg-white border border-border/60 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                            <p className="text-[14px] text-slate-700 leading-relaxed">{aiResponse}</p>
                                        </div>
                                    </div>

                                    {recommendations.length > 0 && (
                                        <div className="grid grid-cols-1 gap-3 ml-11">
                                            {recommendations.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => { setOpen(false); navigate(`/product/${p.id}`); }}
                                                    className="flex items-center gap-3 p-3 bg-white border border-border/60 rounded-xl hover:border-primary/40 hover:shadow-md transition-all group text-left"
                                                >
                                                    <img src={p.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-50" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">{p.name}</p>
                                                        <p className="text-[12px] text-muted-foreground">Rs.{p.customerPrice}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                                </button>
                                            ))}
                                            <Button
                                                variant="link"
                                                className="text-primary text-[13px] h-auto p-0 w-fit font-semibold"
                                                onClick={handleSearch}
                                            >
                                                See all results <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                            </Button>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 gap-4 opacity-40">
                                    <MessageSquare className="w-12 h-12 text-slate-300" />
                                    <p className="text-sm font-medium text-slate-400 text-center">
                                        Ask me to find products or check wholesale deals!
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
