export interface NavItem {
  label: string;
  href: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: 'scan' | 'report' | 'book';
}

export interface StepItem {
  title: string;
  description: string;
  icon: 'upload' | 'chip' | 'report' | 'save';
}

export interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  initials?: string;
  rating?: number;
  id?: number;
}
