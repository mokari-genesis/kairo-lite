import { motion } from 'framer-motion'
import { useTheme } from '@/app/themeContext'

const cursorVariants = {
  blinking: {
    opacity: [0, 0, 1, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      repeatDelay: 0,
      ease: 'linear' as const,
      times: [0, 0.5, 0.5, 1],
    },
  },
}

export default function CursorBlinker() {
  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'

  return (
    <motion.div
      variants={cursorVariants}
      animate='blinking'
      className='inline-block h-5 w-[1px] translate-y-1'
      style={{
        backgroundColor: isDark ? '#e2e8f0' : '#1e293b',
      }}
    />
  )
}
