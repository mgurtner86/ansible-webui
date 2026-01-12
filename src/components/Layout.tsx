import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import {
  LayoutDashboard,
  FolderGit2,
  Server,
  FileCode,
  PlayCircle,
  Calendar,
  Key,
  FileText,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'bg-blue-500', iconColor: 'text-blue-500' },
    { name: 'Playbooks', path: '/playbooks', icon: FolderGit2, color: 'bg-emerald-500', iconColor: 'text-emerald-500' },
    { name: 'Inventories', path: '/inventories', icon: Server, color: 'bg-cyan-500', iconColor: 'text-cyan-500' },
    { name: 'Templates', path: '/templates', icon: FileCode, color: 'bg-orange-500', iconColor: 'text-orange-500' },
    { name: 'Jobs', path: '/jobs', icon: PlayCircle, color: 'bg-pink-500', iconColor: 'text-pink-500' },
    { name: 'Schedules', path: '/schedules', icon: Calendar, color: 'bg-teal-500', iconColor: 'text-teal-500' },
    { name: 'Credentials', path: '/credentials', icon: Key, color: 'bg-amber-500', iconColor: 'text-amber-500' },
    { name: 'Audit', path: '/audit', icon: FileText, color: 'bg-slate-500', iconColor: 'text-slate-500' },
    ...(user?.role === 'admin' && user?.auth_provider === 'local'
      ? [{ name: 'Settings', path: '/settings', icon: Settings, color: 'bg-gray-600', iconColor: 'text-gray-600' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 z-30 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-slate-800 dark:text-slate-200" /> : <Menu className="w-5 h-5 text-slate-800 dark:text-slate-200" />}
            </button>
            <h1 className="text-2xl font-light tracking-tight text-slate-800 dark:text-slate-100">
              Ansible <span className="font-semibold">Tower</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-slate-100/50 dark:bg-slate-700/50">
              <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{user?.full_name}</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded">
                {user?.role}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <aside
        className={`fixed top-16 left-0 bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 z-20 shadow-lg ${
          sidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={!sidebarOpen ? item.name : undefined}
                className={`group flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm'
                } ${!sidebarOpen ? 'justify-center px-2' : ''}`}
              >
                {sidebarOpen ? (
                  <>
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg ${item.color} shadow-md transition-transform duration-200 ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span
                      className={`text-sm font-medium tracking-wide ${
                        isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                      }`}
                    >
                      {item.name}
                    </span>
                  </>
                ) : (
                  <Icon
                    className={`w-6 h-6 ${item.iconColor} transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`}
                    strokeWidth={2}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main
        className={`pt-20 transition-all duration-300 pr-4 pb-8 ${
          sidebarOpen ? 'pl-76' : 'pl-24'
        }`}
      >
        <div className={`${sidebarOpen ? 'ml-72' : 'ml-20'} transition-all duration-300`}>
          {children}
        </div>
      </main>
    </div>
  );
}
