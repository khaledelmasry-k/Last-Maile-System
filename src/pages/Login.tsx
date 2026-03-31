import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      login(email, role);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#141414] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2a2a2a] p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Truck className="text-orange-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Express<span className="text-orange-500">Logistics</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono uppercase tracking-widest">
            {t('Login')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="admin@express.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('Simulate Role')}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="Admin">{t('Admin')}</option>
              <option value="Dispatcher">{t('Dispatcher')}</option>
              <option value="Courier">{t('Courier')}</option>
              <option value="Finance">{t('Finance')}</option>
              <option value="CS">{t('CS')}</option>
              <option value="Warehouse">{t('Warehouse')}</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {t('Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
};
