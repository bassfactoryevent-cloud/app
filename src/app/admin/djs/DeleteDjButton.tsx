"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteDj } from "./actions";

export default function DeleteDjButton({ djId, djName }: { djId: string, djName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de que deseas eliminar al DJ "${djName}"? Esta acción no se puede deshacer.`)) {
      setIsDeleting(true);
      try {
        await deleteDj(djId);
      } catch (e) {
        console.error(e);
        alert("Error al eliminar el DJ.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
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
  );
}
