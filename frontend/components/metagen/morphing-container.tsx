"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  Wand2,
  Brain,
  Type,
  AlignLeft,
  Tags,
  Copy,
  Check,
  RefreshCw,
  RotateCcw,
  Zap,
  Clock,
  Cpu,
  Play,
  Upload,
  BarChart3,
  Target,
  BookOpen,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppState, GenerationResult } from "@/app/page";
import type { ModelChoice } from "@/lib/types";

interface MorphingContainerProps {
  state: AppState;
  inputScript: string;
  result: GenerationResult | null;
  onGenerate: (script: string, overrideModel?: ModelChoice) => void;
  onRegenerate: () => void;
  onReset: () => void;
  onInputChange: (script: string) => void;
  streamTokens?: string;
  streamTags?: string[] | null;
  selectedModel: ModelChoice;
  onModelChange: (model: ModelChoice) => void;
}

const SAMPLE_SCRIPTS = [
  "In this video, we dive deep into the world of sustainable architecture. We'll explore how modern skyscrapers are incorporating vertical forests, advanced solar harvesting, and closed-loop water systems to reduce their carbon footprint. From Singapore's Jewel Changi to Milan's Bosco Verticale, discover the future of urban living.",
  "Hey everyone! Today I'm sharing my top 5 secrets for mastering street photography. We'll talk about overcoming the fear of photographing strangers, choosing the right lens for candid moments, and how to use natural light to create dramatic, high-contrast compositions. Stick around until the end for a live editing session in Lightroom.",
  "What actually happens inside a black hole? This question has puzzled physicists for decades. In this episode of Space Odyssey, we break down the event horizon, spaghettification, and the information paradox. We'll use the latest simulations to visualize the bending of spacetime and discuss what Hawking Radiation tells us about the end of the universe.",
  "Is the $3,500 Vision Pro actually worth it? After using Apple's spatial computer for 30 days as my primary workstation, I have some thoughts. We'll look at the productivity benefits, the 'uncanny valley' of digital personas, and whether this is truly the beginning of the post-Mac era or just an expensive dev kit.",
  "Welcome back to the channel! Today we're going through a brutal 20-minute HIIT workout that you can do entirely at home with zero equipment. This routine focuses on explosive plyometrics, core stabilization, and cardiovascular endurance to maximize calorie burn in minimum time. Let's get to work!",
  "In this tutorial, I'll show you how to make the ultimate authentic Carbonara. No heavy cream, no peas, just four simple ingredients: guanciale, pecorino romano, black pepper, and eggs. I'll share the secret technique for emulsifying the sauce perfectly so you never end up with scrambled eggs. Let's start cooking.",
  "Join me on a 48-hour adventure through the hidden streets of Kyoto, Japan. We're avoiding the tourist traps and exploring secret temples, traditional matcha tea houses, and an exclusive omakase dining experience hidden in an alleyway. This is Kyoto like you've never seen it before.",
  "Is the S&P 500 still a safe bet for retirement? In today's market analysis, we break down the historical performance of index funds, the impact of inflation on your purchasing power, and how to build a recession-proof dividend portfolio. Remember, I am not a financial advisor, so always do your own research.",
  "This new patch completely broke the meta. Today we're analyzing the top 5 most overpowered loadouts in Season 4. From the ridiculous time-to-kill on the new SMG to the movement exploits that the pros are abusing, you need to use these builds before they get nerfed.",
  "I tried the 'Monk Mode' productivity protocol for 30 days, and it completely changed my life. In this video, we'll discuss dopamine fasting, deep work blocks, and how cutting out cheap stimulation helped me write an entire book in one month. Here is exactly how you can implement this routine.",
  "The true story of the Library of Alexandria is more fascinating than the myths. We uncover the archaeological evidence of its true scale, the groundbreaking discoveries made by its scholars, and the surprising real reason why it was ultimately destroyed. It wasn't just a fire.",
  "Stop using useEffect for data fetching in React! In this comprehensive tutorial, we cover the modern paradigms for state management and data loading in Next.js 14. We'll build a live dashboard using React Server Components, Server Actions, and optimistic UI updates to create a blazing-fast user experience.",
  "We finally got our hands on the 2025 Porsche 911 GT3 RS. We're taking it to the Nürburgring to test the active aerodynamics, the screaming naturally aspirated flat-six, and the crazy drag reduction system. Is this the ultimate track weapon, or has it become too clinical?",
  "Welcome to this spectacular $15 Million modern architectural masterpiece in the Hollywood Hills. Featuring automated sliding glass walls, an infinity edge pool overlooking the LA skyline, and a 12-car subterranean gallery, this home redefines luxury living. Let's step inside.",
  "Why do we sabotage our own success? Today we're exploring the psychology of procrastination. We'll look at the neurological pathways of the 'Instant Gratification Monkey', how perfectionism paralyzes us, and 3 actionable cognitive behavioral techniques to overcome resistance.",
  "Transform your small urban balcony into a thriving permaculture garden. I'll guide you through setting up self-watering planters, companion planting for natural pest control, and growing high-yield vegetables in limited space. You don't need a backyard to grow your own food.",
  "How did Metro Boomin get that signature dark bounce sound on his latest album? We are deconstructing the beat from scratch. I'll show you the exact drum kits, 808 glides, and haunting synthesizer presets used, and how to mix them for maximum punch.",
  "Dune by Frank Herbert is arguably the greatest sci-fi novel ever written. In this deep dive, we analyze the complex geopolitical themes, the ecological messaging, and how the concept of the 'Kwisatz Haderach' subverts the traditional hero's journey. Spoilers ahead!",
  "The old money aesthetic is everywhere, but how do you actually build a timeless capsule wardrobe on a budget? I'm breaking down the 10 essential pieces you need, the importance of fabric composition over brand names, and how to seamlessly layer for transitioning seasons.",
  "It remains one of the most baffling unsolved heists in history. The 1990 Isabella Stewart Gardner Museum theft saw half a billion dollars in art vanish into the night. We examine the suspects, the mafia connections, and the empty frames that still hang on the walls today."
];

const QUICK_SAMPLES = [
  { label: "Tech Review", icon: <Cpu className="w-3 h-3" /> },
  { label: "Vlog / Lifestyle", icon: <Clock className="w-3 h-3" /> },
  { label: "Educational", icon: <Brain className="w-3 h-3" /> },
  { label: "Random", icon: <Sparkles className="w-3 h-3" /> }
];

const ACTIVE_TRANSITION = {
  initial: { opacity: 0, filter: "blur(10px)", scale: 0.98 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
  exit: { opacity: 0, filter: "blur(10px)", scale: 1.02 }
};

const SPRING_CONFIG = { stiffness: 400, damping: 35 };

export function MorphingContainer({
  state,
  inputScript,
  result,
  onGenerate,
  onRegenerate,
  onReset,
  onInputChange,
  streamTokens = "",
  streamTags = null,
  selectedModel,
  onModelChange,
}: MorphingContainerProps) {
  const [script, setScript] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sampleVersion, setSampleVersion] = useState(0);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(64);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInputState = state === "input";
  const isLoadingState = state === "loading";
  const isOutputState = state === "output";

  // Handle clicking outside the input area to collapse it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isInputState &&
        isPromptExpanded &&
        script.trim().length === 0 &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPromptExpanded(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isInputState, isPromptExpanded, script]);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Temporarily shrink to measure true scrollHeight
      const prevHeight = textarea.style.height;
      textarea.style.height = '1px';
      const scrollHeight = textarea.scrollHeight;
      setContentHeight(Math.min(scrollHeight, 400));
      textarea.style.height = prevHeight;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [script, isPromptExpanded, adjustHeight]);

  const generateSample = () => {
    const randomScript = SAMPLE_SCRIPTS[Math.floor(Math.random() * SAMPLE_SCRIPTS.length)];
    setSampleVersion((v) => v + 1);
    setIsPromptExpanded(true);
    if (isInputState) {
      setScript(randomScript);
      // Force height adjustment on next tick after script is set
      setTimeout(adjustHeight, 0);
    } else {
      onInputChange(randomScript);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const slicedContent = content.slice(0, 10000);
        if (isInputState) {
          setScript(slicedContent);
          setIsPromptExpanded(true);
          setTimeout(adjustHeight, 0);
        } else {
          onInputChange(slicedContent);
        }
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, 10000);
    if (isInputState) {
      setScript(value);
      if (value.length > 0 && !isPromptExpanded) setIsPromptExpanded(true);
    } else {
      onInputChange(value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (isInputState && !isPromptExpanded) setIsPromptExpanded(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSubmit = () => {
    if (script.trim()) {
      onGenerate(script.trim());
    }
  };

  const handleModelChangeInOutput = (newModel: ModelChoice) => {
    onModelChange(newModel);
    const text = inputScript.trim() || script.trim();
    if (text) {
      onGenerate(text, newModel);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllMetadata = async () => {
    if (!result) return;
    const text = `Title: ${result.title}\n\nDescription:\n${result.description}\n\nTags: ${result.tags.join(", ")}`;
    await navigator.clipboard.writeText(text);
    setCopiedField("all");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full relative items-center justify-center min-h-0">
      
      {/* Standard Flex Layout Container */}
      <AnimatePresence mode="wait">
        {isInputState && (
          <motion.div 
            ref={containerRef}
            key="input-view"
            className="w-full max-w-3xl flex flex-col items-center justify-center flex-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={SPRING_CONFIG}
          >
            {/* Hero Section */}
            <motion.div
              layout
              animate={{ 
                scale: isPromptExpanded ? 0.85 : 1,
                opacity: isPromptExpanded ? 0.9 : 1
              }}
              transition={SPRING_CONFIG}
              className="flex flex-col items-center justify-center px-4 w-full origin-bottom mb-4"
            >
              {/* Interactive Model Selector Pill Bar */}
              <motion.div layout className="inline-flex items-center gap-1.5 p-1 rounded-sm bg-background border-2 border-border mb-4 shadow-[2px_2px_0_0_var(--border)]">
                <button
                  onClick={() => onModelChange("auto")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-bold font-mono transition-all duration-200 ${
                    selectedModel === "auto"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  title="Auto Hybrid: Uses Groq Cloud with local Mistral fallback"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>AUTO</span>
                </button>
                <button
                  onClick={() => onModelChange("groq")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-bold font-mono transition-all duration-200 ${
                    selectedModel === "groq"
                      ? "bg-emerald-500 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  title="Groq 120B: OpenAI GPT-OSS 120B on ultra-fast Groq LPU (~500 T/s)"
                >
                  <Zap className="w-3 h-3" />
                  <span>GROQ_120B</span>
                </button>
                <button
                  onClick={() => onModelChange("mistral")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-bold font-mono transition-all duration-200 ${
                    selectedModel === "mistral"
                      ? "bg-blue-500 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  title="Custom Mistral: Fine-tuned 7B GGUF deployed on HuggingFace"
                >
                  <Brain className="w-3 h-3" />
                  <span>MISTRAL_7B</span>
                </button>
              </motion.div>

              <motion.h2 layout className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 text-center text-balance">
                <span className="text-foreground">Elevate Your</span>
                <span className="text-primary"> Video Metadata</span>
              </motion.h2>

              <motion.div layout className="relative w-full max-w-lg h-12 flex justify-center items-center">
                <AnimatePresence mode="wait">
                  {!isPromptExpanded ? (
                    <motion.p 
                      key="desc"
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute text-muted-foreground text-sm md:text-base text-center text-pretty w-full"
                    >
                      Transform scripts into SEO-optimized titles and descriptions in seconds.
                    </motion.p>
                  ) : (
                    <motion.div 
                      key="chips"
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ delay: 0.1 }}
                      className="absolute flex items-center justify-center gap-2 w-full"
                    >
                      {QUICK_SAMPLES.map((sample, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.preventDefault();
                            generateSample();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-primary/10 border border-border/50 hover:border-primary/30 text-xs font-semibold text-foreground/70 hover:text-primary transition-all duration-200"
                        >
                          {sample.icon}
                          {sample.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Input Card */}
            <motion.div
              layout
              className="w-full relative mt-2"
            >
              <motion.div
                layout
                className={`relative flex flex-col z-10 border-2 rounded-sm transition-all duration-300 ${isFocused ? 'border-primary shadow-[4px_4px_0_0_var(--primary)]' : 'border-border shadow-[4px_4px_0_0_var(--border)]'} bg-background`}
              >
                {/* Header (Only visible when expanded) */}
                <AnimatePresence>
                  {isPromptExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/30 shrink-0"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Input Script</span>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept=".txt,.md,.rtf"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onPointerDown={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault(); 
                            fileInputRef.current?.click(); 
                          }} 
                          className="h-8 gap-1.5 px-2 rounded-sm bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/20 transition-all duration-300"
                        >
                          <Upload className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Upload</span>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Textarea Area */}
                <motion.div 
                  layout 
                  animate={{ height: isPromptExpanded ? Math.max(160, contentHeight) : 64 }}
                  transition={SPRING_CONFIG}
                  className="relative overflow-hidden flex flex-col w-full"
                >
                  <AnimatePresence mode="wait">
                    <motion.div key={sampleVersion} {...ACTIVE_TRANSITION} className="h-full flex flex-col w-full bg-background/50">
                      <textarea
                        ref={textareaRef}
                        value={script}
                        onChange={onTextChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={{ overflowY: isPromptExpanded && contentHeight >= 350 ? 'auto' : 'hidden' }}
                        placeholder={isPromptExpanded ? "DESCRIBE VIDEO OR PASTE SCRIPT..." : "PASTE SCRIPT OR CLICK FOR SAMPLES..."}
                        className="w-full h-full p-5 md:px-6 bg-transparent text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none text-sm font-mono leading-relaxed custom-scrollbar uppercase"
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Footer (Expanded) */}
                <AnimatePresence>
                  {isPromptExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={SPRING_CONFIG}
                      className="px-5 pb-5 shrink-0 flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground font-mono uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {script.length} / 10000 BYTES
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleSubmit}
                        disabled={!script.trim()}
                        className="w-full group relative gap-2 rounded-sm h-12 text-sm"
                      >
                        <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        INITIATE SEQUENCE
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Collapsed Button */}
                <AnimatePresence>
                  {!isPromptExpanded && (
                    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-3 top-2.5">
                      <Button onClick={() => setIsPromptExpanded(true)} size="sm" className="rounded-sm h-10 w-10 p-0 hover:scale-[1.03] active:scale-95 transition-transform">
                        <Play className="w-4 h-4 ml-0.5" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output / Results Container */}
      <AnimatePresence mode="wait">
        {(!isInputState) && (
          <motion.div 
            key="output-view"
            className="w-full max-w-7xl flex flex-col h-full relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={SPRING_CONFIG}
          >
            {/* Header Actions */}
            {isOutputState && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0"
              >
                {/* Model Selector Bar on Results Page */}
                <div className="inline-flex items-center gap-1.5 p-1 rounded-sm bg-background border-2 border-border shadow-[2px_2px_0_0_var(--border)]">
                  <button
                    onClick={() => handleModelChangeInOutput("auto")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-bold font-mono transition-all duration-200 ${
                      selectedModel === "auto"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    title="Auto Hybrid: Uses Groq Cloud with local Mistral fallback"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AUTO</span>
                  </button>
                  <button
                    onClick={() => handleModelChangeInOutput("groq")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-bold font-mono transition-all duration-200 ${
                      selectedModel === "groq"
                        ? "bg-emerald-500 text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    title="Groq 120B: OpenAI GPT-OSS 120B on ultra-fast Groq LPU (~500 T/s)"
                  >
                    <Zap className="w-3 h-3" />
                    <span>GROQ_120B</span>
                  </button>
                  <button
                    onClick={() => handleModelChangeInOutput("mistral")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-bold font-mono transition-all duration-200 ${
                      selectedModel === "mistral"
                        ? "bg-blue-500 text-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    title="Custom Mistral: Fine-tuned 7B GGUF deployed on HuggingFace"
                  >
                    <Brain className="w-3 h-3" />
                    <span>MISTRAL_7B</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onReset} 
                    className="h-10 gap-2 text-[10px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">NEW_PROMPT</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onGenerate(inputScript)} 
                    className="h-10 gap-2 text-[10px]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">REFINE</span>
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={copyAllMetadata} 
                    className="h-10 gap-2 px-4 text-[10px]"
                  >
                    {copiedField === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>COPY_ALL</span>
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="grid gap-4 md:gap-6 flex-1 min-h-0 grid-cols-1 lg:grid-cols-12">
              {/* Output State Input Reference */}
              <div className="lg:col-span-4 h-full relative min-h-0">
                <div className="relative border-2 border-border/50 bg-background/50 rounded-sm overflow-hidden h-full flex flex-col z-10">
                  <div className="flex items-center justify-between px-5 py-3 border-b-2 border-border/40 bg-muted/30 shrink-0">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Source Script</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    <div className="p-5 relative overflow-hidden flex flex-col h-full">
                      <textarea
                        value={inputScript}
                        onChange={(e) => onInputChange(e.target.value.slice(0, 10000))}
                        className="w-full h-full bg-transparent text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none text-sm leading-relaxed overflow-y-auto pr-2 custom-scrollbar"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Content */}
              <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 overflow-hidden">
                {isLoadingState && !streamTokens && <div className="flex-1 flex flex-col justify-center py-12"><LoadingIndicator /></div>}
                
                {(isOutputState || (isLoadingState && streamTokens)) && (
                  <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar min-h-0 pb-2">
                    {/* Title Section */}
                    {(result?.title || (isLoadingState && streamTokens && !streamTokens.includes("\n\n"))) && (
                      <OutputPanel icon={<Type className="w-4 h-4" />} label="Optimized Title">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            <AnimatedResultText 
                              text={result?.title || streamTokens.split("\n\n")[0] || "Generating..."} 
                              className="text-lg md:text-xl font-extrabold text-foreground leading-tight tracking-tight" 
                            />
                            {isOutputState && result && <CopyButton onClick={() => copyToClipboard(result.title, "title")} copied={copiedField === "title"} />}
                          </div>
                        </div>
                      </OutputPanel>
                    )}

                    {/* Description Section */}
                    {(result?.description || (isLoadingState && streamTokens.includes("\n\n"))) && (
                      <OutputPanel icon={<AlignLeft className="w-4 h-4" />} label="AI-Generated Description">
                        <div className="flex items-start justify-between gap-4">
                          <AnimatedResultText 
                            text={result?.description || streamTokens.split("\n\n")[1] || "..."} 
                            className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium" 
                          />
                          {isOutputState && result && <CopyButton onClick={() => copyToClipboard(result.description, "description")} copied={copiedField === "description"} />}
                        </div>
                      </OutputPanel>
                    )}

                    {/* Tags Section */}
                    {(result?.tags?.length || streamTags?.length) && (
                      <OutputPanel icon={<Tags className="w-4 h-4" />} label="Relevant Tags">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(result?.tags || streamTags || []).map((tag, index) => (
                              <motion.button 
                                key={tag + index} 
                                initial={{ opacity: 0, scale: 0.8 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={{ delay: index * 0.05 }} 
                                onClick={() => isOutputState && copyToClipboard(tag, `tag-${index}`)} 
                                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-primary/10 border border-border/50 text-xs font-semibold text-foreground/70 hover:text-primary transition-all duration-200"
                              >
                                {tag} {copiedField === `tag-${index}` && <Check className="w-3 h-3 text-emerald-500 inline ml-1" />}
                              </motion.button>
                            ))}
                          </div>
                          {isOutputState && result && <CopyButton onClick={() => copyToClipboard(result.tags.join(", "), "tags")} copied={copiedField === "tags"} />}
                        </div>
                      </OutputPanel>
                    )}

                    {/* SEO Insights Panel (New) */}
                    {isOutputState && result?.seo_breakdown && (
                      <OutputPanel icon={<BarChart3 className="w-4 h-4" />} label="SEO Diagnostics">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          <SeoScoreItem icon={<Target className="w-3.5 h-3.5" />} label="Title" score={result.seo_breakdown.title} />
                          <SeoScoreItem icon={<AlignLeft className="w-3.5 h-3.5" />} label="Description" score={result.seo_breakdown.description} />
                          <SeoScoreItem icon={<Hash className="w-3.5 h-3.5" />} label="Tags" score={result.seo_breakdown.tags} />
                          <SeoScoreItem icon={<Sparkles className="w-3.5 h-3.5" />} label="Relevance" score={result.seo_breakdown.keyword_relevance} />
                          <SeoScoreItem icon={<BookOpen className="w-3.5 h-3.5" />} label="Readability" score={result.seo_breakdown.readability} />
                        </div>
                      </OutputPanel>
                    )}
                  </div>
                )}
                
                {isOutputState && result && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center justify-center gap-6 px-5 py-3 structural-panel rounded-sm shrink-0 mt-auto">
                    {result.seo_score !== undefined && (
                      <div className="flex items-center gap-2 pr-6 border-r border-border/30">
                        <div className="relative flex items-center justify-center">
                          <svg className="w-8 h-8 -rotate-90">
                            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted-foreground/20" />
                            <motion.circle 
                              cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="3" 
                              strokeDasharray="88" 
                              initial={{ strokeDashoffset: 88 }}
                              animate={{ strokeDashoffset: 88 - (88 * result.seo_score) / 100 }}
                              className="text-primary" 
                            />
                          </svg>
                          <span className="absolute text-[10px] font-black">{Math.round(result.seo_score)}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">SEO Score</span>
                      </div>
                    )}
                    <TelemetryItem icon={<Zap className="w-3 h-3" />} label="Latency" value={`${result.latency}s`} />
                    <TelemetryItem icon={<Cpu className="w-3 h-3" />} label="Model" value={result.model} />
                    <TelemetryItem icon={<Clock className="w-3 h-3" />} label="Ref" value={result.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedResultText({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <div className={`${className} flex flex-wrap gap-x-[0.35em] gap-y-[0.1em] will-change-contents`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, backgroundColor: "var(--primary)", color: "var(--background)" }}
          animate={{ opacity: 1, backgroundColor: "transparent", color: "inherit" }}
          transition={{ duration: 0.15, delay: Math.random() * 0.5, ease: "steps(2)" }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

function LoadingIndicator() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 h-full font-mono">
      <div className="w-16 h-16 rounded-sm bg-primary/10 border-2 border-primary/40 flex items-center justify-center mb-6 overflow-hidden relative shadow-[0_0_15px_rgba(0,132,255,0.2)]">
        <motion.div 
          animate={{ top: ["-10%", "110%"] }} 
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} 
          className="absolute w-full h-[2px] bg-primary/80 shadow-[0_0_10px_rgba(0,132,255,1)]" 
        />
        <Cpu className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-widest">
        PROCESSING_DATA_STREAM{dots}
      </h3>
      <div className="text-[10px] text-muted-foreground/80 leading-loose uppercase flex flex-col items-start text-left bg-background/50 p-3 border border-border/40 rounded-sm w-64">
        <span>> EXTRACTING_ENTITIES...</span>
        <span>> ANALYZING_NARRATIVE_ARC...</span>
        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>> GENERATING_OUTPUT...</motion.span>
      </div>
    </div>
  );
}

function OutputPanel({ icon, label, children, delay = 0 }: { icon: React.ReactNode; label: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }} className="structural-panel rounded-sm overflow-hidden shrink-0">
      <div className="flex items-center gap-2 px-5 py-2.5 border-b-2 border-border bg-muted/20">
        <div className="text-primary">{icon}</div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

function CopyButton({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className="flex-shrink-0 p-2.5 rounded-sm bg-secondary/80 border-2 border-transparent hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-foreground transition-all duration-200 active:scale-95"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function TelemetryItem({ icon, label, value, valueClassName = "" }: { icon: React.ReactNode; label: string; value: string; valueClassName?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 font-mono">
      <span className="text-primary">{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}:</span>
      <span className={`text-[9px] font-bold uppercase tracking-widest text-foreground ${valueClassName}`}>{value}</span>
    </motion.div>
  );
}

function SeoScoreItem({ icon, label, score }: { icon: React.ReactNode; label: string; score: number }) {
  const getTone = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-sm bg-background border-2 border-border/50 structural-panel">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{label}</span>
        </div>
        <span className={`text-[11px] font-mono font-bold ${getTone(score)}`}>{score}%</span>
      </div>
      <div className="h-1.5 w-full bg-border rounded-sm overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={`h-full ${getTone(score).replace('text-', 'bg-')}`}
        />
      </div>
    </div>
  );
}