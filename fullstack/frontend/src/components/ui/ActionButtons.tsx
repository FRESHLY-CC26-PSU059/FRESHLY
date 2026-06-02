import { Edit2, Trash2, Eye, CheckCircle, XCircle, Check, X, ArrowUpCircle, ArrowDownCircle, Bell } from 'lucide-react';
import { useState } from 'react';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'danger' | 'secondary' | 'success' | 'warning';
  isLoading?: boolean;
}

export const PromoteActionButton = ({ onClick, disabled = false, size = 'sm', title = 'Promote to Admin' }: ActionButtonProps) => {
  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        rounded-lg
        bg-emerald-500/10 text-emerald-600 
        hover:bg-emerald-500/20 active:bg-emerald-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      <ArrowUpCircle className="w-4 h-4" />
    </button>
  );
};

export const DemoteActionButton = ({ onClick, disabled = false, size = 'sm', title = 'Demote to User' }: ActionButtonProps) => {
  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        rounded-lg
        bg-orange-500/10 text-orange-600 
        hover:bg-orange-500/20 active:bg-orange-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      <ArrowDownCircle className="w-4 h-4" />
    </button>
  );
};

export const ViewActionButton = ({ onClick, disabled = false, size = 'sm', title = 'View' }: ActionButtonProps) => {
  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        rounded-lg
        bg-blue-500/10 text-blue-600 
        hover:bg-blue-500/20 active:bg-blue-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      <Eye className="w-4 h-4" />
    </button>
  );
};

export const EditActionButton = ({ onClick, disabled = false, size = 'sm', title = 'Edit', isLoading = false }: ActionButtonProps) => {
  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        rounded-lg
        bg-amber-500/10 text-amber-600 
        hover:bg-amber-500/20 active:bg-amber-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      <Edit2 className="w-4 h-4" />
    </button>
  );
};

export const ToggleActionButton = ({ 
  onClick, 
  disabled = false, 
  size = 'sm', 
  title, 
  isLoading = false,
  variant = 'success'
}: ActionButtonProps) => {
  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
  };

  const variantClasses = {
    success: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:bg-emerald-500/30',
    warning: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 active:bg-rose-500/30',
    primary: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 active:bg-blue-500/30',
    danger: 'bg-red-500/10 text-red-600 hover:bg-red-500/20 active:bg-red-500/30',
    secondary: 'bg-app-bg text-app-text-secondary hover:brightness-95 active:brightness-90',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant as keyof typeof variantClasses]}
        inline-flex items-center justify-center
        rounded-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      {variant === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
    </button>
  );
};

interface DeleteActionButtonProps extends Omit<ActionButtonProps, 'onClick'> {
  onClick: () => Promise<void>;
}

export const DeleteActionButton = ({ 
  onClick, 
  disabled = false, 
  size = 'sm', 
  title = 'Delete', 
  isLoading = false
}: DeleteActionButtonProps) => {
  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onClick();
      setShowConfirm(false);
    } catch (error) {
      // Silent — error handling is done by the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          disabled={isDeleting || disabled}
          title="Confirm delete"
          className={`
            ${sizeClasses[size]}
            inline-flex items-center justify-center
            rounded-lg
            bg-red-500/20 text-red-700 
            hover:bg-red-500/30 active:bg-red-500/40
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            font-semibold text-xs
          `}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          title="Cancel delete"
          className={`
            ${sizeClasses[size]}
            inline-flex items-center justify-center
            rounded-lg
            bg-app-bg text-app-text-secondary 
            hover:brightness-95 active:brightness-90
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            font-semibold text-xs
            border border-app-border
          `}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowConfirm(true)}
      disabled={disabled || isLoading}
      title={title}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        rounded-lg
        bg-red-500/10 text-red-600 
        hover:bg-red-500/20 active:bg-red-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};

export const NotifyActionButton = ({ onClick, disabled = false, size = 'sm', title = 'Kirim Notifikasi' }: ActionButtonProps) => {
  const sizeClasses = {
    sm: 'p-1.5 w-8 h-8',
    md: 'p-2 w-10 h-10',
    lg: 'p-2.5 w-12 h-12',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${sizeClasses[size]}
        inline-flex items-center justify-center
        rounded-lg
        bg-primary-500/10 text-primary-600 
        hover:bg-primary-500/20 active:bg-primary-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      `}
    >
      <Bell className="w-3.5 h-3.5" />
    </button>
  );
};

interface ActionGroupProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  onToggle?: () => void;
  onPromote?: () => void;
  onDemote?: () => void;
  onNotify?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showToggle?: boolean;
  showPromote?: boolean;
  showDemote?: boolean;
  showNotify?: boolean;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  toggleDisabled?: boolean;
  promoteDisabled?: boolean;
  demoteDisabled?: boolean;
  notifyDisabled?: boolean;
  isLoadingEdit?: boolean;
  isLoadingDelete?: boolean;
  isLoadingToggle?: boolean;
  isLoadingPromote?: boolean;
  isLoadingDemote?: boolean;
  toggleVariant?: 'success' | 'warning';
  toggleTitle?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ActionButtonGroup = ({
  onView,
  onEdit,
  onDelete,
  onToggle,
  onPromote,
  onDemote,
  onNotify,
  showView = true,
  showEdit = true,
  showDelete = true,
  showToggle = false,
  showPromote = false,
  showDemote = false,
  showNotify = false,
  editDisabled = false,
  deleteDisabled = false,
  toggleDisabled = false,
  promoteDisabled = false,
  demoteDisabled = false,
  notifyDisabled = false,
  isLoadingEdit = false,
  isLoadingDelete = false,
  isLoadingToggle = false,
  isLoadingPromote = false,
  isLoadingDemote = false,
  toggleVariant = 'success',
  toggleTitle = 'Toggle Status',
  size = 'sm',
}: ActionGroupProps) => {
  return (
    <div className="flex items-center gap-2">
      {showView && onView && (
        <ViewActionButton onClick={onView} size={size} />
      )}
      {showEdit && onEdit && (
        <EditActionButton onClick={onEdit} disabled={editDisabled} isLoading={isLoadingEdit} size={size} />
      )}
      {showNotify && onNotify && (
        <NotifyActionButton onClick={onNotify} disabled={notifyDisabled} size={size} />
      )}
      {showPromote && onPromote && (
        <PromoteActionButton onClick={onPromote} disabled={promoteDisabled || isLoadingPromote} size={size} />
      )}
      {showDemote && onDemote && (
        <DemoteActionButton onClick={onDemote} disabled={demoteDisabled || isLoadingDemote} size={size} />
      )}
      {showToggle && onToggle && (
        <ToggleActionButton 
          onClick={onToggle} 
          disabled={toggleDisabled} 
          isLoading={isLoadingToggle} 
          variant={toggleVariant}
          title={toggleTitle}
          size={size} 
        />
      )}
      {showDelete && onDelete && (
        <DeleteActionButton onClick={onDelete} disabled={deleteDisabled} isLoading={isLoadingDelete} size={size} />
      )}
    </div>
  );
};
