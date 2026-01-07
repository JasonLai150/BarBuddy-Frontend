import { cn } from "@/lib/utils";

export type LiftType = "bench" | "squat" | "deadlift";

interface LiftTypeSelectorProps {
  selected: LiftType | null;
  onSelect: (type: LiftType) => void;
}

const liftTypes: { type: LiftType; label: string; emoji: string }[] = [
  { type: "bench", label: "Bench", emoji: "🏋️" },
  { type: "squat", label: "Squat", emoji: "🦵" },
  { type: "deadlift", label: "Deadlift", emoji: "💪" },
];

export function LiftTypeSelector({ selected, onSelect }: LiftTypeSelectorProps) {
  return (
    <div className="flex gap-3">
      {liftTypes.map(({ type, label, emoji }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={cn(
            "flex flex-1 flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all duration-200",
            "hover:border-primary/50 hover:bg-accent",
            selected === type
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border bg-card"
          )}
        >
          <span className="text-2xl md:text-3xl">{emoji}</span>
          <span className={cn(
            "text-sm font-medium md:text-base",
            selected === type ? "text-primary" : "text-foreground"
          )}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
