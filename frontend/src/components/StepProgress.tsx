import React from 'react';
import { Check, Upload, Settings2, Activity, Cpu, CheckCircle2, TrendingUp } from 'lucide-react';

interface StepProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  maxAccessibleStep: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  onStepClick,
  maxAccessibleStep,
}) => {
  const steps = [
    { number: 1, label: 'Upload Data', icon: Upload },
    { number: 2, label: 'Configure', icon: Settings2 },
    { number: 3, label: 'Stationarity', icon: Activity },
    { number: 4, label: 'ARIMA Setup', icon: Cpu },
    { number: 5, label: 'Evaluation', icon: CheckCircle2 },
    { number: 6, label: 'Forecast', icon: TrendingUp },
  ];

  return (
    <div className="w-full py-4 mb-6">
      {/* Desktop & Tablet Progress Bar */}
      <div className="hidden sm:flex items-center justify-between relative">
        
        {/* Background track */}
        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-800 rounded-full z-0" />
        
        {/* Filled track */}
        <div 
          className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full z-0 transition-all duration-500 ease-out"
          style={{
            width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (steps.length - 1)) * 100))}%`
          }}
        />

        {steps.map((s) => {
          const isDone = currentStep > s.number;
          const isCurrent = currentStep === s.number;
          const isClickable = s.number <= maxAccessibleStep;
          const Icon = s.icon;

          return (
            <div key={s.number} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick && onStepClick(s.number)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-indigo-600 to-sky-400 text-white ring-4 ring-indigo-500/25 shadow-lg shadow-indigo-500/40 scale-110'
                    : isClickable
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
              >
                {isDone ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </button>

              <span
                className={`mt-2 text-xs font-medium tracking-tight text-center ${
                  isCurrent
                    ? 'text-white font-semibold'
                    : isDone
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Step Bar */}
      <div className="sm:hidden flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            {currentStep}/{steps.length}
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Active Step</div>
            <div className="text-sm font-bold text-white">{steps[currentStep - 1]?.label}</div>
          </div>
        </div>

        <div className="text-xs text-indigo-400 font-mono font-medium">
          {Math.round((currentStep / steps.length) * 100)}% Complete
        </div>
      </div>
    </div>
  );
};
