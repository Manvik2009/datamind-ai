import { useEffect } from 'react';

export const useKeyboardShortcut = (key: string, callback: () => void, modifier: 'ctrl' | 'alt' | 'shift' = 'ctrl') => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifierPressed = modifier === 'ctrl' ? (event.ctrlKey || event.metaKey) : modifier === 'alt' ? event.altKey : event.shiftKey;

      if (modifierPressed && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, modifier]);
};
