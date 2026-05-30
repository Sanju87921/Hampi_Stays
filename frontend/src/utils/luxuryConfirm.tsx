import toast from "react-hot-toast";
import { Button } from "../components/ui/Button";
import { X, AlertTriangle } from "lucide-react";

export const luxuryConfirm = ({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  onConfirm
}: {
  title?: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
}) => {
  toast.custom((t) => (
    <div
      className={`
        ${t.visible ? 'animate-enter' : 'animate-leave'}
        max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex flex-col p-6 border border-sand-100 relative
      `}
    >
      <button 
        onClick={() => toast.dismiss(t.id)} 
        className="absolute top-4 right-4 p-2 text-navy-950/40 hover:bg-sand-50 rounded-full transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-navy-950 font-serif mb-2">
            {title}
          </h3>
          <p className="text-sm text-navy-950/60 mb-6">
            {description}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-auto justify-end">
        <Button
          variant="outline"
          onClick={() => toast.dismiss(t.id)}
          className="rounded-xl px-6 border-sand-200"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="rounded-xl px-6 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
        >
          {confirmText}
        </Button>
      </div>
    </div>
  ), {
    duration: Infinity,
    position: 'top-center'
  });
};
