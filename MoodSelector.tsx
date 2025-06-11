import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AVAILABLE_MOODS } from '@/lib/constants';

interface MoodSelectorProps {
  selectedMood: string;
  onMoodSelect: (mood: string) => void;
  className?: string;
}

export function MoodSelector({
  selectedMood,
  onMoodSelect,
  className = ''
}: MoodSelectorProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {AVAILABLE_MOODS.map((mood: string) => (
        <Button
          key={mood as string}
          variant={selectedMood === mood ? 'default' : 'outline'}
          size="sm"
          onClick={() => onMoodSelect(mood)}
          className="capitalize"
        >
          {mood}
        </Button>
      ))}
    </div>
  );
}
