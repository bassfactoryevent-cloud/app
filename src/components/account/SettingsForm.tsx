"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Camera,
  Trash2,
  Music,
  Headphones,
  Sparkles,
  User,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { optimizeImage } from "@/utils/imageOptimizer";
import { signOut } from "@/app/(auth)/actions";
import ConfirmModal from "@/components/ui/ConfirmModal";

const GENRE_OPTIONS = [
  "Techno",
  "Hard Techno",
  "Melodic Techno",
  "House",
  "Tech House",
  "Acid",
  "Industrial",
  "Minimal",
  "Drum & Bass",
  "Psytrance",
  "Afro House",
];

const VIBE_OPTIONS = [
  "Warehouse / Underground",
  "Club Intimate",
  "Festival Open Air",
  "Afterhours",
  "Boiler / 360°",
];

const CITY_OPTIONS = [
  "Medellín",
  "Bogotá",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Pereira",
  "Otra",
];

interface DjOption {
  id: string;
  name: string;
  photo_url?: string | null;
  genres?: string[] | string | null;
}

export default function SettingsForm({
  user,
  profile,
  availableDjs = [],
}: {
  user: any;
  profile: any;
  availableDjs?: DjOption[];
}) {
  const meta = user?.user_metadata || {};
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identity state
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar_url || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [fullName, setFullName] = useState<string>(
    profile?.full_name || meta.full_name || ""
  );
  const [raverTag, setRaverTag] = useState<string>(meta.raver_tag || "");
  const [city, setCity] = useState<string>(meta.city || "Medellín");
  const [whatsapp, setWhatsapp] = useState<string>(meta.whatsapp || "");

  // Musical preferences state
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    Array.isArray(meta.favorite_genres) ? meta.favorite_genres : []
  );
  const [selectedVibes, setSelectedVibes] = useState<string[]>(
    Array.isArray(meta.party_vibes) ? meta.party_vibes : []
  );
  const [followedDjs, setFollowedDjs] = useState<string[]>(
    Array.isArray(meta.followed_djs) ? meta.followed_djs : []
  );
  const [favoriteSetUrl, setFavoriteSetUrl] = useState<string>(
    meta.favorite_set_url || ""
  );

  // Save & security state
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const toggleItem = (list: string[], value: string, setter: (v: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const optimized = await optimizeImage(file);
      const formData = new FormData();
      formData.append("file", optimized);
      formData.append("bucket", "events");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo subir la imagen.");
      }
      const { url } = await res.json();
      setAvatarUrl(url);
      toast.success("Foto lista. Recuerda guardar los cambios.");
    } catch (err: any) {
      toast.error(err?.message || "Error al subir foto.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfileAndPreferences = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (!cleanName) {
      toast.error("El nombre completo es obligatorio.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const cleanTag = raverTag.trim().replace(/^@+/, "");
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          name: cleanName,
          raver_tag: cleanTag,
          city,
          whatsapp: whatsapp.trim(),
          favorite_genres: selectedGenres,
          party_vibes: selectedVibes,
          followed_djs: followedDjs,
          favorite_set_url: favoriteSetUrl.trim(),
        },
      });

      if (authError) throw authError;

      toast.success("Perfil y gustos musicales guardados. Tu cartelera ahora se adapta a ti.");
      window.dispatchEvent(new Event("profile_updated"));
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al guardar los cambios.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Contraseña actualizada correctamente.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.58rem 0.78rem",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.45)",
    color: "white",
    fontSize: "0.83rem",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.3rem",
    fontSize: "0.74rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.85)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* MAIN PROFILE & MUSICAL PREFERENCES FORM */}
      <form
        onSubmit={handleSaveProfileAndPreferences}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
            alignItems: "start",
          }}
        >
          {/* CARD 1: Compact Identity + Avatar Picker */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "1.1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.9rem",
            }}
          >
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "white" }}>
              Identidad
            </div>

            {/* Compact Circular Avatar Picker */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.9rem",
                padding: "0.75rem",
                borderRadius: "9px",
                backgroundColor: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  padding: "2px",
                  background:
                    "linear-gradient(135deg, var(--color-magenta), var(--color-accent))",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    backgroundColor: "#111114",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <User size={26} color="rgba(255,255,255,0.5)" />
                  )}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "white" }}>
                  Foto de Perfil
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-secondary)",
                    marginBottom: "0.45rem",
                  }}
                >
                  Se comprime automáticamente.
                </div>
                <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "0.35rem 0.7rem",
                      borderRadius: "6px",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      color: "white",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: isUploadingAvatar ? "not-allowed" : "pointer",
                    }}
                  >
                    <Camera size={12} />
                    {isUploadingAvatar ? "Subiendo..." : "Cambiar foto"}
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "6px",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(239,68,68,0.35)",
                        color: "#ef4444",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={12} /> Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.7rem",
              }}
            >
              <div>
                <label htmlFor="full_name" style={labelStyle}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="raver_tag" style={labelStyle}>
                  Alias / @Tag
                </label>
                <input
                  type="text"
                  id="raver_tag"
                  value={raverTag}
                  onChange={(e) => setRaverTag(e.target.value)}
                  placeholder="@dani.rave"
                  style={{ ...inputStyle, color: "var(--color-accent)" }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.7rem",
              }}
            >
              <div>
                <label htmlFor="city" style={labelStyle}>
                  Ciudad
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                >
                  {CITY_OPTIONS.map((c) => (
                    <option key={c} value={c} style={{ backgroundColor: "#111114" }}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="whatsapp" style={labelStyle}>
                  WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  id="whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+57 300 000 0000"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" style={{ ...labelStyle, color: "var(--color-text-secondary)" }}>
                Correo Electrónico (Vinculado a tus boletas)
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                style={{
                  ...inputStyle,
                  opacity: 0.55,
                  cursor: "not-allowed",
                  backgroundColor: "rgba(0,0,0,0.25)",
                }}
              />
            </div>
          </div>

          {/* CARD 2: Musical Preferences (Used to personalize Home, Events & Account!) */}
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "1.1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.95rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.92rem", fontWeight: 800, color: "white" }}>
                <Music size={15} color="var(--color-magenta)" />
                <span>Tus Gustos Musicales</span>
              </div>
              <span style={{ fontSize: "0.68rem", color: "var(--color-accent)", fontWeight: 700 }}>
                Personaliza tu cartelera
              </span>
            </div>

            {/* Genres Multi-Select */}
            <div>
              <div style={{ ...labelStyle, display: "flex", justifyContent: "space-between" }}>
                <span>Géneros que escuchas</span>
                <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
                  {selectedGenres.length} elegidos
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {GENRE_OPTIONS.map((genre) => {
                  const active = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() =>
                        toggleItem(selectedGenres, genre, setSelectedGenres)
                      }
                      style={{
                        padding: "0.32rem 0.7rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: active ? 700 : 500,
                        border: active
                          ? "1px solid var(--color-magenta)"
                          : "1px solid rgba(255,255,255,0.1)",
                        backgroundColor: active
                          ? "rgba(229, 9, 20, 0.18)"
                          : "rgba(0,0,0,0.3)",
                        color: active ? "white" : "var(--color-text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {active ? "✓ " : "+ "}
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Party Vibes */}
            <div>
              <label style={labelStyle}>
                <Sparkles size={12} style={{ display: "inline", marginRight: "4px", color: "var(--color-accent)" }} />
                Tipo de fiesta / formato favorito
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {VIBE_OPTIONS.map((vibe) => {
                  const active = selectedVibes.includes(vibe);
                  return (
                    <button
                      key={vibe}
                      type="button"
                      onClick={() => toggleItem(selectedVibes, vibe, setSelectedVibes)}
                      style={{
                        padding: "0.32rem 0.68rem",
                        borderRadius: "7px",
                        fontSize: "0.72rem",
                        fontWeight: active ? 700 : 500,
                        border: active
                          ? "1px solid var(--color-accent)"
                          : "1px solid rgba(255,255,255,0.1)",
                        backgroundColor: active
                          ? "rgba(0, 240, 255, 0.12)"
                          : "rgba(0,0,0,0.3)",
                        color: active ? "#00F0FF" : "var(--color-text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {vibe}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Followed DJs from Bassfactory Roster */}
            {availableDjs.length > 0 && (
              <div>
                <div style={{ ...labelStyle, display: "flex", justifyContent: "space-between" }}>
                  <span>
                    <Headphones size={12} style={{ display: "inline", marginRight: "4px", color: "var(--color-magenta)" }} />
                    DJs de Bassfactory que sigues
                  </span>
                  <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
                    {followedDjs.length} seguidos
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.45rem",
                    overflowX: "auto",
                    paddingBottom: "4px",
                    scrollbarWidth: "none",
                  }}
                >
                  {availableDjs.map((dj) => {
                    const active = followedDjs.includes(dj.id);
                    return (
                      <button
                        key={dj.id}
                        type="button"
                        onClick={() => toggleItem(followedDjs, dj.id, setFollowedDjs)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "0.3rem 0.65rem 0.3rem 0.3rem",
                          borderRadius: "999px",
                          border: active
                            ? "1px solid var(--color-magenta)"
                            : "1px solid rgba(255,255,255,0.1)",
                          backgroundColor: active
                            ? "rgba(229, 9, 20, 0.16)"
                            : "rgba(0,0,0,0.35)",
                          color: "white",
                          fontSize: "0.72rem",
                          fontWeight: active ? 700 : 500,
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            backgroundColor: "#27272A",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {dj.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={dj.photo_url}
                              alt={dj.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Headphones size={11} />
                          )}
                        </div>
                        <span>{dj.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Favorite Set / Playlist Link */}
            <div>
              <label htmlFor="favorite_set_url" style={labelStyle}>
                Tu Set o Playlist favorita (SoundCloud / YouTube / Spotify)
              </label>
              <input
                type="url"
                id="favorite_set_url"
                value={favoriteSetUrl}
                onChange={(e) => setFavoriteSetUrl(e.target.value)}
                placeholder="https://soundcloud.com/..."
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "0.65rem 1.2rem",
                backgroundColor: "var(--color-magenta)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                alignSelf: "flex-start",
              }}
            >
              <CheckCircle2 size={15} />
              {isLoading ? "Guardando..." : "Guardar Perfil y Gustos"}
            </button>
          </div>
        </div>
      </form>

      {/* SECURITY & SESSION ROW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <form
          onSubmit={handlePasswordSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "1.1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", fontWeight: 800, color: "white" }}>
              <Lock size={14} color="var(--color-accent)" />
              <span>Cambiar Contraseña</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.72rem",
              }}
            >
              {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPass ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
            <div>
              <label htmlFor="new_password" style={labelStyle}>
                Nueva (mín. 6)
              </label>
              <input
                type={showPass ? "text" : "password"}
                id="new_password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="confirm_password" style={labelStyle}>
                Confirmar
              </label>
              <input
                type={showPass ? "text" : "password"}
                id="confirm_password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            style={{
              padding: "0.52rem 0.95rem",
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "white",
              borderRadius: "7px",
              fontWeight: 700,
              fontSize: "0.76rem",
              cursor: isUpdatingPassword ? "not-allowed" : "pointer",
              opacity: isUpdatingPassword ? 0.65 : 1,
              alignSelf: "flex-start",
            }}
          >
            {isUpdatingPassword ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>

        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            padding: "1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "white" }}>
              Sesión Activa
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)" }}>
              Tus boletas y gustos seguirán guardados en tu cuenta.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmLogoutOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.5rem 0.9rem",
              borderRadius: "7px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#ef4444",
              fontSize: "0.76rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmLogoutOpen}
        onCancel={() => setConfirmLogoutOpen(false)}
        onConfirm={() => signOut()}
        title="¿Cerrar sesión?"
        message="Tus boletas y compras seguirán guardadas de forma segura en tu cuenta."
        confirmText="Cerrar Sesión"
        cancelText="Quedarme"
      />
    </div>
  );
}
