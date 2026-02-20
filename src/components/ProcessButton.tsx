import { Loader2, Zap } from 'lucide-react';

interface ProcessButtonProps {
  onClick: () => void;
  isProcessing: boolean;
  disabled?: boolean;
}

const ProcessButton = ({ onClick, isProcessing, disabled }: ProcessButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled || isProcessing}
    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-6px_hsl(var(--primary)/0.5)]"
  >
    {isProcessing ? (
      <>
        <Loader2 size={18} className="animate-spin-slow" />
        Processing Wallets...
      </>
    ) : (
      <>
        <Zap size={18} />
        Process Wallets
      </>
    )}
  </button>
);

export default ProcessButton;
