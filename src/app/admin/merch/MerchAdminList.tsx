"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Edit, Trash2 } from "lucide-react";
import ActionForm from "@/components/admin/ActionForm";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import { deleteMerchProduct } from "./actions";

export default function MerchAdminList({ products, categories }: { products: any[], categories: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: ""
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMerchProduct(confirmDelete.id);
      setConfirmDelete({ isOpen: false, id: "", name: "" });
      toast.success("Producto eliminado correctamente");
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar el producto");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Buscar producto..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '1 1 300px', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
        />
        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minWidth: '200px' }}
        >
          <option value="all">Todas las Categorías</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredProducts?.map((product: any) => {
          const primaryImage = product.merch_product_images?.find((img: any) => img.is_primary)?.image_url || product.merch_product_images?.[0]?.image_url;
          return (
            <div key={product.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '200px', backgroundColor: 'rgba(0,0,0,0.5)', position: 'relative' }}>
                {primaryImage ? (
                  <Image src={primaryImage} alt={product.title} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                    <Package size={48} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: product.status === 'published' ? '#22c55e' : '#ef4444', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  {product.status === 'published' ? 'Público' : 'Oculto'}
                </div>
              </div>
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-magenta)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {product.merch_categories?.name || 'Sin Categoría'}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{product.title}</h3>
                <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.875rem', flex: 1 }}>
                  Precio base: ${parseFloat(product.base_price).toLocaleString('es-CO')}
                </p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link href={`/admin/merch/${product.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontSize: '0.875rem' }}>
                    <Edit size={16} /> Editar Producto
                  </Link>
                  <button 
                    onClick={() => setConfirmDelete({ isOpen: true, id: product.id, name: product.title })}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts?.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No hay resultados</h3>
            <p style={{ opacity: 0.7 }}>Ningún producto coincide con los filtros aplicados.</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar el producto "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: "", name: "" })}
        isLoading={isDeleting}
      />
    </>
  );
}
