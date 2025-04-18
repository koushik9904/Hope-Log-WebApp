import { cn } from "@/lib/utils";

type MoodEmojiProps = {
  mood: number;
  label: string;
  isSelected: boolean;
  onClick: (mood: number) => void;
};

const emojis: Record<number, string> = {
  1: "😢",
  2: "😟",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export function MoodEmoji({ mood, label, isSelected, onClick }: MoodEmojiProps) {
  return (
    <div
      className="flex flex-col items-center cursor-pointer gap-1"
      onClick={() => onClick(mood)}
    >
      <div className={cn(
        isSelected ? "mood-emoji-selected" : "mood-emoji",
        mood === 1 && "hover:text-red-500",
        mood === 2 && "hover:text-orange-500",
        mood === 3 && "hover:text-yellow-500",
        mood === 4 && "hover:text-green-500",
        mood === 5 && "hover:text-blue-500"
      )}>
        {emojis[mood]}
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
