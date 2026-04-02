import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { Eye, EyeOff, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('admin@express.com');
  const [password, setPassword] = useState('Admin@123');
  const [role, setRole] = useState<UserRole>('Admin');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await login(email.trim(), password, role);
    if (!result.ok) setError(result.error || 'Login failed');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-200" style={{ background: 'var(--lm-bg)' }}>
      <div className="max-w-md w-full panel rounded-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Truck className="text-orange-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            LastMile<span className="text-orange-500">Logistics</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono uppercase tracking-widest">{t('Login')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Email')}</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-field rounded-xl px-4 py-3"
              placeholder="admin@express.com"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Password')}</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-field rounded-xl px-4 py-3 pr-11"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="login-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('Simulate Role')}</label>
            <select
              id="login-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full input-field rounded-xl px-4 py-3"
            >
              <option value="Admin">{t('Admin')}</option>
              <option value="Dispatcher">{t('Dispatcher')}</option>
              <option value="Courier">{t('Courier')}</option>
              <option value="Finance">{t('Finance')}</option>
              <option value="CS">{t('CS')}</option>
              <option value="Warehouse">{t('Warehouse')}</option>
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-3 text-xs text-gray-600 dark:text-gray-300">
            Demo: <span className="font-mono">admin@express.com / Admin@123</span>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <button type="submit" disabled={submitting} className="w-full btn-primary py-3 rounded-xl">
            {submitting ? 'Signing in...' : t('Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
};
