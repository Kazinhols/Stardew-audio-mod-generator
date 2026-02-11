import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = '📦 Generating...' }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/85 flex flex-col justify-center items-center z-[2000] backdrop-blur-sm"
        >        
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-gradient-to-b from-[#5c3d2e] to-[#3a2518] border-4 border-[#8b5a2b] rounded-xl p-8 sm:p-12 pixel-border flex flex-col items-center"
          >
            <div className="relative w-24 h-24 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-4 border-[#8b5a2b] border-t-[#e0a030] border-r-[#56a037]"
              />

              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full border-3 border-[#5c3d2e] border-b-[#e07020] border-l-[#4a90d9]"
              />

              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  y: [0, -8, 0],
                  scale: [1, 1.15, 1],
                }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-3xl drop-shadow-lg">🎵</span>
              </motion.div>
            </div>

            {['🍃', '⭐', '🎶', '💚'].map((emoji, i) => (
              <motion.span
                key={i}
                className="absolute text-lg"
                style={{ top: '35%', left: '50%' }}
                animate={{
                  x: [
                    Math.cos((i * Math.PI) / 2) * 55,
                    Math.cos((i * Math.PI) / 2 + Math.PI / 2) * 55,
                    Math.cos((i * Math.PI) / 2 + Math.PI) * 55,
                    Math.cos((i * Math.PI) / 2 + (3 * Math.PI) / 2) * 55,
                    Math.cos((i * Math.PI) / 2 + 2 * Math.PI) * 55,
                  ],
                  y: [
                    Math.sin((i * Math.PI) / 2) * 55,
                    Math.sin((i * Math.PI) / 2 + Math.PI / 2) * 55,
                    Math.sin((i * Math.PI) / 2 + Math.PI) * 55,
                    Math.sin((i * Math.PI) / 2 + (3 * Math.PI) / 2) * 55,
                    Math.sin((i * Math.PI) / 2 + 2 * Math.PI) * 55,
                  ],
                  opacity: [0.5, 1, 0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {emoji}
              </motion.span>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[#f8ecc2] text-lg sm:text-xl font-bold text-shadow-pixel text-center"
            >
              {message}
            </motion.div>

            <div className="flex gap-2 mt-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    backgroundColor: ['#e63e3e', '#e07020', '#e0a030', '#56a037', '#4a90d9'][i],
                  }}
                  animate={{
                    y: [0, -10, 0],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.12,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {[
            { top: '15%', left: '20%' },
            { top: '25%', right: '15%' },
            { bottom: '20%', left: '25%' },
            { bottom: '15%', right: '20%' },
          ].map((pos, i) => (
            <motion.span
              key={i}
              className="absolute text-xl"
              style={pos}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              ✨
            </motion.span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
