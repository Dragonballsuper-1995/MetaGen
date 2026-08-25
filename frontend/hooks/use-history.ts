"use client"

import { useState, useEffect, useCallback } from "react"
import { HistoryItem, MetadataResult } from "@/lib/types"

const STORAGE_KEY = "metagen_neural_cache_v2"

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load Neural Cache", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Sync to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
  }, [history, isLoaded])

  const addToHistory = useCallback((result: MetadataResult, script: string) => {
    const newItem: HistoryItem = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: result.title,
      description: result.description,
      tags: result.tags,
      seo_score: result.seo_score,
      seo_breakdown: result.seo_breakdown,
      model: result.model,
      script,
      time: new Date().toISOString(),
    }

    setHistory((prev) => [newItem, ...prev].slice(0, 50)) // Keep last 50
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error("Failed to clear Neural Cache", e)
    }
  }, [])

  return {
    history,
    addToHistory,
    clearHistory,
    isLoaded,
  }
}
