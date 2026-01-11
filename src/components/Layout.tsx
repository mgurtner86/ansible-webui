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
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Playbooks', path: '/playbooks', icon: FolderGit2 },
    { name: 'Inventories', path: '/inventories', icon: Server },
    { name: 'Templates', path: '/templates', icon: FileCode },
    { name: 'Jobs', path: '/jobs', icon: PlayCircle },
    { name: 'Schedules', path: '/schedules', icon: Calendar },
    { name: 'Credentials', path: '/credentials', icon: Key },
    { name: 'Audit', path: '/audit', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Ansible Tower</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">{user?.full_name}</span>
                <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>
    </div>
  );
}
