import { useState } from 'react';
import { Shield, Activity } from 'lucide-react';
import StatsStrip from '@/components/StatsStrip';
import SeedInput from '@/components/SeedInput';
import ToggleSwitch from '@/components/ToggleSwitch';
import ProcessButton from '@/components/ProcessButton';
import ResultsTable, { WalletResult } from '@/components/ResultsTable';

const MOCK_RESULTS: WalletResult[] = [
  { id: 1, seed: 'apple banana cherry dog elephant fox grape horse ice jazz kite lemon', ethAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68', ethBalance: 2.4531, trxAddress: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9', trxBalance: 15420, usdtBalance: 3200, status: 'success' },
  { id: 2, seed: 'mango night ocean palm queen river snow tiger umbrella violet wolf xray', ethAddress: '0x1234567890abcdef1234567890abcdef12345678', ethBalance: 0, trxAddress: 'TAahRF4Gv2Mk4ZFMYeyzJ3u2BPPaksc4Nq', trxBalance: 0, usdtBalance: 0, status: 'success' },
  { id: 3, seed: 'abandon ability able about above absent absorb abstract absurd abuse access accident', ethAddress: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', ethBalance: 0.0042, trxAddress: 'TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW', trxBalance: 89200, usdtBalance: 8500, status: 'success' },
  { id: 4, seed: 'zoo yield year worth worry wrap wrestle write wrong xerox yawn yield', ethAddress: '0x00000000000000000000000000000000deadbeef', ethBalance: 0, trxAddress: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', trxBalance: 0, usdtBalance: 0, status: 'error' },
];

const Index = () => {
  const [seeds, setSeeds] = useState('');
  const [deriveEth, setDeriveEth] = useState(true);
  const [deriveTrx, setDeriveTrx] = useState(true);
  const [fetchBalances, setFetchBalances] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<WalletResult[]>([]);

  const handleProcess = () => {
    if (!seeds.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setResults(MOCK_RESULTS);
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Shield size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">Nexus Wallet</h1>
              <p className="text-xs text-muted-foreground">Bulk Checker</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity size={14} className="text-success animate-pulse-glow" />
            <span>API Connected</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <StatsStrip />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Seed Input</h2>
              <SeedInput value={seeds} onChange={setSeeds} />
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground mb-1">Configuration</h2>
              <ToggleSwitch
                label="Derive ETH Addresses"
                description="Ethereum mainnet"
                checked={deriveEth}
                onChange={setDeriveEth}
              />
              <ToggleSwitch
                label="Derive TRX Addresses"
                description="TRON network"
                checked={deriveTrx}
                onChange={setDeriveTrx}
              />
              <ToggleSwitch
                label="Fetch Live Balances"
                description="Query blockchain APIs"
                checked={fetchBalances}
                onChange={setFetchBalances}
              />
            </div>

            <ProcessButton
              onClick={handleProcess}
              isProcessing={isProcessing}
              disabled={!seeds.trim()}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Results</h2>
                {results.length > 0 && (
                  <span className="text-xs text-muted-foreground">{results.length} wallets</span>
                )}
              </div>
              <ResultsTable results={results} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
