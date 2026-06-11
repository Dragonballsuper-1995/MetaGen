"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTitleVariants } from "@/lib/api";
import type { GenerationStatus } from "@/lib/types";

export function useTitleVariants(generationStatus: GenerationStatus, generatedTitle?: string) {
  const [generatedScript, setGeneratedScript] = useState("");
  const [titleVariants, setTitleVariants] = useState<string[]>([]);
  const variantCacheRef = useRef<Map<string, string[]>>(new Map());

  const dedupeVariantTitles = useCallback((baseTitle: string, variants: string[]) => {
    const merged = [baseTitle, ...variants]
      .map((title) => (typeof title === "string" ? title.trim() : ""))
      .filter((title): title is string => Boolean(title));

    return Array.from(new Map(merged.map((title) => [title.toLowerCase(), title])).values()).slice(0, 3);
  }, []);

  useEffect(() => {
    const baseTitle = generatedTitle?.trim();
    if (!baseTitle || generationStatus !== "completed") {
      return;
    }

    let cancelled = false;
    const sourceScript = generatedScript.trim();

    const loadVariants = async () => {
      if (!sourceScript) {
        return;
      }

      const cacheKey = `${baseTitle.toLowerCase()}::${sourceScript.toLowerCase()}`;
      const cached = variantCacheRef.current.get(cacheKey);
      if (cached) {
        if (!cancelled) {
          setTitleVariants(cached);
        }
        return;
      }

      try {
        const variants = await getTitleVariants(sourceScript, baseTitle, 2);
        if (cancelled) {
          return;
        }

        const finalTitles = dedupeVariantTitles(baseTitle, variants);
        variantCacheRef.current.set(cacheKey, finalTitles);
        setTitleVariants(finalTitles);
      } catch {
        if (cancelled) {
          return;
        }

        const fallback = dedupeVariantTitles(baseTitle, []);
        variantCacheRef.current.set(cacheKey, fallback);
        setTitleVariants(fallback);
      }
    };

    void loadVariants();

    return () => {
      cancelled = true;
    };
  }, [generationStatus, generatedScript, generatedTitle, dedupeVariantTitles]);

  const beginGeneration = useCallback((script: string) => {
    setGeneratedScript(script);
    setTitleVariants([]);
  }, []);

  const resetVariants = useCallback(() => {
    setGeneratedScript("");
    setTitleVariants([]);
  }, []);

  const restoreVariantsFromHistory = useCallback((script: string, title?: string) => {
    setGeneratedScript(script);
    setTitleVariants(title ? [title] : []);
  }, []);

  return {
    titleVariants,
    beginGeneration,
    resetVariants,
    restoreVariantsFromHistory,
  };
}
