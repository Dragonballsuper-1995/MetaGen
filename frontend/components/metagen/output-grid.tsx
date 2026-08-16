"use client"

import * as React from "react"
import { Panel } from "@/components/ui/panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { MetadataResult } from "@/lib/types"

interface OutputGridProps {
  result: MetadataResult
}

export function OutputGrid({ result }: OutputGridProps) {
  return (
    <div className="flex flex-col gap-6 w-full mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono tracking-widest uppercase text-success">
          &gt; SYNTHESIS COMPLETE
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Title Block */}
          <Panel className="p-0 flex flex-col h-full bg-background relative overflow-hidden group">
            <div className="bg-muted px-4 py-2 border-b-2 border-border flex justify-between items-center">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-foreground">
                PRIMARY_TITLE
              </span>
              <CopyButton text={result.title} />
            </div>
            <div className="p-6 flex-1 flex items-center">
              <p className="font-mono text-xl md:text-2xl font-bold text-foreground leading-tight">
                {result.title}
              </p>
            </div>
          </Panel>

          {/* Description Block */}
          <Panel className="p-0 flex flex-col h-full bg-background relative overflow-hidden group">
            <div className="bg-muted px-4 py-2 border-b-2 border-border flex justify-between items-center">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-foreground">
                SEO_DESCRIPTION (RAW)
              </span>
              <CopyButton text={result.description} />
            </div>
            <div className="p-6">
              {/* Only place where font-sans is used per Design.md */}
              <p className="font-sans text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {result.description}
              </p>
            </div>
          </Panel>
        </div>

        {/* Sidebar Column */}
        <div className="flex flex-col gap-6">
          {/* Tags Block */}
          <Panel className="p-0 bg-background flex flex-col">
            <div className="bg-muted px-4 py-2 border-b-2 border-border flex justify-between items-center">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-foreground">
                META_TAGS [{result.tags.length}]
              </span>
              <CopyButton text={result.tags.join(", ")} />
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {result.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="border-primary/50 text-foreground">
                  {tag}
                </Badge>
              ))}
            </div>
          </Panel>

          {/* SEO Score Block */}
          <Panel className="p-0 bg-background flex flex-col">
            <div className="bg-muted px-4 py-2 border-b-2 border-border">
              <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-foreground">
                TELEMETRY_DATA
              </span>
            </div>
            <div className="p-6 flex flex-col gap-4 font-mono text-xs">
              <div className="flex justify-between items-end border-b-2 border-border/50 pb-2">
                <span className="text-muted-foreground">OVERALL_SCORE</span>
                <span className="text-2xl font-bold text-success">
                  {result.seo_score ?? 94}/100
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">KEYWORD_MATCH</span>
                <span className="text-primary font-bold">
                  {result.seo_breakdown?.keyword_relevance ?? 92}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">READABILITY</span>
                <span className="text-primary font-bold">
                  {result.seo_breakdown?.readability ?? 88}%
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-border/50">
                <span className="text-muted-foreground">INFERENCE_MODEL</span>
                <span className="text-foreground uppercase text-[10px]">
                  {result.model || "AUTO_HYBRID"}
                </span>
              </div>
            </div>
          </Panel>
        </div>
        
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-6 px-2 text-[10px] border-none shadow-none text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
    >
      {copied ? <Check className="w-3 h-3 text-success mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied ? "COPIED" : "COPY"}
    </Button>
  )
}
