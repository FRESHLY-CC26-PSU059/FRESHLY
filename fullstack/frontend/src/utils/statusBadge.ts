export const getRoleBadgeColor = (role: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    super_admin: { 
      bg: 'bg-red-500/10', 
      text: 'text-red-600', 
      border: 'border-red-500/20' 
    },
    admin: { 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-600', 
      border: 'border-amber-500/20' 
    },
    user: { 
      bg: 'bg-primary-500/10', 
      text: 'text-primary-600', 
      border: 'border-primary-500/20' 
    },
  };
  return colors[role] || colors.user;
};

export const getStatusBadgeColor = (isActive: boolean) => {
  return isActive
    ? { 
        bg: 'bg-emerald-500/10', 
        text: 'text-emerald-600', 
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-500'
      }
    : { 
        bg: 'bg-slate-500/10', 
        text: 'text-slate-600', 
        border: 'border-slate-500/20',
        dot: 'bg-slate-400'
      };
};

export const formatRoleName = (role: string) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return role.charAt(0).toUpperCase() + role.slice(1);
};
