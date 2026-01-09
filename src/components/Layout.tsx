import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FolderGit2,
  Server,
  FileText,
  PlayCircle,
  Calendar,
  Shield,
  FileSearch,
  LogOut,
} from 'lucide-react';

export function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Inventories', href: '/inventories', icon: Server },
    { name: 'Credentials', href: '/credentials', icon: Shield },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Jobs', href: '/jobs', icon: PlayCircle },
    { name: 'Schedules', href: '/schedules', icon: Calendar },
    { name: 'Audit Logs', href: '/audit', icon: FileSearch },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Ansible Manager</h1>
            <p className="text-sm text-gray-600 mt-1">Automation Control Panel</p>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{profile?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="pl-64">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
