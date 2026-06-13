import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Coins, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, error, isLoading, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/trade');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password.length < 6) {
      return;
    }

    const success = await register(name, email, password);
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
          <CardTitle className="text-2xl font-bold">Register on CryptoVault</CardTitle>
          <CardDescription>Create your virtual account to start trading risk-free</CardDescription>
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
              <label className="text-xs font-semibold text-text-secondary">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
              <label className="text-xs font-semibold text-text-secondary">Password (min 6 characters)</label>
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
              {isLoading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>

          <p className="text-center text-xs text-text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-semibold">
              Log In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
export default RegisterPage;
