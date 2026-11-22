import Modal from './Modal';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => unknown;
  onClose?: () => void;
  onCancel?: () => void;
  danger?: boolean;
}

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  onCancel,
  danger = true,
}: Props) => {
  const close = onCancel || onClose || (() => {});
  const label = confirmText || confirmLabel || 'Confirm';
  return (
    <Modal open={open} title={title} onClose={close} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={close}>{cancelText}</button>
        <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { void onConfirm(); }}>{label}</button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
