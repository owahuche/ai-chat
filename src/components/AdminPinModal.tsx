import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, ShieldAlert, X, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === expectedPin.trim()) {
      setErrorMsg('');
      onSuccess();
    } else {
      setErrorMsg('Incorrect Admin Passcode. Access restricted.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className={`w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-100">Character Lock · Admin Gate</h3>
              <p className="text-xs text-neutral-400">Enter your master passcode to modify persona directives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Master Admin Passcode
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter admin passcode"
                className="w-full pl-9 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition-all font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl text-xs text-neutral-400 space-y-1">
            <div className="flex items-center justify-between text-neutral-300 font-medium">
              <span>Security Policy</span>
              <span className="font-mono text-[11px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded">
                Default: admin123
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Character prompts, behavioral constraints, and personality locks are strictly restricted to administrators to prevent tampering.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-sm"
            >
              <span>Verify & Unlock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
