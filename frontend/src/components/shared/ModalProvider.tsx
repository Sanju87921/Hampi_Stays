import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

type ModalType = 'confirm' | 'success' | 'warning' | 'error' | 'info';

interface ModalOptions {
  title: string;
  message: string;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  hideCancel?: boolean;
}

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  confirm: (options: Omit<ModalOptions, 'type'>) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalOptions | null>(null);

  const showModal = (options: ModalOptions) => {
    setModal({ type: 'info', ...options });
  };

  const confirm = (options: Omit<ModalOptions, 'type'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        type: 'confirm',
        ...options,
        onConfirm: () => {
          setModal(null);
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          if (options.onCancel) options.onCancel();
          resolve(false);
        }
      });
    });
  };

  const closeModal = () => {
    if (modal?.onCancel) modal.onCancel();
    setModal(null);
  };

  const renderIcon = () => {
    switch (modal?.type) {
      case 'success': return <CheckCircle className="w-12 h-12 text-emerald-500 mb-4 mx-auto" />;
      case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500 mb-4 mx-auto" />;
      case 'error': return <XCircle className="w-12 h-12 text-red-500 mb-4 mx-auto" />;
      case 'confirm': return <AlertTriangle className="w-12 h-12 text-gold-500 mb-4 mx-auto" />;
      default: return <Info className="w-12 h-12 text-navy-500 mb-4 mx-auto" />;
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, confirm }}>
      {children}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-luxury p-8 border border-sand-100 z-10 text-center"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-sand-100 text-navy-950/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {renderIcon()}
              
              <h3 className="text-xl font-serif font-bold text-navy-950 mb-2">
                {modal.title}
              </h3>
              <p className="text-sm text-navy-950/70 mb-8 leading-relaxed">
                {modal.message}
              </p>
              
              <div className="flex gap-3 justify-center">
                {!modal.hideCancel && modal.type === 'confirm' && (
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-sand-200 text-navy-950 font-bold hover:bg-sand-50 transition-colors text-sm"
                  >
                    {modal.cancelText || 'Cancel'}
                  </button>
                )}
                <button
                  onClick={() => modal.onConfirm ? modal.onConfirm() : setModal(null)}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-lg text-sm ${
                    modal.type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                    modal.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' :
                    modal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' :
                    'bg-navy-900 hover:bg-navy-950 shadow-navy-900/20'
                  }`}
                >
                  {modal.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
};
