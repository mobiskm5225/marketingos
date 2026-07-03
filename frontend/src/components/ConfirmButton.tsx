import { useState, useRef, useEffect } from 'react';

// Two-click destructive action button. First click arms it ("Remove" becomes
// "Confirm?"), second click within 3s fires onConfirm. Disarms on timeout or blur.
export default function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Confirm?',
  className = 'sn-btn',
  style,
  disabled,
  title,
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  title?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function handleClick() {
    if (armed) {
      if (timer.current) clearTimeout(timer.current);
      setArmed(false);
      onConfirm();
    } else {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 3000);
    }
  }

  return (
    <button
      className={className}
      style={armed
        ? { ...style, background: 'var(--sn-red)', borderColor: 'var(--sn-red)', color: '#fff' }
        : style}
      disabled={disabled}
      title={armed ? 'Click again to confirm' : title}
      onClick={handleClick}
      onBlur={() => { if (timer.current) clearTimeout(timer.current); setArmed(false); }}>
      {armed ? confirmLabel : children}
    </button>
  );
}
