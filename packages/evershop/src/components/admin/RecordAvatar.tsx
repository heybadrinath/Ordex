import React from 'react';

export function RecordAvatar({ name }: { name: string }) {
  const words = (name || '?').trim().split(/\s+/);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  const tone =
    [...(name || '')].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) %
    4;
  return (
    <span className={`record-avatar avatar-${tone}`} aria-hidden="true">
      {initials}
    </span>
  );
}
