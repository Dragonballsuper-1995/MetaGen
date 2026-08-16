"use client"

/**
 * MetaGen Mechanical & Analog Audio Synthesizer
 * Uses Web Audio API to create authentic tactile clicks, ratchet ticks, and relay sounds
 * with zero external asset dependencies.
 */

class SoundEngine {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false

  constructor() {
    if (typeof window !== "undefined") {
      const storedMute = localStorage.getItem("metagen_audio_muted")
      this.isMuted = storedMute === "true"
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (typeof window !== "undefined") {
      localStorage.setItem("metagen_audio_muted", String(this.isMuted))
    }
    return this.isMuted
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  /**
   * Mechanical Key Switch Click (Cherry MX / Calculator Key style)
   */
  public playClick(pitch: number = 800) {
    if (this.isMuted) return
    this.initContext()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(pitch, now)
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.035)

      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.035)
    } catch {
      // Audio fallback silent
    }
  }

  /**
   * Rotary Encoder Ratchet Tick (Tactile physical knob turn)
   */
  public playRatchet(freq: number = 1400) {
    if (this.isMuted) return
    this.initContext()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, now)
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.018)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.018)
    } catch {
      // Audio fallback
    }
  }

  /**
   * Heavy Relay Snap (For Master Record button or Mode switches)
   */
  public playRelaySnap() {
    if (this.isMuted) return
    this.initContext()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      
      // High click
      const osc1 = this.ctx.createOscillator()
      const gain1 = this.ctx.createGain()
      osc1.type = "square"
      osc1.frequency.setValueAtTime(1800, now)
      osc1.frequency.exponentialRampToValueAtTime(80, now + 0.04)
      gain1.gain.setValueAtTime(0.15, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      osc1.connect(gain1)
      gain1.connect(this.ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.04)

      // Low mechanical thud
      const osc2 = this.ctx.createOscillator()
      const gain2 = this.ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.setValueAtTime(150, now)
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.08)
      gain2.gain.setValueAtTime(0.25, now)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc2.connect(gain2)
      gain2.connect(this.ctx.destination)
      osc2.start(now)
      osc2.stop(now + 0.08)
    } catch {
      // Audio fallback
    }
  }

  /**
   * Synthesizer Success Chime (Completed Generation)
   */
  public playSuccessChime() {
    if (this.isMuted) return
    this.initContext()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const freqs = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
      
      freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator()
        const gain = this.ctx!.createGain()
        const start = now + i * 0.06
        
        osc.type = "sine"
        osc.frequency.setValueAtTime(f, start)
        
        gain.gain.setValueAtTime(0.1, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25)
        
        osc.connect(gain)
        gain.connect(this.ctx!.destination)
        
        osc.start(start)
        osc.stop(start + 0.25)
      })
    } catch {
      // Audio fallback
    }
  }
}

export const sound = new SoundEngine()
