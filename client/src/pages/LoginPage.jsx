import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Coins, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, isLoading, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/trade');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const success = await login(email, password);
    if (success) {
      navigate('/trade');
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    if (isLoading) return;
    setEmail(demoEmail);
    setPassword(demoPassword);
    const success = await login(demoEmail, demoPassword);
    if (success) {
      navigate('/trade');
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6 py-12 select-none select-none">
      <Card className="w-full max-w-md border-border/80 bg-bg-1 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3 text-accent">
            <Coins className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold">Log In to CryptoVault</CardTitle>
          <CardDescription>Enter your email below to log into your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {error && (
              <div className="flex items-center space-x-2 border border-red-500/20 bg-red-500/10 text-sell text-xs p-3 rounded font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary">Email address</label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-text-secondary">Password</label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-2 bg-accent text-bg hover:bg-accent-hover font-bold"
            >
              {isLoading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          {/* Seed accounts notice for convenience */}
          <div className="mt-6 border-t border-border/30 pt-4 text-center">
            <span className="text-[10px] text-text-secondary block font-semibold mb-2">DEMO ACCOUNTS</span>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-left">
              <button
                type="button"
                onClick={() => handleDemoLogin('trader@cryptovault.com', 'Trader@123')}
                disabled={isLoading}
                className="bg-bg-2 p-1.5 rounded border border-border/50 hover:border-accent hover:bg-bg-3 cursor-pointer transition-all duration-200 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-1 focus:ring-accent/30"
              >
                <span className="font-bold text-accent block group-hover:text-accent-hover transition-colors">Trader Account</span>
                <span className="font-mono text-text-primary block">trader@cryptovault.com</span>
                <span className="font-mono text-text-secondary">Trader@123</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@cryptovault.com', 'Admin@123')}
                disabled={isLoading}
                className="bg-bg-2 p-1.5 rounded border border-border/50 hover:border-sell hover:bg-bg-3 cursor-pointer transition-all duration-200 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus:ring-1 focus:ring-sell/30"
              >
                <span className="font-bold text-red-400 block group-hover:text-red-500 transition-colors">Admin Account</span>
                <span className="font-mono text-text-primary block">admin@cryptovault.com</span>
                <span className="font-mono text-text-secondary">Admin@123</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-text-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-semibold">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
export default LoginPage;
