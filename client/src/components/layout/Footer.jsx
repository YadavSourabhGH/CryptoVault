import React from 'react';
import { Coins } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-1 py-8 px-6 text-text-secondary select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-xs">
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-accent" />
          <span className="font-sans font-semibold text-text-primary">
            Crypto<span className="text-accent">Vault</span> Exchange Simulation
          </span>
        </div>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-text-primary transition-colors">API Docs</a>
        </div>
        <div>
          <span>© {new Date().getFullYear()} CryptoVault. Created for simulation purposes. No real funds involved.</span>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
