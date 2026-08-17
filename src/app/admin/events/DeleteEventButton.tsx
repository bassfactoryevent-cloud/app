"use client";

import { Trash2 } from "lucide-react";
import { deleteEvent } from "./actions";
import { toast } from "sonner";
import { useTransition } from "react";

export default function DeleteEventButton({ id, eventName }: { id: string, eventName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    toast(`¿Eliminar evento "${eventName}"?`, {
      description: "Esta acción es irreversible y borrará todas las entradas.",
      action: {
        label: "Eliminar",
        onClick: () => {
          startTransition(async () => {
            try {
              await deleteEvent(id);
              toast.success("Evento eliminado exitosamente");
            } catch (error: any) {
              toast.error(`Error al eliminar: ${error.message}`);
            }
          });
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Eliminar evento"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0.5rem", borderRadius: "var(--radius-md)",
        backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444",
        border: "1px solid rgba(239, 68, 68, 0.2)", cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.5 : 1, transition: "all 0.2s ease"
      }}
      onMouseOver={(e) => { if (!isPending) e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)"; }}
      onMouseOut={(e) => { if (!isPending) e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"; }}
    >
      <Trash2 size={18} />
    </button>
  );
}
