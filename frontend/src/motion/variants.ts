import type { Variants } from 'motion/react'

/**
 * Stagger container — children animate in sequence.
 * Usage: wrap list/grid with <motion.div variants={staggerContainer}>
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

/**
 * Individual item — slides up from 14px below with spring.
 * Usage: each child <motion.div variants={staggerItem}>
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      mass: 0.8,
    },
  },
}

/**
 * Fade-slide for single elements (non-staggered).
 */
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22,
    },
  },
}

/**
 * Page route transition (Scheme F).
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

/**
 * Detail panel slide-in (Scheme C — layout transition).
 */
export const panelSlideIn: Variants = {
  initial: { opacity: 0, x: 24, scale: 0.97 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.97,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
}

/**
 * Expand/collapse for timeline items (Scheme C).
 */
export const expandCollapse: Variants = {
  collapsed: { height: 0, opacity: 0, marginTop: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    marginTop: 10,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 28,
    },
  },
}
