"use client"

import * as React from "react"
import { motion } from "framer-motion"

export function LoadingMatrix() {
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    const intervals = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 1800),
    ]
    return () => intervals.forEach(clearTimeout)
  }, [])

  const logs = [
    "> INITIATING SECURE CONNECTION TO INFERENCE ENGINE...",
    "> EXTRACTING ENTITIES AND SEMANTIC NODES...",
    "> SYNTHESIZING YOUTUBE METADATA PAYLOAD...",
  ]

  return (
    <div className="flex flex-col gap-2 p-8 font-mono text-xs uppercase tracking-widest min-h-[300px]">
      {logs.map((log, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: step >= index ? 1 : 0 }}
          transition={{ duration: 0, ease: "linear" }}
          className="flex items-center gap-2"
        >
          <span className={step > index ? "text-success" : "text-primary"}>
            {log}
          </span>
          {step === index && (
            <motion.span
              animate={{ opacity: [1, 1, 0, 0, 1] }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.8, 
                times: [0, 0.49, 0.5, 0.99, 1],
                ease: "linear" 
              }}
              className="w-2 h-3 bg-primary inline-block ml-1"
            />
          )}
          {step > index && (
            <span className="text-success font-bold">[OK]</span>
          )}
        </motion.div>
      ))}
    </div>
  )
}
