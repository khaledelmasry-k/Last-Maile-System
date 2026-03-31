import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Send, Truck, Package, DollarSign, HeadphonesIcon, BarChart3, Warehouse, Map, Shield, LogOut, Moon, Sun, Globe } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const navItems = [
  { name: 'Admin Overview', path: '/', icon: LayoutDashboard, roles: ['Admin'] },
  { name: 'Live Tracking', path: '/map', icon: Map, roles: ['Admin', 'Dispatcher'] },
  { name: 'Dispatch Portal', path: '/dispatch', icon: Send, roles: ['Admin', 'Dispatcher'] },
  { name: 'Courier App', path: '/courier', icon: Truck, roles: ['Admin', 'Courier'] },
  { name: 'Receive & Returns', path: '/receive', icon: Package, roles: ['Admin', 'Warehouse'] },
  { name: 'Finance & COD', path: '/finance', icon: DollarSign, roles: ['Admin', 'Finance'] },
  { name: 'Customer Service', path: '/cs', icon: HeadphonesIcon, roles: ['Admin', 'CS'] },
  { name: 'Performance', path: '/performance', icon: BarChart3, roles: ['Admin'] },
  { name: 'Warehouse', path: '/warehouse', icon: Warehouse, roles: ['Admin', 'Warehouse'] },
  { name: 'Roles & Permissions', path: '/roles', icon: Shield, roles: ['Admin'] },
];

export const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  
  const currentRole = user?.role || 'Admin';
  const visibleNavItems = navItems.filter(item => item.roles.includes(currentRole));

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 dark:bg-[#141414] border-r border-gray-200 dark:border-[#2a2a2a] flex flex-col transition-colors duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <h1 className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <Truck className="text-orange-500" />
            <span>LastMile<span className="text-orange-500">Logistics</span></span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-mono">{t('LastMileLogistics')}</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-orange-500/10 text-orange-500" 
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#2a2a2a]"
                      )
                    }
                  >
                    <Icon size={18} />
                    {t(item.name)}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-4">
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a]">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={toggleLanguage} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-[#2a2a2a] flex items-center gap-2 text-sm font-medium">
              <Globe size={18} />
              {i18n.language === 'en' ? 'AR' : 'EN'}
            </button>
            <button onClick={logout} className="p-2 text-red-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
              <LogOut size={18} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || t('User')}</p>
              <p className="text-xs text-gray-500">{t(currentRole)}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0a0a0a] transition-colors duration-200">
        <Outlet />
      </main>
    </div>
  );
};
