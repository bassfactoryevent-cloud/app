import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Calendar } from "lucide-react";
import { Metadata } from "next";
import AdBanner from "@/components/AdBanner";
import { ShareButtons } from "@/components/ui/ShareButtons";
import tiptapStyles from "../../../admin/components/TiptapEditor.module.css";
import styles from "../Blog.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("meta_title, meta_description, title, excerpt, cover_image")
    .eq("slug", slug)
    .single();

  if (!post) {
    return { title: "Artículo no encontrado" };
  }

  return {
    title: `${post.meta_title || post.title} | Cultura Bassfactory`,
    description:
      post.meta_description || post.excerpt || "Lee más en Cultura Bassfactory",
    openGraph: {
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  noStore();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      categories (
        name
      ),
      post_genres (
        genres (
          name
        )
      ),
      post_tags (
        tags (
          name
        )
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error || !post || !post.is_published) {
    notFound();
  }

  const genres =
    (post.post_genres as any[])?.map((pg) => pg.genres?.name).filter(Boolean) ||
    [];
  const tags =
    (post.post_tags as any[])?.map((pt) => pt.tags?.name).filter(Boolean) || [];

  let contentPart1 = post.content || "";
  let contentPart2 = "";
  if (post.content) {
    const paragraphs = post.content.split("</p>");
    if (paragraphs.length > 2) {
      const middleIndex = Math.floor(paragraphs.length / 2);
      contentPart1 = paragraphs.slice(0, middleIndex).join("</p>") + "</p>";
      contentPart2 = paragraphs.slice(middleIndex).join("</p>");
    }
  }

  return (
    <article className={styles.articleContainer}>
      <Link href="/blog" className={styles.backLink}>
        <ArrowLeft size={14} /> Volver a Cultura
      </Link>

      <header className={styles.articleHeader}>
        <div className={styles.articleMeta}>
          {(post.categories as any)?.name && (
            <span className={styles.articleCategoryBadge}>
              {(post.categories as any).name}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <Calendar size={13} />
            {new Date(post.created_at).toLocaleDateString("es-CO", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <h1 className={styles.articleTitle}>{post.title}</h1>

        {post.excerpt && (
          <p className={styles.articleExcerpt}>{post.excerpt}</p>
        )}

        {(genres.length > 0 || tags.length > 0) && (
          <div className={styles.articleTaxonomies}>
            {genres.map((g) => (
              <span key={`g-${g}`} className={styles.taxonomyPill}>
                {g}
              </span>
            ))}
            {tags.map((t) => (
              <span key={`t-${t}`} className={styles.taxonomyPill}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </header>

      {post.cover_image && (
        <div className={styles.articleCover}>
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 820px) 100vw, 820px"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      <div
        className={tiptapStyles.prose}
        style={{
          padding: 0,
          minHeight: "auto",
          color: "var(--color-text-primary)",
          fontSize: "0.95rem",
          lineHeight: 1.7,
        }}
        dangerouslySetInnerHTML={{ __html: contentPart1 }}
      />

      {contentPart2 && (
        <div className={styles.articleMidAd}>
          <AdBanner placementName="blog_in_content" />
        </div>
      )}

      {contentPart2 && (
        <div
          className={tiptapStyles.prose}
          style={{
            padding: 0,
            minHeight: "auto",
            color: "var(--color-text-primary)",
            fontSize: "0.95rem",
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{ __html: contentPart2 }}
        />
      )}

      <div style={{ marginTop: "2rem" }}>
        <ShareButtons title={post.title} text={post.excerpt} />
      </div>

      <div className={styles.articleBottomAd}>
        <AdBanner placementName="blog_horizontal" />
      </div>
    </article>
  );
}
