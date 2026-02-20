interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch = ({ label, description, checked, onChange }: ToggleSwitchProps) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex items-center justify-between w-full rounded-lg border border-border bg-card px-4 py-3 text-left transition-all hover:bg-accent/50"
  >
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <div
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-primary' : 'bg-secondary'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-foreground transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </div>
  </button>
);

export default ToggleSwitch;
