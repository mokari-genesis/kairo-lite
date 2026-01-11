import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import CursorBlinker from './CursorBlinker'
import { useEffect } from 'react'

export default function TextAnim() {
  const baseText = 'Bienvenido!'
  const count = useMotionValue(0)

  const rounded = useTransform(count, latest => Math.round(latest))
  const displayText = useTransform(rounded, latest => baseText.slice(0, latest))

  useEffect(() => {
    const controls = animate(count, baseText.length, {
      type: 'tween',
      duration: 2,
      ease: 'easeInOut',
    })
    return controls.stop
  }, [])

  return (
    <span className=''>
      <motion.h1
        style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#1a365d',
          margin: 0,
          background: 'linear-gradient(45deg, #1a365d, #4299e1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {displayText}
      </motion.h1>

      <CursorBlinker />
    </span>
  )
}
