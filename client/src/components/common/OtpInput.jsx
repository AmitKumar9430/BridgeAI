import React, { useRef } from 'react';

export const OtpInput = ({ value = '', onChange, onComplete, disabled = false, autoFocus = false }) => {
  const inputsRef = useRef([]);

  // Ensure digits array of length 6
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Allow only numeric digits
    const cleaned = val.replace(/\D/g, '');

    if (!cleaned) {
      // Cleared input
      const newDigits = [...digits];
      newDigits[index] = '';
      const newVal = newDigits.join('');
      onChange(newVal);
      return;
    }

    // If pasted or multiple characters
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const newDigits = Array.from({ length: 6 }, (_, i) => chars[i] || digits[i] || '');
      const newVal = newDigits.join('');
      onChange(newVal);
      const nextFocus = Math.min(chars.length, 5);
      inputsRef.current[nextFocus]?.focus();
      if (newVal.length === 6 && onComplete) {
        onComplete(newVal);
      }
      return;
    }

    // Single digit input
    const newDigits = [...digits];
    newDigits[index] = cleaned[cleaned.length - 1];
    const newVal = newDigits.join('');
    onChange(newVal);

    // Auto-advance to next cell
    if (index < 5 && cleaned) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newVal.length === 6 && onComplete) {
      onComplete(newVal);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous cell on backspace if current cell is empty
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      onChange(pasteData);
      const nextFocus = Math.min(pasteData.length, 5);
      inputsRef.current[nextFocus]?.focus();
      if (pasteData.length === 6 && onComplete) {
        onComplete(pasteData);
      }
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5 max-w-sm mx-auto">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoFocus={autoFocus && idx === 0}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className={`w-11 h-12 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl sm:text-2xl rounded-xl border transition-all duration-150 ${
            digit
              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
          } focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50`}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  );
};
