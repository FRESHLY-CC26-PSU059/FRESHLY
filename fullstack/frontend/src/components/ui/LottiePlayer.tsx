import LottieImport from 'lottie-react';
// Handle ESM/CJS interop — lottie-react@2 may export { default: Component } with React 19
const Lottie = (LottieImport as any).default || LottieImport;
import loadingDots from '../../animations/loadingDots';
import successCheck from '../../animations/successCheck';
import emptyState from '../../animations/emptyState';

interface LottiePlayerProps {
  animation: 'loading' | 'success' | 'empty';
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

const animationMap = {
  loading: loadingDots,
  success: successCheck,
  empty: emptyState,
};

const defaultLoop: Record<string, boolean> = {
  loading: true,
  success: false,
  empty: true,
};

export const LottiePlayer = ({ animation, className = '', loop, autoplay = true }: LottiePlayerProps) => {
  return (
    <Lottie
      animationData={animationMap[animation]}
      loop={loop ?? defaultLoop[animation]}
      autoplay={autoplay}
      className={className}
    />
  );
};
