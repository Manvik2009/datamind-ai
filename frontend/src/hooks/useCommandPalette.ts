import { useState } from 'react';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { CommandPalette } from '@/components/CommandPalette';
import { createElement } from 'react';

export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useKeyboardShortcut('k', () => setIsOpen((prev) => !prev), 'ctrl');

  const close = () => setIsOpen(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close,
    CommandPalette: isOpen ? createElement(CommandPalette, { onClose: close }) : null,
  };
};
