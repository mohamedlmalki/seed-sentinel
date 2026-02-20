import React, { useState, Fragment, useMemo } from 'react';
import { SearchX, X, Copy, Check, Wallet, Coins, Filter, Eye, EyeOff, Activity } from 'lucide-react';

export interface TokenAsset {
  symbol: string;
  balance: number;
  usd: number;
  chain?: string;
  tokenAddress?: string;
  isNative?: boolean;
}

export interface WalletResult {
  id: number;
  seed: string;
  status: 'success' | 'error';
  addresses?: { evm?: string; trx?: string; btc?: string; sol?: string };
  allAssets?: TokenAsset[];
  totalUsd?: number;
  rawResponse?: string;
}

// 🚀 HIGH PRECISION FORMATTER: Ensures tiny balances are never rounded to 0.0
const formatBalance = (val: number) => {
  if (val === undefined || val === null) return '0';
  if (val === 0) return '0.00';

  // For extremely small "dust" balances (e.g. 0.0000000000001)
  if (val < 0.0001 && val > 0) {
    return val.toFixed(18).replace(/\.?0+$/, ""); 
  }

  // Standard formatting for larger numbers with commas
  return val.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 8 
  });
};

const getChainColor = (chain?: string) => {
  switch(chain) {
    case 'ETH': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    case 'BNB': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
    case 'TRX': return 'bg-red-500/20 text-red-400 border-red-500/40';
    case 'BTC': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    case 'SOL': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
    default: return 'bg-secondary text-muted-foreground border-border';
  }
};

const CopyText = ({ text, label }: { text: string, label: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-muted-foreground group">
      <span className="text-white/30 w-8">{label}:</span> 
      <span className="truncate w-28 text-white/70 group-hover:text-white transition-colors">{text}</span>
      <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="hover:text-primary transition-colors">
        {copied ? <Check size={12} className="text-success"/> : <Copy size={12}/>}
      </button>
    </div>
  );
};

const ResultsTable = ({ results }: { results: WalletResult[] }) => {
  const [selectedPortfolio, setSelectedPortfolio] = useState<WalletResult | null>(null);
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);
  const [activeChainFilter, setActiveChainFilter] = useState<string>('ALL');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [hideZero, setHideZero] = useState(false);

  const availableChains = useMemo(() => {
    if (!selectedPortfolio?.allAssets) return ['ALL'];
    const chains = new Set(selectedPortfolio.allAssets.map(a => a.chain || 'UNKNOWN'));
    return ['ALL', ...Array.from(chains)];
  }, [selectedPortfolio]);

  const filteredAssets = useMemo(() => {
    if (!selectedPortfolio?.allAssets) return [];
    let assets = selectedPortfolio.allAssets;
    
    if (activeChainFilter !== 'ALL') {
      assets = assets.filter(a => (a.chain || 'UNKNOWN') === activeChainFilter);
    }
    
    if (hideZero) {
      assets = assets.filter(a => a.balance > 0);
    }

    // Sort: Native coins first, then by USD value
    return [...assets].sort((a, b) => {
      if (a.isNative && !b.isNative) return -1;
      if (b.isNative && !a.isNative) return 1;
      return b.usd - a.usd;
    });
  }, [selectedPortfolio, activeChainFilter, hideZero]);

  const handleCopyTokenAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedToken(address);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  if (results.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center bg-black/20 rounded-xl border border-white/5 border-dashed">
      <div className="bg-white/5 p-4 rounded-full mb-4"><SearchX size={32} className="text-white/20" /></div>
      <h3 className="text-lg font-bold text-white mb-1">No Data Detected</h3>
      <p className="text-sm text-white/40">Enter mnemonics to scan all networks simultaneously.</p>
    </div>
  );

  return (
    <div className="overflow-x-auto pb-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[10px] text-white/40 text-left uppercase tracking-widest bg-white/5">
            <th className="px-4 py-4 font-bold rounded-tl-xl">Index</th>
            <th className="px-4 py-4 font-bold">Network Addresses</th>
            <th className="px-4 py-4 font-bold">Total Net Worth</th>
            <th className="px-4 py-4 font-bold">Assets Found</th>
            <th className="px-4 py-4 font-bold rounded-tr-xl text-center">Logs</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
              <td className="px-4 py-4 font-mono text-xs text-white/30">{r.id}</td>
              <td className="px-4 py-4">
                {r.addresses?.evm && <CopyText label="EVM" text={r.addresses.evm} />}
                {r.addresses?.btc && <CopyText label="BTC" text={r.addresses.btc} />}
                {r.addresses?.trx && <CopyText label="TRX" text={r.addresses.trx} />}
                {r.addresses?.sol && <CopyText label="SOL" text={r.addresses.sol} />}
              </td>
              <td className="px-4 py-4">
                <span className="font-mono text-[#00ff88] font-bold text-lg">
                  ${r.totalUsd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </td>
              <td className="px-4 py-4">
                <button 
                  onClick={() => setSelectedPortfolio(r)} 
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:bg-primary hover:text-white border border-primary/30 bg-primary/10 px-4 py-2 rounded-lg transition-all"
                >
                  <Wallet size={14} /> Scan {r.allAssets?.length || 0} Items
                </button>
              </td>
              <td className="px-4 py-4 text-center">
                <button onClick={() => setSelectedRaw(r.rawResponse || '')} className="text-white/20 hover:text-white transition-colors">
                  <Activity size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0c10] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3 uppercase">
                    Portfolio <span className="text-primary text-[10px] tracking-widest bg-primary/10 px-2 py-1 rounded">DEEP SCAN</span>
                  </h3>
                  <p className="text-xs font-mono text-white/30 mt-2 truncate w-64 lg:w-96">
                    {selectedPortfolio.addresses?.evm || selectedPortfolio.seed}
                  </p>
                </div>
                <button onClick={() => setSelectedPortfolio(null)} className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white p-2 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-mono font-black text-[#00ff88] tracking-tighter">
                  ${selectedPortfolio.totalUsd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-white/20 text-xs font-bold uppercase tracking-widest pl-2">Total Net Worth</span>
              </div>
            </div>

            {/* Filters bar */}
            <div className="px-8 py-4 border-b border-white/5 bg-black/40 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                {availableChains.map(chain => (
                  <button
                    key={chain}
                    onClick={() => setActiveChainFilter(chain)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                      activeChainFilter === chain ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                    }`}
                  >
                    {chain}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setHideZero(!hideZero)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${hideZero ? 'text-primary' : 'text-white/40'}`}
              >
                {hideZero ? <EyeOff size={14}/> : <Eye size={14}/>} {hideZero ? 'Dust Hidden' : 'Showing All'}
              </button>
            </div>

            {/* Scrolling List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-[#0a0c10]">
              {filteredAssets.map((asset, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${asset.isNative ? 'bg-white/[0.04] border-white/15 shadow-xl' : 'bg-transparent border-white/5 hover:border-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border ${asset.isNative ? 'bg-primary text-white border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-white/20 border-white/5'}`}>
                      {asset.symbol.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-black tracking-tight ${asset.isNative ? 'text-white text-base' : 'text-white/80 text-sm'}`}>{asset.symbol}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black border uppercase tracking-tighter ${getChainColor(asset.chain)}`}>{asset.chain}</span>
                      </div>
                      
                      {/* 🚀 NEON GREEN High Precision Balance */}
                      <span className="text-sm font-mono text-[#00ff88] font-bold break-all leading-none">
                        {formatBalance(asset.balance)}
                      </span>

                      {asset.tokenAddress && (
                        <div 
                          className="flex items-center gap-2 mt-2 cursor-pointer group/copy w-fit bg-white/[0.08] px-3 py-1.5 rounded-lg border border-white/10 hover:border-primary transition-all shadow-sm" 
                          onClick={() => handleCopyTokenAddress(asset.tokenAddress!)}
                        >
                          <span className="text-[10px] font-mono text-white/90 group-hover:text-primary transition-colors font-medium">
                            {asset.tokenAddress}
                          </span>
                          {copiedToken === asset.tokenAddress ? <Check size={10} className="text-success" /> : <Copy size={10} className="text-white/40 group-hover:text-primary" />}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-xs mt-1 ${asset.usd > 0 ? 'text-white font-black' : 'text-white/20'}`}>
  {asset.usd > 0 ? (
    asset.usd < 0.01 
      ? `$${asset.usd.toFixed(10).replace(/\.?0+$/, "")}` // Shows up to 10 decimals for tiny USD values
      : `$${asset.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ) : '$0.00'}
</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedRaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0c10] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
              <h3 className="font-bold text-white text-sm uppercase tracking-widest">System Engine Logs</h3>
              <button onClick={() => setSelectedRaw(null)} className="text-white/40 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-auto bg-black font-mono text-[11px] leading-relaxed text-[#00ff88] whitespace-pre-wrap">{selectedRaw}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;