import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog — drop-in replacement for window.confirm()
 *
 * Props:
 *   isOpen       {boolean}   — whether the dialog is visible
 *   title        {string}    — dialog heading
 *   message      {string}    — body text
 *   confirmLabel {string}    — confirm button label (default: "Confirm")
 *   cancelLabel  {string}    — cancel button label  (default: "Cancel")
 *   variant      {string}    — "danger" | "warning" | "info"  (default: "danger")
 *   onConfirm    {function}  — called when user clicks confirm
 *   onCancel     {function}  — called when user clicks cancel or backdrop
 */
const ConfirmDialog = ({
    isOpen,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'bg-red-100 text-red-600',
            confirm: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
        },
        warning: {
            icon: 'bg-amber-100 text-amber-600',
            confirm: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
        },
        info: {
            icon: 'bg-brand-light text-brand-teal',
            confirm: 'bg-brand-teal hover:bg-brand-teal/90 text-white shadow-brand-teal/20',
        },
    };

    const styles = variantStyles[variant] || variantStyles.danger;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <div className="flex justify-end p-4 pb-0">
                    <button
                        onClick={onCancel}
                        className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 pb-6 pt-2 text-center">
                    {/* Icon */}
                    <div className={`mx-auto mb-5 h-16 w-16 rounded-full flex items-center justify-center ${styles.icon}`}>
                        <AlertTriangle className="h-8 w-8" />
                    </div>

                    <h3 className="text-lg font-black text-brand-dark font-display mb-2">
                        {title}
                    </h3>
                    {message && (
                        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="px-8 pb-8 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-3 rounded-xl font-black text-sm shadow-lg transition-all active:scale-[0.98] ${styles.confirm}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
