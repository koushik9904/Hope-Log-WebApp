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
      className={cn(
        "flex flex-col items-center transition-transform duration-200 cursor-pointer hover:scale-115",
        isSelected && "scale-120 ring-2 ring-primary ring-opacity-30 rounded-full p-1"
      )}
      onClick={() => onClick(mood)}
    >
      <div className="text-2xl mb-1">{emojis[mood]}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
