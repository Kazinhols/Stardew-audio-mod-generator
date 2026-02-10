import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Floating Particles (Fireflies / Stars / Leaves) ──────────
export const FloatingParticles = memo(function FloatingParticles() {
  const { theme } = useTheme();

  const particles = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 10,
      size: 3 + Math.random() * 5,
      emoji: theme === 'dark'
        ? ['✨', '⭐', '🌟', '💫'][i % 4]
        : ['🍃', '🌸', '🌻', '🦋', '✨'][i % 5],
    }));
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-sm opacity-0"
          style={{ left: p.left, bottom: '-20px', fontSize: `${p.size * 2}px` }}
          animate={{
            y: [0, -window.innerHeight - 40],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 0.7, 0.7, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
});

// ─── Junimo Mascot (bouncy character in corners) ──────────────
export const JunimoMascot = memo(function JunimoMascot() {
  const colors = ['🟢', '🔵', '🟣', '🟡', '🔴'];
  const junimo = colors[Math.floor(Date.now() / 60000) % colors.length];

  return (
    <motion.div
      className="fixed bottom-8 right-4 z-40 cursor-pointer select-none"
      animate={{
        y: [0, -12, 0],
        scaleX: [1, 0.92, 1],
        scaleY: [1, 1.08, 1],
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={{
        scale: 1.3,
        rotate: [0, -10, 10, 0],
        transition: { duration: 0.5 },
      }}
      title="Junimo! 🎵"
    >
      <span className="text-3xl drop-shadow-lg" style={{ filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.3))' }}>
        {junimo === '🟢' ? '💚' : junimo === '🔵' ? '💙' : junimo === '🟣' ? '💜' : junimo === '🟡' ? '💛' : '❤️'}
      </span>
      {/* Sparkle above Junimo */}
      <motion.span
        className="absolute -top-3 -right-1 text-xs"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5],
          y: [0, -8, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.5,
        }}
      >
        ✨
      </motion.span>
    </motion.div>
  );
});

// ─── Seasonal Corner Decorations ──────────────────────────────
export const SeasonalCorners = memo(function SeasonalCorners() {
  const { theme } = useTheme();

  return (
    <>
      {/* Top-left corner */}
      <div className="fixed top-0 left-0 pointer-events-none z-10 opacity-40">
        <motion.span
          className="text-2xl block"
          style={{ transform: 'translate(8px, 8px)' }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </motion.span>
      </div>

      {/* Top-right corner */}
      <div className="fixed top-0 right-0 pointer-events-none z-10 opacity-30">
        <motion.div
          className="flex gap-1 p-2"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-lg">🐓</span>
          <span className="text-sm mt-1">🥚</span>
        </motion.div>
      </div>

      {/* Bottom-left */}
      <div className="fixed bottom-8 left-2 pointer-events-none z-10 opacity-30">
        <motion.span
          className="text-xl"
          animate={{
            x: [0, 15, 0, -10, 0],
            scaleX: [1, 1, -1, -1, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          🐔
        </motion.span>
      </div>
    </>
  );
});

// ─── Animated Wood Divider ────────────────────────────────────
export const WoodDivider = memo(function WoodDivider({ className }: { className?: string }) {
  const { theme } = useTheme();

  return (
    <div className={`relative my-4 ${className || ''}`}>
      <div
        className={`h-1 rounded-full ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-transparent via-amber-700/50 to-transparent'
            : 'bg-gradient-to-r from-transparent via-[#8b5a2b]/40 to-transparent'
        }`}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        {theme === 'dark' ? '⭐' : '🌻'}
      </motion.div>
    </div>
  );
});

// ─── Pixel Gold Coin Counter ──────────────────────────────────
export const GoldCounter = memo(function GoldCounter({ value, label }: { value: number; label: string }) {
  const { theme } = useTheme();

  return (
    <motion.div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
        theme === 'dark'
          ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700/50'
          : 'bg-[#e0a030]/20 text-[#8b6914] border border-[#e0a030]/40'
      }`}
      whileHover={{ scale: 1.05 }}
    >
      <motion.span
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-block"
      >
        🪙
      </motion.span>
      <motion.span
        key={value}
        initial={{ scale: 1.5, color: '#e0a030' }}
        animate={{ scale: 1, color: 'inherit' }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {value}
      </motion.span>
      <span className="opacity-70">{label}</span>
    </motion.div>
  );
});

// ─── Stardew-style Day/Night indicator ────────────────────────
export const DayNightIndicator = memo(function DayNightIndicator() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full border-2 cursor-pointer transition-colors overflow-hidden ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-indigo-900 to-purple-900 border-indigo-600'
          : 'bg-gradient-to-r from-sky-300 to-sky-400 border-sky-500'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Stars in night mode */}
      {theme === 'dark' && (
        <>
          <span className="absolute top-1 left-1 text-[6px] animate-twinkle" style={{ animationDuration: '2s' }}>✦</span>
          <span className="absolute bottom-1 left-3 text-[5px] animate-twinkle" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>✦</span>
        </>
      )}

      {/* Clouds in day mode */}
      {theme !== 'dark' && (
        <motion.span
          className="absolute top-0.5 right-2 text-[8px] text-white"
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ☁
        </motion.span>
      )}

      {/* Sun/Moon toggle orb */}
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-sm"
        animate={{ x: theme === 'dark' ? 28 : 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </motion.div>
    </motion.button>
  );
});
