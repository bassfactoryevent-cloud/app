"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Quote, Undo, Redo, 
  Image as ImageIcon, Link as LinkIcon, UploadCloud, 
  X, Loader2, Sparkles, Smartphone, Monitor, Check
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './TiptapEditor.module.css';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

// Helper to format bytes cleanly
function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Built-in image optimization and upload
async function performImageUpload(file: File, customUpload?: (file: File) => Promise<string>): Promise<string> {
  if (customUpload) {
    return await customUpload(file);
  }

  // 1. Optimize image (convert to WebP, shrink payload, preserve visual quality)
  const { optimizeImage } = await import('@/utils/imageOptimizer');
  const compressedFile = await optimizeImage(file);

  // 2. Upload to server-side admin upload API
  const formData = new FormData();
  formData.append('file', compressedFile);
  formData.append('bucket', 'blog-media');

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Error del servidor (${res.status})`);
  }

  const data = await res.json();
  return data.url;
}

// ==========================================
// IMAGE MODAL COMPONENT (Upload from PC/Mobile or URL)
// ==========================================
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (url: string, alt?: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const ImageModal = ({ isOpen, onClose, onInsertImage, onImageUpload }: ImageModalProps) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setAltText('');
      setUrlInput('');
      setIsUploading(false);
      setUploadStep('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, etc.)');
      return;
    }
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndInsert = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona una imagen primero.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStep('Optimizando y convirtiendo a WebP...');
      
      const publicUrl = await performImageUpload(selectedFile, onImageUpload);
      
      setUploadStep('Insertando en el artículo...');
      onInsertImage(publicUrl, altText.trim() || selectedFile.name);
      toast.success('¡Imagen optimizada e insertada con éxito!');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error al subir la imagen.');
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  const handleUrlInsert = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error('Ingresa una URL válida de imagen.');
      return;
    }
    onInsertImage(trimmed, altText.trim());
    toast.success('Imagen insertada por enlace.');
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: '#121216',
          border: '1px solid #27272a',
          borderRadius: '1rem',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          color: '#ffffff',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #27272a',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={20} color="#ff3344" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Insertar Imagen en el Artículo
              </h3>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#a1a1aa' }}>
              Sube fotos desde tu celular o PC optimizadas sin saturar el servidor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              padding: '0.35rem',
              borderRadius: '0.35rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #27272a',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '0.85rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2px solid #ff3344' : '2px solid transparent',
              color: activeTab === 'upload' ? '#ffffff' : '#71717a',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
            }}
          >
            <UploadCloud size={16} /> Subir desde PC / Celular
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            style={{
              flex: 1,
              padding: '0.85rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'url' ? '2px solid #ff3344' : '2px solid transparent',
              color: activeTab === 'url' ? '#ffffff' : '#71717a',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
            }}
          >
            <LinkIcon size={16} /> Enlace Web (URL)
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'upload' ? (
            <div>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {!previewUrl ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? '#ff3344' : 'rgba(255, 255, 255, 0.2)'}`,
                    backgroundColor: isDragging ? 'rgba(217, 4, 22, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '0.75rem',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                  }}>
                    <UploadCloud size={24} color="#00f0ff" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', marginBottom: '0.25rem' }}>
                    Toca para elegir desde tu dispositivo o arrastra aquí
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#a1a1aa', marginBottom: '1rem' }}>
                    Compatible con iPhone, Android, Mac y PC (JPG, PNG, WebP)
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    borderRadius: '2rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}>
                    <Sparkles size={12} /> Compresión inteligente WebP automática
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    position: 'relative',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    maxHeight: '220px',
                    backgroundColor: '#09090b',
                    border: '1px solid #27272a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={previewUrl} 
                      alt="Vista previa" 
                      style={{ maxHeight: '220px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      disabled={isUploading}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {selectedFile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
                      <span style={{ fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                        {selectedFile.name}
                      </span>
                      <span>
                        Original: {formatBytes(selectedFile.size)} &rarr; <span style={{ color: '#22c55e', fontWeight: 700 }}>WebP Ligero</span>
                      </span>
                    </div>
                  )}

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Descripción / Texto alternativo (Opcional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: Escenario principal del festival con luces"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      disabled={isUploading}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #27272a',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        color: 'white',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleUploadAndInsert}
                    disabled={isUploading}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '0.5rem',
                      backgroundColor: isUploading ? 'rgba(217, 4, 22, 0.5)' : '#ff3344',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {uploadStep || 'Procesando imagen...'}
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Subir e Insertar en el Artículo
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  URL Pública de la Imagen
                </label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/photo-..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #27272a',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Texto alternativo (Opcional)
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Productor en el estudio"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #27272a',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: 'white',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleUrlInsert}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#ff3344',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <Check size={16} /> Insertar Imagen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// LINK MODAL COMPONENT (Clean modal, no alert)
// ==========================================
interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl?: string;
  onApplyLink: (url: string | null) => void;
}

const LinkModal = ({ isOpen, onClose, currentUrl = '', onApplyLink }: LinkModalProps) => {
  const [url, setUrl] = useState(currentUrl);

  useEffect(() => {
    if (isOpen) {
      setUrl(currentUrl);
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      onApplyLink(null);
    } else {
      // Add https:// if missing
      const formatted = cleanUrl.match(/^https?:\/\//i) ? cleanUrl : `https://${cleanUrl}`;
      onApplyLink(formatted);
    }
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        style={{
          backgroundColor: '#121216',
          border: '1px solid #27272a',
          borderRadius: '0.85rem',
          maxWidth: '440px',
          width: '100%',
          padding: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LinkIcon size={18} color="#00f0ff" /> Enlace de Texto
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Dirección Web (URL)
            </label>
            <input 
              type="text" 
              placeholder="https://bassfactory.co/events/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.5rem',
                border: '1px solid #27272a',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                color: 'white',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            {currentUrl && (
              <button
                type="button"
                onClick={() => { onApplyLink(null); onClose(); }}
                style={{
                  padding: '0.6rem 0.9rem',
                  borderRadius: '0.4rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Quitar Enlace
              </button>
            )}
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '0.4rem',
                backgroundColor: '#ff3344',
                border: 'none',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// TOOLBAR MENUBAR
// ==========================================
const MenuBar = ({ 
  editor, 
  onOpenImageModal, 
  onOpenLinkModal 
}: { 
  editor: any; 
  onOpenImageModal: () => void;
  onOpenLinkModal: () => void;
}) => {
  if (!editor) {
    return null;
  }

  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('bold') ? styles.isActive : ''}`}
        title="Negrita (Ctrl+B)"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('italic') ? styles.isActive : ''}`}
        title="Cursiva (Ctrl+I)"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('strike') ? styles.isActive : ''}`}
        title="Tachado"
      >
        <Strikethrough size={16} />
      </button>

      <div className={styles.divider}></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? styles.isActive : ''}`}
        title="Título de Sección (H2)"
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? styles.isActive : ''}`}
        title="Subtítulo (H3)"
      >
        <Heading2 size={16} />
      </button>

      <div className={styles.divider}></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('bulletList') ? styles.isActive : ''}`}
        title="Lista de Viñetas"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('orderedList') ? styles.isActive : ''}`}
        title="Lista Numerada"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('blockquote') ? styles.isActive : ''}`}
        title="Cita Destacada"
      >
        <Quote size={16} />
      </button>

      <div className={styles.divider}></div>

      <button
        type="button"
        onClick={onOpenLinkModal}
        className={`${styles.toolbarBtn} ${editor.isActive('link') ? styles.isActive : ''}`}
        title="Insertar o Editar Enlace"
      >
        <LinkIcon size={16} />
      </button>

      <button
        type="button"
        onClick={onOpenImageModal}
        className={styles.toolbarBtn}
        title="Subir Imagen (PC / Móvil o URL)"
      >
        <ImageIcon size={16} />
      </button>

      <div className={styles.divider}></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className={styles.toolbarBtn}
        title="Deshacer"
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className={styles.toolbarBtn}
        title="Rehacer"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

// ==========================================
// MAIN TIPTAP EDITOR
// ==========================================
export default function TiptapEditor({ content, onChange, onImageUpload }: TiptapEditorProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Escribe tu increíble artículo aquí...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.prose,
      },
      // Direct paste and drop handling for images
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            event.preventDefault();
            const toastId = toast.loading('Optimizando y subiendo imagen pegada...');
            performImageUpload(file, onImageUpload)
              .then((url) => {
                editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
                toast.success('Imagen insertada con éxito', { id: toastId });
              })
              .catch((err) => {
                toast.error('Error al subir imagen pegada: ' + err.message, { id: toastId });
              });
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            event.preventDefault();
            const toastId = toast.loading('Optimizando y subiendo imagen arrastrada...');
            performImageUpload(file, onImageUpload)
              .then((url) => {
                editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
                toast.success('Imagen insertada con éxito', { id: toastId });
              })
              .catch((err) => {
                toast.error('Error al subir imagen arrastrada: ' + err.message, { id: toastId });
              });
            return true;
          }
        }
        return false;
      },
    },
  });

  const handleInsertImage = useCallback((url: string, alt?: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
    }
  }, [editor]);

  const handleApplyLink = useCallback((url: string | null) => {
    if (!editor) return;
    if (url === null) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const currentLinkUrl = editor?.getAttributes('link')?.href || '';

  return (
    <div className={styles.editorWrapper}>
      <MenuBar 
        editor={editor} 
        onOpenImageModal={() => setIsImageModalOpen(true)}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
      />
      <EditorContent editor={editor} />

      {/* Modern Pop-up Modals (Replacing native alert/prompt) */}
      <ImageModal 
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsertImage={handleInsertImage}
        onImageUpload={onImageUpload}
      />

      <LinkModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        currentUrl={currentLinkUrl}
        onApplyLink={handleApplyLink}
      />
    </div>
  );
}
