import { useState } from 'react';
import { XCircle, AlertTriangle, X } from 'lucide-react';
import { LoadingButton } from './LoadingButton.jsx';

export default function CancelOrderModal({ isOpen, onClose, onConfirm, status = 'idle' }) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason || 'Cancelled by user');
  };

  const handleClose = () => {
    if (status !== 'loading') {
      setReason('');
      setConfirmed(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
      <div className="w-full max-w-md bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow-lg animate-[scaleIn_0.2s_ease-out] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b-[3px] border-[color:var(--chipzo-ink)] bg-red-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 brutal-border flex items-center justify-center">
              <AlertTriangle size={20} className="text-white" strokeWidth={3} />
            </div>
            <h3 className="font-black uppercase text-sm">Cancel Order</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={status === 'loading'}
            className="w-8 h-8 flex items-center justify-center brutal-border brutal-shadow-sm bg-[color:var(--chipzo-paper)] hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-bold text-[color:var(--chipzo-muted)]">
            Are you sure you want to cancel this order? This action cannot be undone.
            {confirmed && ' The cancellation will also be sent to Shiprocket.'}
          </p>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[color:var(--chipzo-muted)] block mb-1.5">
              Reason for cancellation (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Changed my mind, Found better price..."
              rows={3}
              disabled={status === 'loading'}
              className="w-full border-[3px] border-[color:var(--chipzo-ink)] px-4 py-3 text-sm font-bold bg-[color:var(--chipzo-paper)] outline-none resize-none disabled:opacity-50"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-red-500 w-5 h-5"
            />
            <span className="text-xs font-bold text-[color:var(--chipzo-muted)]">
              I understand that cancelling will process a refund and cancel the shipment.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-[3px] border-[color:var(--chipzo-ink)] flex gap-3">
          <button
            onClick={handleClose}
            disabled={status === 'loading'}
            className="flex-1 brutal-border bg-[color:var(--chipzo-paper)] py-3 text-xs font-black uppercase cursor-pointer disabled:opacity-50 hover:bg-[color:var(--chipzo-surface)] transition-all"
          >
            KEEP ORDER
          </button>
          <LoadingButton
            onClick={handleConfirm}
            status={status}
            disabled={!confirmed}
            variant="danger"
            size="sm"
            icon={XCircle}
            className="flex-1"
          >
            CONFIRM CANCEL
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
