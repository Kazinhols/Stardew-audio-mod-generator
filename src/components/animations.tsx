import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';


export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 }
};

export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 }
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  },
  exit: { opacity: 0, scale: 0.5 }
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};


interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn = ({ children, className, delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={fadeVariants}
    transition={{ duration: 0.3, delay }}
  >
    {children}
  </motion.div>
);

export const SlideUp = ({ children, className, delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={slideUpVariants}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export const ScaleIn = ({ children, className, delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={scaleVariants}
    transition={{ type: 'spring', stiffness: 260, damping: 20, delay }}
  >
    {children}
  </motion.div>
);

export const PopIn = ({ children, className, delay = 0 }: AnimatedProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={popVariants}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

interface StaggerListProps {
  children: ReactNode;
  className?: string;
}

export const StaggerList = ({ children, className }: StaggerListProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={staggerContainerVariants}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className }: AnimatedProps) => (
  <motion.div
    className={className}
    variants={staggerItemVariants}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);


interface AnimatedButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export const AnimatedButton = ({ 
  children, 
  className, 
  onClick, 
  disabled,
  type = 'button'
}: AnimatedButtonProps) => (
  <motion.button
    type={type}
    className={className}
    onClick={onClick}
    disabled={disabled}
    whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
    whileTap={{ scale: disabled ? 1 : 0.98 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
  >
    {children}
  </motion.button>
);

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const AnimatedCard = ({ children, className, onClick }: AnimatedCardProps) => (
  <motion.div
    className={className}
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    whileHover={{ 
      scale: 1.01, 
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      transition: { duration: 0.2 }
    }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

interface AnimatedTabProps {
  children: ReactNode;
  isActive: boolean;
}

export const AnimatedTab = ({ children, isActive }: AnimatedTabProps) => (
  <AnimatePresence mode="wait">
    {isActive && (
      <motion.div
        key="tab-content"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

interface AnimatedToastProps {
  children: ReactNode;
  isVisible: boolean;
}

export const AnimatedToast = ({ children, isVisible }: AnimatedToastProps) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export const LoadingSpinner = ({ className }: { className?: string }) => (
  <motion.div
    className={className}
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
  >
    ⏳
  </motion.div>
);

export const Pulse = ({ children, className }: AnimatedProps) => (
  <motion.div
    className={className}
    animate={{ 
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  >
    {children}
  </motion.div>
);

export const Shake = ({ children, className, trigger }: AnimatedProps & { trigger?: boolean }) => (
  <motion.div
    className={className}
    animate={trigger ? { x: [-10, 10, -10, 10, 0] } : {}}
    transition={{ duration: 0.4 }}
  >
    {children}
  </motion.div>
);

export const Float = ({ children, className }: AnimatedProps) => (
  <motion.div
    className={className}
    animate={{ 
      y: [0, -10, 0],
    }}
    transition={{ 
      duration: 3, 
      repeat: Infinity,
      ease: 'easeInOut'
    }}
  >
    {children}
  </motion.div>
);

interface TypingTextProps {
  text: string;
  className?: string;
  speed?: number;
}

export const TypingText = ({ text, className, speed = 50 }: TypingTextProps) => {
  return (
    <motion.span className={className}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * (speed / 1000) }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export const AnimatedCounter = ({ value, className }: AnimatedCounterProps) => (
  <motion.span
    className={className}
    key={value}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 300 }}
  >
    {value}
  </motion.span>
);

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className }: PageTransitionProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

export { AnimatePresence, motion };
