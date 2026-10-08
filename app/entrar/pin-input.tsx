'use client';
import { useState, type RefObject } from 'react';

/** Un solo campo real conserva pegado, teclado y gestores de contraseñas. Nunca muestra los números. */
export default function PinInput({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  const [length, setLength] = useState(0);
  const [position, setPosition] = useState(0);
  const [focused, setFocused] = useState(false);
  return (
    <label className="pin-field">PIN · 6 números
      <span className="pin-entry">
        <span className="pin-entry__cells" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="pin-entry__cell" data-active={focused && i === Math.min(position, 5)}>
              {i < length ? <span className="pin-entry__dot" /> : null}
            </span>
          ))}
        </span>
        <input ref={inputRef} name="pin" type="password" inputMode="numeric" autoComplete="current-password"
          aria-label="PIN de 6 números" pattern="\d{6}" maxLength={6} required
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onSelect={(e) => setPosition(e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
          onChange={(e) => { setLength(e.currentTarget.value.length); setPosition(e.currentTarget.selectionStart ?? e.currentTarget.value.length); }} />
      </span>
    </label>
  );
}
