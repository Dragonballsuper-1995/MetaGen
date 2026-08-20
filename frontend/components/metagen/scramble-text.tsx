"use client"

import * as React from "react"

const MATRIX_GLYPHS = "01■⬝·░▒▓#+*!§$%=<>[]{}@&"

interface ScrambleTextProps {
  text: string
  duration?: number
  speed?: number
  className?: string
  as?: "span" | "p" | "h1" | "h2" | "h3" | "div"
}

export function ScrambleText({
  text,
  duration = 600,
  speed = 25,
  className = "",
  as: Component = "span",
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = React.useState(text)

  React.useEffect(() => {
    let frame = 0
    const totalFrames = Math.max(1, Math.floor(duration / speed))
    const length = text.length

    const interval = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      const revealedCount = Math.floor(progress * length)

      const scrambled = text
        .split("")
        .map((char, index) => {
          if (index < revealedCount) {
            return char
          }
          if (char === " " || char === "\n") {
            return char
          }
          return MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)]
        })
        .join("")

      setDisplayText(scrambled)

      if (frame >= totalFrames) {
        clearInterval(interval)
        setDisplayText(text)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, duration, speed])

  return <Component className={className}>{displayText}</Component>
}
