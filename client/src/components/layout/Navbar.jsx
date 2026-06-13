import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Coins, User, LogOut, LayoutDashboard, Shield, Wallet as WalletIcon, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="h-14 border-b border-border bg-bg-1 px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center space-x-2 text-accent">
        <Coins className="w-6 h-6 stroke-[2]" />
        <span className="font-sans font-bold text-lg tracking-wider text-text-primary">
          Crypto<span className="text-accent">Vault</span>
        </span>
      </Link>

      {/* Main Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        <Link to="/markets">
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs ${isActive('/markets') ? 'text-accent bg-bg-2' : ''}`}
          >
            Markets
          </Button>
        </Link>
        <Link to="/trade">
          <Button
            variant="ghost"
            size="sm"
            className={`text-xs ${isActive('/trade') ? 'text-accent bg-bg-2' : ''}`}
          >
            Trade
          </Button>
        </Link>
        {isAuthenticated && (
          <>
            <Link to="/wallet">
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs ${isActive('/wallet') ? 'text-accent bg-bg-2' : ''}`}
              >
                <WalletIcon className="w-3.5 h-3.5 mr-1" />
                Wallet
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={`text-xs ${isActive('/dashboard') ? 'text-accent bg-bg-2' : ''}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </Button>
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-xs ${isActive('/admin') ? 'text-accent bg-bg-2' : ''}`}
                >
                  <Shield className="w-3.5 h-3.5 mr-1 text-accent" />
                  Admin
                </Button>
              </Link>
            )}
          </>
        )}
      </nav>

      {/* User Actions */}
      <div className="flex items-center space-x-3">
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-xs font-bold font-sans">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-text-primary leading-tight">{user?.name}</span>
                <span className="text-[10px] text-text-secondary leading-none capitalize">
                  {user?.role} {user?.kycStatus === 'approved' && '• Verified'}
                </span>
              </div>
              {user?.role === 'admin' && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-red-600 hover:bg-red-700 text-white font-semibold">
                  Admin
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs h-8 px-2 border-border/80 text-text-secondary hover:text-sell hover:border-sell/30"
            >
              <LogOut className="w-3.5 h-3.5 lg:mr-1" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs h-8">
                Log In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="text-xs h-8 bg-accent hover:bg-accent-hover text-bg">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
export default Navbar;
