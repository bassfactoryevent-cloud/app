"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { updateDjEPK } from "../actions";

export default function SaveDjForm({ djId, children }: { djId: string, children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateDjEPK(djId, formData);
        toast.success("Cambios guardados correctamente");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        console.error(e);
        toast.error("Error al guardar los cambios");
      }
    });
  };

  return (
    <form action={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {children}
      
      <div style={{ 
        position: 'sticky', bottom: '2rem', 
        backgroundColor: 'rgba(10, 10, 10, 0.95)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '1rem', 
        border: '1px solid rgba(255,255,255,0.15)', 
        borderRadius: 'var(--radius-lg)', 
        display: 'flex', justifyContent: 'flex-end', 
        zIndex: 50,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        <button 
          type="submit"
          disabled={isPending}
          style={{ 
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', 
            backgroundColor: 'var(--color-magenta)', color: 'white', 
            padding: '1rem 2rem', borderRadius: 'var(--radius-md)', border: 'none', 
            fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '1.1rem',
            opacity: isPending ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          <Save size={20} /> {isPending ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
