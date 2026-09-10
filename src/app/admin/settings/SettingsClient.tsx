"use client";

import { useState, useTransition } from "react";
import { 
  Building2, 
  ShoppingBag, 
  Ticket, 
  Share2, 
  Globe, 
  Save, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  Truck,
  Sparkles,
  Mail,
  MapPin,
  Clock
} from "lucide-react";
import { updatePlatformSettings } from "./actions";
import { PlatformSettingsData } from "./types";
import { toast } from "sonner";
import styles from "./Settings.module.css";

interface SettingsClientProps {
  initialSettings: PlatformSettingsData;
}

type TabType = "general" | "merch" | "tickets" | "support" | "seo";

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [formData, setFormData] = useState<PlatformSettingsData>(initialSettings);
  const [isPending, startTransition] = useTransition();

  const handleChange = (field: keyof PlatformSettingsData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    
    // Explicitly handle checkboxes
    data.set("is_merch_enabled", formData.is_merch_enabled ? "on" : "off");
    data.set("is_tickets_enabled", formData.is_tickets_enabled ? "on" : "off");

    startTransition(async () => {
      const res = await updatePlatformSettings(data);
      if (res.success) {
        toast.success(res.message || "Ajustes guardados correctamente");
      } else {
        toast.error(res.error || "Ocurrió un error al guardar los ajustes");
      }
    });
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "general", label: "Empresa & Facturación", icon: Building2 },
    { id: "merch", label: "Tienda & Envíos", icon: ShoppingBag },
    { id: "tickets", label: "Boletería & Reglas", icon: Ticket },
    { id: "support", label: "Soporte & Redes", icon: Share2 },
    { id: "seo", label: "SEO Global", icon: Globe },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={14} />
          Configuración del Sistema
        </div>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.title}>Ajustes Globales de Plataforma</h1>
            <p className={styles.subtitle}>
              Administra los parámetros de facturación legal, envíos de merchandising, seguridad de boletería y presencia digital.
            </p>
          </div>

          <div className={styles.syncTag}>
            <ShieldCheck size={16} />
            Sincronizado con Supabase
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Navigation Tabs */}
        <div className={styles.tabsNav}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ""}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Empresa & Facturación */}
        {activeTab === "general" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.iconCircle}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Datos Corporativos & Consecutivos</h2>
                  <p className={styles.cardSubtitle}>
                    Esta información se refleja en las facturas oficiales emitidas a los clientes (PDF y correos).
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Razón Social / Nombre Comercial</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={e => handleChange("company_name", e.target.value)}
                  required
                  placeholder="Ej. BASSFACTORY ENTERTAINMENT S.A.S."
                  className={styles.input}
                />
                <span className={styles.helpText}>Aparece en la cabecera de las facturas generadas.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>NIT / Identificación Fiscal</label>
                <input
                  type="text"
                  name="company_nit"
                  value={formData.company_nit}
                  onChange={e => handleChange("company_nit", e.target.value)}
                  required
                  placeholder="901.654.321-0"
                  className={styles.input}
                />
                <span className={styles.helpText}>Régimen tributario o número de identificación ante la DIAN.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Prefijo Consecutivo de Facturación</label>
                <div className={styles.inputWrapper}>
                  <FileText size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    name="invoice_prefix"
                    value={formData.invoice_prefix}
                    onChange={e => handleChange("invoice_prefix", e.target.value)}
                    required
                    placeholder="BF-FAC"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    style={{ textTransform: "uppercase", fontFamily: "monospace" }}
                  />
                </div>
                <span className={styles.helpText}>
                  Ejemplo de formato consecutivo resultante: {formData.invoice_prefix}-000142.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Correo para Copia de Facturación y Ventas</label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="email"
                    name="company_email"
                    value={formData.company_email}
                    onChange={e => handleChange("company_email", e.target.value)}
                    required
                    placeholder="ventas@bassfactory.co"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
                <span className={styles.helpText}>Recibirá notificaciones y copias de cada compra aprobada.</span>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Dirección Fiscal / Sede de Despacho</label>
                <div className={styles.inputWrapper}>
                  <MapPin size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={e => handleChange("address", e.target.value)}
                    required
                    placeholder="Bogotá D.C., Colombia"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tienda & Envíos */}
        {activeTab === "merch" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={`${styles.iconCircle} ${styles.iconCirclePurple}`}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Configuración del Merchandising</h2>
                  <p className={styles.cardSubtitle}>
                    Tarifas de mensajería nacional, políticas de envío y disponibilidad de la tienda.
                  </p>
                </div>
              </div>

              <div
                className={styles.switchLabel}
                onClick={() => handleChange("is_merch_enabled", !formData.is_merch_enabled)}
              >
                <div className={`${styles.switchTrack} ${formData.is_merch_enabled ? styles.switchTrackActive : ""}`}>
                  <div className={`${styles.switchThumb} ${formData.is_merch_enabled ? styles.switchThumbActive : ""}`} />
                </div>
                <span className={styles.switchStatusText}>
                  {formData.is_merch_enabled ? "Tienda Activa" : "En Mantenimiento"}
                </span>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Costo de Envío Estándar (COP)</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} style={{ fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    name="shipping_cost"
                    value={formData.shipping_cost}
                    onChange={e => handleChange("shipping_cost", Number(e.target.value))}
                    required
                    min={0}
                    step={500}
                    placeholder="15000"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
                <span className={styles.helpText}>Tarifa plana sumada automáticamente en checkout para pedidos físicos.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Envío Gratis desde (COP)</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} style={{ fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    name="free_shipping_threshold"
                    value={formData.free_shipping_threshold}
                    onChange={e => handleChange("free_shipping_threshold", Number(e.target.value))}
                    required
                    min={0}
                    step={1000}
                    placeholder="0"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
                <span className={styles.helpText}>Coloca 0 para cobrar siempre el costo estándar.</span>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Promesa / Tiempo de Entrega Mostrado al Cliente</label>
                <div className={styles.inputWrapper}>
                  <Truck size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    name="delivery_time_text"
                    value={formData.delivery_time_text}
                    onChange={e => handleChange("delivery_time_text", e.target.value)}
                    required
                    placeholder="3 a 5 días hábiles a nivel nacional"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
                <span className={styles.helpText}>Texto visible en el checkout y en el correo de confirmación de despacho.</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Boletería & Reglas */}
        {activeTab === "tickets" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={`${styles.iconCircle} ${styles.iconCircleCyan}`}>
                  <Ticket size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Políticas de Boletas & Anti-Fraude</h2>
                  <p className={styles.cardSubtitle}>
                    Control de activación de QR dinámico, plazos de transferencia y límites de compra.
                  </p>
                </div>
              </div>

              <div
                className={styles.switchLabel}
                onClick={() => handleChange("is_tickets_enabled", !formData.is_tickets_enabled)}
              >
                <div className={`${styles.switchTrack} ${formData.is_tickets_enabled ? styles.switchTrackActive : ""}`}>
                  <div className={`${styles.switchThumb} ${formData.is_tickets_enabled ? styles.switchThumbActive : ""}`} />
                </div>
                <span className={styles.switchStatusText}>
                  {formData.is_tickets_enabled ? "Venta Abierta" : "Venta Pausada"}
                </span>
              </div>
            </div>

            <div className={styles.formGridThree}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Activación de QR (Horas antes)</label>
                <div className={styles.inputWrapper}>
                  <Clock size={16} className={styles.inputIcon} />
                  <input
                    type="number"
                    name="ticket_activation_hours"
                    value={formData.ticket_activation_hours}
                    onChange={e => handleChange("ticket_activation_hours", Number(e.target.value))}
                    required
                    min={1}
                    max={168}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
                <span className={styles.helpText}>Default: 24h. Evita clonación anticipada de códigos QR.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Límite Aceptar Transferencia (Horas)</label>
                <div className={styles.inputWrapper}>
                  <Clock size={16} className={styles.inputIcon} />
                  <input
                    type="number"
                    name="transfer_limit_hours"
                    value={formData.transfer_limit_hours}
                    onChange={e => handleChange("transfer_limit_hours", Number(e.target.value))}
                    required
                    min={1}
                    max={720}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    style={{ fontFamily: "monospace" }}
                  />
                </div>
                <span className={styles.helpText}>Si no se acepta en este lapso, vuelve al remitente original.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Máx Boletas por Transacción</label>
                <input
                  type="number"
                  name="max_tickets_per_order"
                  value={formData.max_tickets_per_order}
                  onChange={e => handleChange("max_tickets_per_order", Number(e.target.value))}
                  required
                  min={1}
                  max={50}
                  className={styles.input}
                  style={{ fontFamily: "monospace" }}
                />
                <span className={styles.helpText}>Límite por carrito para mitigar revendedores no autorizados.</span>
              </div>
            </div>

            <div className={styles.callout}>
              <AlertTriangle size={18} style={{ color: "#22d3ee", flexShrink: 0, marginTop: "2px" }} />
              <p className={styles.calloutText}>
                Las boletas adquiridas se mantienen en estado bloqueado hasta que falte el tiempo configurado ({formData.ticket_activation_hours}h). En ese momento, el usuario ve el botón interactivo de descarga de PDF y visualización de QR dinámico.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Soporte & Redes */}
        {activeTab === "support" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={`${styles.iconCircle} ${styles.iconCircleGreen}`}>
                  <Share2 size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Canales de Atención & Redes Sociales</h2>
                  <p className={styles.cardSubtitle}>
                    Líneas de ayuda técnica, enlaces de pie de página y botones directos de WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Línea de WhatsApp Oficial</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} style={{ fontWeight: 800, color: "#10b981", fontSize: "0.75rem" }}>WA</span>
                  <input
                    type="text"
                    name="social_whatsapp"
                    value={formData.social_whatsapp}
                    onChange={e => handleChange("social_whatsapp", e.target.value)}
                    placeholder="+57 319 254 3690"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
                <span className={styles.helpText}>Conecta el botón flotante de soporte en vivo.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email de Soporte al Rave / Cliente</label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="email"
                    name="support_email"
                    value={formData.support_email}
                    onChange={e => handleChange("support_email", e.target.value)}
                    required
                    placeholder="soporte@bassfactory.co"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Instagram URL</label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <input
                    type="url"
                    name="social_instagram"
                    value={formData.social_instagram}
                    onChange={e => handleChange("social_instagram", e.target.value)}
                    placeholder="https://instagram.com/bassfactory"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>TikTok URL</label>
                <input
                  type="url"
                  name="social_tiktok"
                  value={formData.social_tiktok}
                  onChange={e => handleChange("social_tiktok", e.target.value)}
                  placeholder="https://tiktok.com/@bassfactory"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>YouTube Canal Oficial</label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                  <input
                    type="url"
                    name="social_youtube"
                    value={formData.social_youtube}
                    onChange={e => handleChange("social_youtube", e.target.value)}
                    placeholder="https://youtube.com/bassfactory"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>X / Twitter</label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                  <input
                    type="url"
                    name="social_twitter"
                    value={formData.social_twitter}
                    onChange={e => handleChange("social_twitter", e.target.value)}
                    placeholder="https://twitter.com/bassfactory"
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: SEO Global */}
        {activeTab === "seo" && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <div className={`${styles.iconCircle} ${styles.iconCircleAmber}`}>
                  <Globe size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Posicionamiento Orgánico & Meta Etiquetas</h2>
                  <p className={styles.cardSubtitle}>
                    Configuración global de OpenGraph, buscadores (Google) y previews en redes sociales.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Título Principal de la Plataforma (Meta Title)</label>
                <input
                  type="text"
                  name="site_title"
                  value={formData.site_title}
                  onChange={e => handleChange("site_title", e.target.value)}
                  required
                  placeholder="Bassfactory | Plataforma Oficial de Música Electrónica"
                  className={styles.input}
                />
                <div className={styles.charCount}>
                  <span>Recomendado: entre 50 y 65 caracteres</span>
                  <span>{formData.site_title.length} caracteres</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Meta Descripción del Ecosistema</label>
                <textarea
                  rows={3}
                  name="site_description"
                  value={formData.site_description}
                  onChange={e => handleChange("site_description", e.target.value)}
                  required
                  placeholder="Breve descripción que aparecerá en los resultados de búsqueda de Google..."
                  className={styles.textarea}
                />
                <div className={styles.charCount}>
                  <span>Recomendado: entre 120 y 160 caracteres</span>
                  <span>{formData.site_description.length} caracteres</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Palabras Clave (Separadas por comas)</label>
                <input
                  type="text"
                  name="site_keywords"
                  value={formData.site_keywords}
                  onChange={e => handleChange("site_keywords", e.target.value)}
                  placeholder="Techno, Drum and Bass, Eventos Bogotá, Boletas, Raves Colombia, Merch Oficial"
                  className={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Floating Bar with Save Button */}
        <div className={styles.saveBar}>
          <div className={styles.saveBarLeft}>
            <div className={styles.liveDot} />
            <span className={styles.saveBarNotice}>
              Los cambios se guardan y sincronizan automáticamente.
            </span>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className={styles.saveBtn}
          >
            {isPending ? (
              <>
                <div className={styles.spinner} />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
