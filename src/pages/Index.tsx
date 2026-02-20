import { useState } from 'react';
import { Shield, Activity } from 'lucide-react';
import StatsStrip from '@/components/StatsStrip';
import SeedInput from '@/components/SeedInput';
import ToggleSwitch from '@/components/ToggleSwitch';
import ProcessButton from '@/components/ProcessButton';
import ResultsTable, { WalletResult } from '@/components/ResultsTable';

const Index = () => {
  const [seeds, setSeeds] = useState('');
  
  const [deriveEth, setDeriveEth] = useState(true);
  const [deriveBnb, setDeriveBnb] = useState(true);
  const [deriveTrx, setDeriveTrx] = useState(true);
  const [deriveBtc, setDeriveBtc] = useState(true);
  const [deriveSol, setDeriveSol] = useState(true); // Solana added!
  
  const [fetchBalances, setFetchBalances] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<WalletResult[]>([]);

  const handleProcess = async () => {
    if (!seeds.trim()) return;
    setIsProcessing(true);
    setResults([]); 
    
    const seedArray = seeds.split('\n').map(s => s.trim().replace(/\s+/g, ' ')).filter(s => s.length > 0);

    const chains = [];
    if (deriveEth) chains.push('eth');
    if (deriveBnb) chains.push('bnb');
    if (deriveTrx) chains.push('trx');
    if (deriveBtc) chains.push('btc');
    if (deriveSol) chains.push('sol');

    for (let i = 0; i < seedArray.length; i++) {
        const currentSeed = seedArray[i];

        try {
            const response = await fetch('http://localhost:3000/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seeds: [currentSeed], chains, fetchBalances })
            });

            const data = await response.json();
            if (data.results) {
                const newResult = data.results[0];
                newResult.id = i + 1; 
                newResult.rawResponse = JSON.stringify(newResult, null, 2);
                setResults(prev => [...prev, newResult]);
            }
        } catch (error: any) {
            setResults(prev => [...prev, { id: i + 1, seed: currentSeed, status: 'error', rawResponse: error.toString(), addresses: {}, allAssets: [] }]);
        }
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Shield size={22} className="text-primary" /></div>
            <div><h1 className="text-lg font-bold tracking-tight text-foreground">Nexus Wallet</h1><p className="text-xs text-muted-foreground">God-Mode Scanner</p></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity size={14} className="text-success animate-pulse-glow" /><span>APIs Connected</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        <StatsStrip />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Seed Input</h2>
              <SeedInput value={seeds} onChange={setSeeds} />
            </div>

            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground mb-1">Configuration</h2>
              <ToggleSwitch label="Ethereum (ETH)" description="EVM Native & Tokens" checked={deriveEth} onChange={setDeriveEth} />
              <ToggleSwitch label="Binance (BNB)" description="BSC Native & Tokens" checked={deriveBnb} onChange={setDeriveBnb} />
              <ToggleSwitch label="Bitcoin (BTC)" description="Native Segwit" checked={deriveBtc} onChange={setDeriveBtc} />
              <ToggleSwitch label="TRON (TRX)" description="Native & USDT" checked={deriveTrx} onChange={setDeriveTrx} />
              <ToggleSwitch label="Solana (SOL)" description="Native & SPL" checked={deriveSol} onChange={setDeriveSol} />
              
              <div className="pt-2 pb-1 border-t border-border mt-3">
                <ToggleSwitch label="Deep Scan Balances" description="Fetch from Web3 APIs" checked={fetchBalances} onChange={setFetchBalances} />
              </div>
            </div>

            <ProcessButton onClick={handleProcess} isProcessing={isProcessing} disabled={!seeds.trim() || isProcessing} />
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <ResultsTable results={results} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;