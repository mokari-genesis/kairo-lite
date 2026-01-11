import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { useTheme } from '@/app/themeContext'
import { theme } from 'antd'

export default function RedoAnimText() {
  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'
  const {
    token: { colorText },
  } = theme.useToken()
  const textIndex = useMotionValue(0)
  const texts = [
    'Inventario claro, decisiones rápidas.',
    'Todo tu stock, en un solo vistazo.',
    'Control simple para crecer sin caos.',
    'Menos clics, más control.',
    'Tu inventario, siempre al día.',
    'Registra. Revisa. Reabastece.',
    'Sencillo de usar, potente al operar.',
    'Detecta quiebres antes de que sucedan.',
    'Vende con confianza: stock actualizado.',
    'Entradas y salidas sin complicaciones.',
    'Reportes que se entienden al instante.',
    'Ordena hoy, entrega mañana.',
    'Ahorra tiempo en cada conteo.',
    'Datos claros para decisiones inteligentes.',
    'Todo bajo control, sin hojas de cálculo.',
    'Tu equipo, sincronizado y al tanto.',
    'Menos errores, más resultados.',
    'Configura una vez, gestiona siempre.',
    'Del depósito al cliente, sin fricción.',
    'Tu negocio merece un inventario simple.',
    'Alertas oportunas, cero sorpresas.',
    'Crece sin perder el control.',
    'Haz del inventario tu ventaja.',
    'Rápido de aprender, fácil de dominar.',
    'Tu inventario, sin estrés.',
  ]

  const baseText = useTransform(textIndex, latest => texts[latest] || '')
  const count = useMotionValue(0)
  const rounded = useTransform(count, latest => Math.round(latest))
  const displayText = useTransform(rounded, latest =>
    baseText.get().slice(0, latest)
  )
  const updatedThisRound = useMotionValue(true)

  useEffect(() => {
    animate(count, 60, {
      type: 'tween',
      duration: 1.5,
      ease: 'easeIn',
      repeat: Infinity,
      repeatType: 'reverse',
      repeatDelay: 0.5,
      onUpdate(latest) {
        // If we updated already and we're not at 0 anymore,
        // set updatedThisRound to false.
        // The next time we hit 0, we will increment.
        if (updatedThisRound.get() === true && latest > 0) {
          updatedThisRound.set(false)

          // If we haven't updated yet and we're at 0,
          // increment and set updatedThisRound to true.
        } else if (updatedThisRound.get() === false && latest === 0) {
          // Set textIndex to 0 if we reach the end of our texts array.
          // So we don't run out of silly sentences
          if (textIndex.get() === texts.length - 1) {
            textIndex.set(0)
          } else {
            textIndex.set(textIndex.get() + 1)
          }
          updatedThisRound.set(true)
        }
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.span
      className='inline'
      style={{
        color: isDark ? colorText : undefined,
      }}
    >
      {displayText}
    </motion.span>
  )
}
