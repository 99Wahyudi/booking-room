import React from 'react';

/**
 * Material Symbols Outlined icon helper.
 * Usage: <Icon name="search" size={20} className="..." />
 */
export default function Icon({ name, size = 24, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: `${size}px` }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}