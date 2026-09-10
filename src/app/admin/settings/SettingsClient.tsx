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

  const tabs: { id: TabType; label: string; icon: any; badge?: string }[] = [
    { id: "general", label: "Empresa & Facturación", icon: Building2 },
    { id: "merch", label: "Tienda & Envíos", icon: ShoppingBag },
    { id: "tickets", label: "Boletería & Reglas", icon: Ticket },
    { id: "support", label: "Soporte & Redes", icon: Share2 },
    { id: "seo", label: "SEO Global", icon: Globe },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-magenta/10 border border-magenta/20 text-magenta text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Configuración del Sistema
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Ajustes Globales de Plataforma
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Administra los parámetros de facturación legal, envíos de merchandising, seguridad de boletería y presencia digital.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            Sincronizado con Supabase
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 border-b border-white/10 no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-magenta text-white shadow-lg shadow-magenta/25"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Empresa & Facturación */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-magenta/10 border border-magenta/20 flex items-center justify-center text-magenta">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Datos Corporativos & Consecutivos</h2>
                  <p className="text-xs text-zinc-400">Esta información se refleja en las facturas oficiales emitidas a los clientes (PDF y correos).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Razón Social / Nombre Comercial
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={e => handleChange("company_name", e.target.value)}
                    required
                    placeholder="Ej. BASSFACTORY ENTERTAINMENT S.A.S."
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">Aparece en la cabecera de las facturas generadas.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    NIT / Identificación Fiscal
                  </label>
                  <input
                    type="text"
                    name="company_nit"
                    value={formData.company_nit}
                    onChange={e => handleChange("company_nit", e.target.value)}
                    required
                    placeholder="901.654.321-0"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">Régimen tributario o número de identificación ante la DIAN.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Prefijo Consecutivo de Facturación
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="invoice_prefix"
                      value={formData.invoice_prefix}
                      onChange={e => handleChange("invoice_prefix", e.target.value)}
                      required
                      placeholder="BF-FAC"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta font-mono uppercase transition"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Ejemplo de formato consecutivo resultante: {formData.invoice_prefix}-000142.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Correo para Copia de Facturación y Ventas
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="company_email"
                      value={formData.company_email}
                      onChange={e => handleChange("company_email", e.target.value)}
                      required
                      placeholder="ventas@bassfactory.co"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Recibirá notificaciones y copias de cada compra aprobada.</span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Dirección Fiscal / Sede de Despacho
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={e => handleChange("address", e.target.value)}
                      required
                      placeholder="Bogotá D.C., Colombia"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tienda & Envíos */}
        {activeTab === "merch" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Configuración del Merchandising</h2>
                    <p className="text-xs text-zinc-400">Tarifas de mensajería nacional, políticas de envío y disponibilidad de la tienda.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_merch_enabled}
                    onChange={e => handleChange("is_merch_enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-3 text-xs font-bold text-zinc-300">
                    {formData.is_merch_enabled ? "Tienda Activa" : "En Mantenimiento"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Costo de Envío Estándar (COP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                    <input
                      type="number"
                      name="shipping_cost"
                      value={formData.shipping_cost}
                      onChange={e => handleChange("shipping_cost", Number(e.target.value))}
                      required
                      min={0}
                      step={500}
                      placeholder="15000"
                      className="w-full pl-9 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Tarifa plana sumada automáticamente en checkout para pedidos físicos.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Envío Gratis desde (COP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                    <input
                      type="number"
                      name="free_shipping_threshold"
                      value={formData.free_shipping_threshold}
                      onChange={e => handleChange("free_shipping_threshold", Number(e.target.value))}
                      required
                      min={0}
                      step={1000}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Coloca 0 para cobrar siempre el costo estándar.</span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Promesa / Tiempo de Entrega Mostrado al Cliente
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="delivery_time_text"
                      value={formData.delivery_time_text}
                      onChange={e => handleChange("delivery_time_text", e.target.value)}
                      required
                      placeholder="3 a 5 días hábiles a nivel nacional"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Texto visible en el checkout y en el correo de confirmación de despacho.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Boletería & Reglas */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Políticas de Boletas & Anti-Fraude</h2>
                    <p className="text-xs text-zinc-400">Control de activación de QR dinámico, plazos de transferencia y límites de compra.</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_tickets_enabled}
                    onChange={e => handleChange("is_tickets_enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-3 text-xs font-bold text-zinc-300">
                    {formData.is_tickets_enabled ? "Venta Abierta" : "Venta Pausada"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Activación de QR (Horas antes)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      name="ticket_activation_hours"
                      value={formData.ticket_activation_hours}
                      onChange={e => handleChange("ticket_activation_hours", Number(e.target.value))}
                      required
                      min={1}
                      max={168}
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta font-mono transition"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Default: 24 horas. Evita clonación anticipada de códigos QR.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Límite para Aceptar Transferencia (Horas)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      name="transfer_limit_hours"
                      value={formData.transfer_limit_hours}
                      onChange={e => handleChange("transfer_limit_hours", Number(e.target.value))}
                      required
                      min={1}
                      max={720}
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta font-mono transition"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Si el destinatario no acepta en este lapso, la boleta vuelve al remitente.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Máximo Boletas por Transacción
                  </label>
                  <input
                    type="number"
                    name="max_tickets_per_order"
                    value={formData.max_tickets_per_order}
                    onChange={e => handleChange("max_tickets_per_order", Number(e.target.value))}
                    required
                    min={1}
                    max={50}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta font-mono transition"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">Límite por carrito para mitigar revendedores no autorizados.</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Las boletas adquiridas se mantienen en estado bloqueado hasta que falte el tiempo configurado ({formData.ticket_activation_hours}h). En ese momento, el usuario ve el botón interactivo de descarga de PDF y visualización de QR dinámico.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Soporte & Redes */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Canales de Atención & Redes Sociales</h2>
                  <p className="text-xs text-zinc-400">Líneas de ayuda técnica, enlaces de pie de página y botones directos de WhatsApp.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Línea de WhatsApp Oficial
                  </label>
                  <div className="relative">
                    <span className="text-emerald-500 font-bold text-xs absolute left-3.5 top-1/2 -translate-y-1/2">WA</span>
                    <input
                      type="text"
                      name="social_whatsapp"
                      value={formData.social_whatsapp}
                      onChange={e => handleChange("social_whatsapp", e.target.value)}
                      placeholder="+57 319 254 3690"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">Conecta el botón flotante de soporte en vivo.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Email de Soporte al Rave / Cliente
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="support_email"
                      value={formData.support_email}
                      onChange={e => handleChange("support_email", e.target.value)}
                      required
                      placeholder="soporte@bassfactory.co"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Instagram URL
                  </label>
                  <div className="relative">
                    <svg className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    TikTok URL
                  </label>
                  <input
                    type="url"
                    name="social_tiktok"
                    value={formData.social_tiktok}
                    onChange={e => handleChange("social_tiktok", e.target.value)}
                    placeholder="https://tiktok.com/@bassfactory"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    YouTube Canal Oficial
                  </label>
                  <div className="relative">
                    <svg className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                    <input
                      type="url"
                      name="social_youtube"
                      value={formData.social_youtube}
                      onChange={e => handleChange("social_youtube", e.target.value)}
                      placeholder="https://youtube.com/bassfactory"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    X / Twitter
                  </label>
                  <div className="relative">
                    <svg className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                    </svg>
                    <input
                      type="url"
                      name="social_twitter"
                      value={formData.social_twitter}
                      onChange={e => handleChange("social_twitter", e.target.value)}
                      placeholder="https://twitter.com/bassfactory"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: SEO Global */}
        {activeTab === "seo" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Posicionamiento Orgánico & Meta Etiquetas</h2>
                  <p className="text-xs text-zinc-400">Configuración global de OpenGraph, buscadores (Google) y previews en redes sociales.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Título Principal de la Plataforma (Meta Title)
                  </label>
                  <input
                    type="text"
                    name="site_title"
                    value={formData.site_title}
                    onChange={e => handleChange("site_title", e.target.value)}
                    required
                    placeholder="Bassfactory | Plataforma Oficial de Música Electrónica"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                    <span>Recomendado: entre 50 y 65 caracteres</span>
                    <span>{formData.site_title.length} caracteres</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Meta Descripción del Ecosistema
                  </label>
                  <textarea
                    rows={3}
                    name="site_description"
                    value={formData.site_description}
                    onChange={e => handleChange("site_description", e.target.value)}
                    required
                    placeholder="Breve descripción que aparecerá en los resultados de búsqueda de Google..."
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition resize-none"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                    <span>Recomendado: entre 120 y 160 caracteres</span>
                    <span>{formData.site_description.length} caracteres</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                    Palabras Clave (Separadas por comas)
                  </label>
                  <input
                    type="text"
                    name="site_keywords"
                    value={formData.site_keywords}
                    onChange={e => handleChange("site_keywords", e.target.value)}
                    placeholder="Techno, Drum and Bass, Eventos Bogotá, Boletas, Raves Colombia, Merch Oficial"
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-magenta transition"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Floating Bar with Save Button */}
        <div className="sticky bottom-6 mt-10 p-4 bg-zinc-950/90 backdrop-blur-xl border border-white/15 rounded-2xl flex items-center justify-between shadow-2xl z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Los cambios se guardan y sincronizan automáticamente.
            </span>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-magenta to-purple-600 hover:from-magenta/90 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-magenta/25 hover:shadow-magenta/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
