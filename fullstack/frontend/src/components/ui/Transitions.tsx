import { Grow, Fade, Zoom, Slide } from '@mui/material';
import type { ReactElement } from 'react';

interface TransitionProps {
  children: ReactElement;
  show: boolean;
  timeout?: number;
}

export const AnimateGrow = ({ children, show, timeout = 300 }: TransitionProps) => (
  <Grow in={show} timeout={timeout} style={{ transformOrigin: 'center' }}>
    {children}
  </Grow>
);

export const AnimateFade = ({ children, show, timeout = 300 }: TransitionProps) => (
  <Fade in={show} timeout={timeout}>
    {children}
  </Fade>
);

export const AnimateZoom = ({ children, show, timeout = 300 }: TransitionProps) => (
  <Zoom in={show} timeout={timeout}>
    {children}
  </Zoom>
);

export const AnimateSlide = ({ 
  children, 
  show, 
  direction = 'up', 
  timeout = 300 
}: TransitionProps & { direction?: 'up' | 'down' | 'left' | 'right' }) => (
  <Slide in={show} direction={direction} timeout={timeout}>
    {children}
  </Slide>
);
