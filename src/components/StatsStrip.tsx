import { Wallet, Coins, TrendingUp, Shield } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  highlight?: boolean;
}

const StatCard = ({ title, value, icon, subtitle, highlight }: StatCardProps) => (
  <div className={`rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:bg-accent/50 ${highlight ? 'glow-success' : ''}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
      <div className="text-muted-foreground">{icon}</div>
    </div>
    <p className={`text-2xl font-bold tracking-tight ${highlight ? 'text-gradient-primary' : 'text-foreground'}`}>{value}</p>
    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
  </div>
);

const StatsStrip = () => {
  const stats = [
    { title: 'Wallets Checked', value: '2,847', icon: <Wallet size={18} />, subtitle: '+124 this session' },
    { title: 'Total ETH Found', value: '14.2831', icon: <Coins size={18} />, subtitle: '≈ $46,821', highlight: true },
    { title: 'Total TRX Found', value: '89,412.50', icon: <TrendingUp size={18} />, subtitle: '≈ $8,941' },
    { title: 'Total USDT Found', value: '$12,384.00', icon: <Shield size={18} />, subtitle: 'TRC-20 tokens', highlight: true },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};

export default StatsStrip;
