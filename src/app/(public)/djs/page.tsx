import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Music } from "lucide-react";
import AdBanner from "@/components/AdBanner";

export const metadata = {
  title: "DJs & Roster - Bassfactory",
  description: "Conoce a nuestros artistas y DJs residentes.",
};

export default async function PublicDjsPage() {
  const supabase = await createClient();

  const { data: djs } = await supabase
    .from("djs")
    .select("*")
    .order("stage_name", { ascending: true });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Artists <span style={{ color: 'var(--color-magenta)' }}>& DJs</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          El talento detrás del sonido. Conoce a los artistas que forman parte de la familia Bassfactory.
        </p>
      </div>

      <div style={{ margin: '0 auto 4rem auto', maxWidth: '800px', width: '100%' }}>
        <AdBanner placementName="djs_banner" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {djs?.map((dj: any) => (
          <Link key={dj.id} href={`/djs/${dj.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ position: 'relative', height: '400px', borderRadius: '1rem', overflow: 'hidden', cursor: 'pointer', group: 'true' }}>
              {dj.image_url ? (
                <Image src={dj.image_url} alt={dj.stage_name} fill style={{ objectFit: 'cover', transition: 'transform 0.5s ease' }} className="dj-image" />
              ) : (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                  <Music size={64} />
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', padding: '2rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{dj.stage_name}</h3>
                {dj.bio && (
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {dj.bio.replace(/<[^>]*>?/gm, '')}
                  </p>
                )}
              </div>
            </div>
            {/* Minimal CSS for hover effect */}
            <style dangerouslySetInnerHTML={{__html: `
              a:hover .dj-image {
                transform: scale(1.05);
              }
            `}} />
          </Link>
        ))}

        {(!djs || djs.length === 0) && (
          <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center', opacity: 0.5 }}>
            <Music size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Próximamente</h3>
            <p>Estamos actualizando nuestro catálogo de artistas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
