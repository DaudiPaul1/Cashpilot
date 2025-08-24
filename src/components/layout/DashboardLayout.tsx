'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Home, 
  BarChart3, 
  CreditCard, 
  TrendingUp, 
  Settings, 
  LogOut, 
  User,
  Bell,
  Search,
  Plus,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/store/useStore';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Insights', href: '/dashboard/insights', icon: TrendingUp },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen, addNotification } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      addNotification({
        type: 'success',
        title: 'Logged out successfully',
        message: 'You have been signed out of your account.',
        duration: 3000,
      });
      router.push('/login');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Logout failed',
        message: 'There was an error signing you out. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = () => {
    addNotification({
      type: 'info',
      title: 'Add Transaction',
      message: 'Transaction form will open here. This feature is coming soon!',
      duration: 3000,
    });
  };

  const handleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    addNotification({
      type: 'info',
      title: 'Notifications',
      message: 'You have no new notifications.',
      duration: 3000,
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">CashPilot</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userProfile?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile?.companyName || 'Company'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="mt-3 w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut className="h-5 w-5 mr-3" />
                {isLoading ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Search bar */}
              <div className="flex-1 max-w-lg ml-4 lg:ml-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions, insights..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Add transaction button */}
                <button 
                  onClick={handleAddTransaction}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                  title="Add Transaction"
                >
                  <Plus className="h-5 w-5" />
                </button>

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={handleNotifications}
                    className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </button>
                  
                  {/* Notifications dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Notifications</h3>
                        <p className="text-sm text-gray-500">You have no new notifications.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="User Menu"
                  >
                    <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {/* User dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {userProfile?.displayName || user?.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {userProfile?.companyName || 'Company'}
                          </p>
                        </div>
                        <Link
                          href="/dashboard/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          disabled={isLoading}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                          {isLoading ? 'Signing out...' : 'Sign out'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      
      {/* Click outside to close dropdowns */}
      {(userMenuOpen || notificationsOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </ProtectedRoute>
  );
}
