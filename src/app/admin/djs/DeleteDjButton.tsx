"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteDj } from "./actions";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

export default function DeleteDjButton({ djId, djName }: { djId: string, djName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDj(djId);
      toast.success("DJ eliminado correctamente");
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar el DJ.");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        title="Eliminar DJ"
        style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
          border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer',
          opacity: isDeleting ? 0.5 : 1, transition: 'all 0.2s'
        }}
      >
        <Trash2 size={16} />
      </button>

      <ConfirmModal 
        isOpen={showConfirm}
        title="Eliminar DJ"
        message={`¿Estás seguro de que deseas eliminar al DJ "${djName}"? Esta acción no se puede deshacer y borrará toda su información de presskit.`}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
