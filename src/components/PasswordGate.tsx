import React, { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'password_gate_ok';
const PASSWORD = 'Zaleyo2026';

const PasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allowed, setAllowed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!allowed) {
      inputRef.current?.focus();
    }
  }, [allowed]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value === PASSWORD) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {}
      setAllowed(true);
      setError(null);
    } else {
      setError('Incorrect password');
    }
  };

  if (allowed) return <>{children}</>;

  return (
    <div style={{position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 9999}}>
      <form onSubmit={submit} style={{width: 360, background: 'white', padding: 24, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.3)'}} aria-labelledby="pwgate-title">
        <h2 id="pwgate-title" style={{margin: 0, marginBottom: 8}}>Enter access password</h2>
        <p style={{marginTop: 0, marginBottom: 12, color: '#555'}}>This site is protected. Enter the access password to continue.</p>
        <label style={{display: 'block', marginBottom: 8}}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc'}}
            aria-label="Access password"
          />
        </label>
        {error && <div role="alert" style={{color: 'crimson', marginBottom: 8}}>{error}</div>}
        <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
          <button type="submit" style={{padding: '8px 12px', borderRadius: 6, background: '#0b74ff', color: 'white', border: 'none'}}>Enter</button>
        </div>
      </form>
    </div>
  );
};

export default PasswordGate;
