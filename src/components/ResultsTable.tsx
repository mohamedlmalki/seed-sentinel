import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ChevronDown, Download, SearchX } from 'lucide-react';

export interface WalletResult {
  id: number;
  seed: string;
  ethAddress: string;
  ethBalance: number;
  trxAddress: string;
  trxBalance: number;
  usdtBalance: number;
  status: 'success' | 'error';
}

interface ResultsTableProps {
  results: WalletResult[];
}

const MaskedSeed = ({ seed }: { seed: string }) => {
  const [revealed, setRevealed] = useState(false);
  const words = seed.split(' ');
  const masked = words.slice(0, 3).join(' ') + ' •••••••••';

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className="truncate max-w-[180px]">{revealed ? seed : masked}</span>
      <button onClick={() => setRevealed(!revealed)} className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
};

const CopyCell = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <span className="truncate max-w-[120px]">{text}</span>
      <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
        {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      </button>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="rounded-full bg-secondary p-4 mb-4">
      <SearchX size={32} className="text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">No Wallets Processed</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Paste your seed phrases and click "Process Wallets" to derive addresses and check balances.
    </p>
  </div>
);

const ExportBar = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-end pt-4 border-t border-border mt-4">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent"
        >
          <Download size={14} />
          Export Results
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute right-0 bottom-full mb-1 w-44 rounded-lg border border-border bg-card shadow-xl z-10 overflow-hidden">
            <button className="w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-accent transition-colors">Download CSV</button>
            <button className="w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-accent transition-colors border-t border-border">Download JSON</button>
          </div>
        )}
      </div>
    </div>
  );
};

const ResultsTable = ({ results }: ResultsTableProps) => {
  if (results.length === 0) return <EmptyState />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['#', 'Seed Phrase', 'ETH Address', 'ETH Balance', 'TRX Address', 'TRX / USDT', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const hasBalance = r.ethBalance > 0 || r.trxBalance > 0 || r.usdtBalance > 0;
              return (
                <tr
                  key={r.id}
                  className={`border-b border-border/50 transition-colors hover:bg-accent/30 ${
                    hasBalance ? 'glow-gold' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3"><MaskedSeed seed={r.seed} /></td>
                  <td className="px-4 py-3"><CopyCell text={r.ethAddress} /></td>
                  <td className={`px-4 py-3 font-mono text-xs ${r.ethBalance > 0 ? 'text-success font-semibold' : 'text-muted-foreground'}`}>
                    {r.ethBalance.toFixed(4)} ETH
                  </td>
                  <td className="px-4 py-3"><CopyCell text={r.trxAddress} /></td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className={r.trxBalance > 0 ? 'text-success font-semibold' : 'text-muted-foreground'}>
                      {r.trxBalance.toLocaleString()} TRX
                    </span>
                    {r.usdtBalance > 0 && (
                      <span className="ml-2 text-gold font-semibold">${r.usdtBalance.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      r.status === 'success'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {r.status === 'success' ? 'Success' : 'Error'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ExportBar />
    </div>
  );
};

export default ResultsTable;
