"use client";

import { toast } from "sonner";
import { HTMLAttributes } from "react";

interface ActionFormProps extends Omit<HTMLAttributes<HTMLFormElement>, 'action'> {
  action: (formData: FormData) => Promise<any>;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
}

export default function ActionForm({ 
  action, 
  successMessage = "¡Guardado correctamente!", 
  errorMessage = "Ocurrió un error al guardar", 
  onSuccess,
  children, 
  ...props 
}: ActionFormProps) {
  
  const handleAction = async (formData: FormData) => {
    try {
      await action(formData);
      if (successMessage) toast.success(successMessage);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Action error:", error);
      toast.error(error.message || errorMessage);
    }
  };

  return (
    <form action={handleAction} {...props}>
      {children}
    </form>
  );
}
