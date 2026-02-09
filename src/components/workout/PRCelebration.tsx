import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface PRCelebrationProps {
  exerciseName: string;
  weight: number;
  onComplete: () => void;
}

export function PRCelebration({ exerciseName, weight, onComplete }: PRCelebrationProps) {
  const [visible, setVisible] = useState(true);
  const [confetti, setConfetti] = useState<{ id: number; x: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    // Generate confetti pieces
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 5)],
    }));
    setConfetti(pieces);

    // Hide after animation
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm animate-confetti"
          style={{
            left: `${piece.x}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
      
      {/* PR Badge */}
      <div className="animate-bounce-in bg-gradient-to-r from-accent to-warning rounded-lg p-6 shadow-2xl text-center">
        <Trophy className="h-12 w-12 mx-auto mb-3 text-accent-foreground" />
        <Badge variant="secondary" className="mb-2 text-lg px-4 py-1">
          🎉 NEW PR!
        </Badge>
        <h3 className="text-xl font-bold text-accent-foreground mb-1">
          {exerciseName}
        </h3>
        <p className="text-3xl font-black text-accent-foreground">
          {weight} lbs
        </p>
      </div>
    </div>
  );
}

// Add these to your index.css or a global styles file:
// @keyframes confetti {
//   0% { transform: translateY(0) rotate(0deg); opacity: 1; }
//   100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
// }
// .animate-confetti { animation: confetti 3s ease-out forwards; }
// @keyframes bounce-in {
//   0% { transform: scale(0); opacity: 0; }
//   50% { transform: scale(1.1); }
//   100% { transform: scale(1); opacity: 1; }
// }
// .animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }
