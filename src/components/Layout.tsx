import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'bg-blue-500' },
    { name: 'Playbooks', path: '/playbooks', icon: FolderGit2, color: 'bg-emerald-500' },
    { name: 'Inventories', path: '/inventories', icon: Server, color: 'bg-cyan-500' },
    { name: 'Templates', path: '/templates', icon: FileCode, color: 'bg-orange-500' },
    { name: 'Jobs', path: '/jobs', icon: PlayCircle, color: 'bg-pink-500' },
    { name: 'Schedules', path: '/schedules', icon: Calendar, color: 'bg-teal-500' },
    { name: 'Credentials', path: '/credentials', icon: Key, color: 'bg-amber-500' },
    { name: 'Audit', path: '/audit', icon: FileText, color: 'bg-slate-500' },
    ...(user?.role === 'admin' && user?.auth_provider === 'local'
      ? [{ name: 'Settings', path: '/settings', icon: Settings, color: 'bg-gray-600' }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 z-30 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-2xl font-light tracking-tight text-slate-800">
              Ansible <span className="font-semibold">Tower</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-slate-100/50">
              <User className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-sm text-slate-800">{user?.full_name}</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded">
                {user?.role}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <aside
        className={`fixed top-16 left-0 bottom-0 w-72 bg-white/90 backdrop-blur-md border-r border-slate-200/60 transition-transform duration-300 z-20 shadow-lg ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                className={`group flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-slate-100 to-slate-50 shadow-sm'
                    : 'hover:bg-slate-50 hover:shadow-sm'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${item.color} shadow-md transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`text-sm font-medium tracking-wide ${
                    isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main
        className={`pt-20 transition-all duration-300 ${
          sidebarOpen ? 'pl-76' : 'pl-4'
        } pr-4 pb-8`}
      >
        <div className={`${sidebarOpen ? 'ml-72' : 'ml-0'} transition-all duration-300`}>
          {children}
        </div>
      </main>
    </div>
  );
}
