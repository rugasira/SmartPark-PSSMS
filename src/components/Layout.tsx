import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Car, 
  Square, 
  ClipboardList, 
  CreditCard, 
  BarChart3, 
  LogOut, 
  ParkingCircle,
  Menu,
  X
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: ParkingCircle, path: '/' },
    { name: 'Cars', icon: Car, path: '/cars' },
    { name: 'Parking Slots', icon: Square, path: '/slots' },
    { name: 'Parking Records', icon: ClipboardList, path: '/records' },
    { name: 'Payments', icon: CreditCard, path: '/payments' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <ParkingCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-display font-bold">SmartPark</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">PSSMS Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 px-4 py-2">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                {user.email?.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{profile?.role}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ParkingCircle className="w-6 h-6 text-emerald-500" />
          <h1 className="text-lg font-display font-bold">SmartPark</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-[60px] bg-slate-900 text-white z-40 p-4"
          >
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-medium text-lg",
                      isActive 
                        ? "bg-emerald-500 text-white" 
                        : "text-slate-400 hover:text-white"
                    )
                  }
                >
                  <item.icon className="w-6 h-6" />
                  {item.name}
                </NavLink>
              ))}
              <hr className="border-slate-800 my-4" />
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-4 rounded-xl text-red-400 font-medium text-lg"
              >
                <LogOut className="w-6 h-6" />
                Logout
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
