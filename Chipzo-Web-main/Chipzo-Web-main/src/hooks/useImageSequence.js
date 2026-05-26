import { useMemo, useRef, useEffect, useState } from 'react'

const buildFrameList = (count, isMobile) => {
  const step = isMobile ? 2 : 1
  const frames = []
  for (let i = 1; i <= count; i += step) {
    frames.push(`/sequence/arduino-nano-exploded/ezgif-frame-${String(i).padStart(3, '0')}.jpg`)
  }
  return frames
}

/**
 * A specialized hook for high-performance image sequence rendering.
 * It provides a render function that can be driven by any external timeline.
 */
export default function useImageSequence({
  canvasRef,
  frameCount = 240,
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
  const frameSources = useMemo(() => buildFrameList(frameCount, isMobile), [frameCount, isMobile])
  const imagesRef = useRef([])

  useEffect(() => {
    const loadImages = async () => {
      const promises = frameSources.map((source) => {
        return new Promise((resolve) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = () => resolve(image)
          image.src = source
        })
      })
      imagesRef.current = await Promise.all(promises)
      setIsLoaded(true)
    }
    loadImages()
  }, [frameSources])

  const render = (progress) => {
    if (!isLoaded) {
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) {
      return
    }

    // Safely map progress (0.0 to 1.0) to frame index for both desktop and mobile lists
    const frameIndex = Math.min(
      Math.max(Math.round(progress * (imagesRef.current.length - 1)), 0),
      imagesRef.current.length - 1
    )
    
    const frame = imagesRef.current[frameIndex]
    if (!frame || !frame.complete || frame.naturalWidth === 0) {
      return
    }

    const width = window.innerWidth
    const height = window.innerHeight
    const ratio = Math.min(window.devicePixelRatio || 1, 2)

    const scale = Math.min(width / frame.naturalWidth, height / frame.naturalHeight) * 1.18
    const renderWidth = frame.naturalWidth * scale
    const renderHeight = frame.naturalHeight * scale
    const x = (width - renderWidth) / 2
    const y = (height - renderHeight) / 2

    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.fillStyle = '#F1F1EF'
    context.fillRect(0, 0, width, height)
    context.drawImage(frame, x, y, renderWidth, renderHeight)
  }

  return { render, isLoaded }
}