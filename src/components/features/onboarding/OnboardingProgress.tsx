'use client';

interface OnboardingProgressProps {
  currentStep: number;
}

const stepLabels = ['Welcome', 'Your Brain', 'Your Rhythm', 'First Win'];
const totalSteps = stepLabels.length;

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const percentage = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
      {/* Progress percentage */}
      <span className="text-xs font-mono tabular-nums text-accent-flow">
        {percentage}% complete
      </span>

      {/* Step dots with connectors */}
      <div role="list" aria-label="Onboarding progress" className="flex items-center gap-0 w-full">
        {stepLabels.map((label, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={step} role="listitem" aria-current={isCurrent ? 'step' : undefined} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-accent-grow' : isCurrent ? 'bg-accent-flow' : 'bg-white/10'
                  }`}
                />
                <span className={`text-xs mt-2 whitespace-nowrap transition-colors duration-200 ${
                  isCurrent ? 'text-text-primary font-medium' : 'text-text-muted'
                }`}>
                  {label}
                </span>
              </div>
              {step < totalSteps && (
                <div className="flex-1 h-px mx-2 mb-5 relative overflow-hidden bg-white/[0.06]">
                  <div
                    className="absolute inset-y-0 left-0 bg-accent-flow transition-all duration-300"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type { OnboardingProgressProps };
