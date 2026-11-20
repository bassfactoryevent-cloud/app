import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import AdBanner from "@/components/AdBanner";
import BlogFilters from "./BlogFilters";
import styles from "./Blog.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cultura | Bassfactory",
  description: "Noticias, lanzamientos y escena electrónica en Colombia.",
};

export default async function BlogFeed({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const [supabase, resolvedSearchParams] = await Promise.all([
    createClient(),
    searchParams,
  ]);

  const q = resolvedSearchParams.q || "";
  const category = resolvedSearchParams.category || "";

  const categorySelect = category
    ? "categories!inner ( name, slug )"
    : "categories ( name, slug )";

  let query = supabase
    .from("posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      cover_image,
      is_principal,
      created_at,
      ${categorySelect}
    `
    )
    .eq("is_published", true);

  if (category) {
    query = query.eq("categories.slug", category);
  }
  if (q) {
    query = query.ilike("title", `%${q}%`);
  }

  const [{ data: categories }, { data: allPosts, error }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    query.order("created_at", {
      ascending: false,
    }),
  ]);

  if (error) {
    console.error("Error fetching blog posts:", error);
  }

  const totalCount = allPosts?.length || 0;
  const principalPost =
    !q && !category ? allPosts?.find((post) => post?.is_principal) : null;
  const posts =
    allPosts?.filter((post) => post.id !== principalPost?.id) || [];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className={styles.blogContainer}>
      <header className={styles.heroSection}>
        <div>
          <h1 className={styles.heroTitle}>Cultura</h1>
          <p className={styles.heroSubtitle}>
            Noticias, lanzamientos y escena electrónica.
          </p>
        </div>
        <span className={styles.countLabel}>
          {totalCount} {totalCount === 1 ? "artículo" : "artículos"}
        </span>
      </header>

      <Suspense fallback={null}>
        <BlogFilters categories={categories || []} />
      </Suspense>

      {principalPost && (
        <Link
          href={`/blog/${principalPost.slug}`}
          className={styles.principalCard}
        >
          <div className={styles.principalImageWrap}>
            {principalPost.cover_image ? (
              <Image
                src={principalPost.cover_image}
                alt={principalPost.title}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                className={styles.principalImage}
                priority
              />
            ) : (
              <div className={styles.postPlaceholder}>Bassfactory</div>
            )}
          </div>
          <div className={styles.principalBody}>
            <div className={styles.principalMeta}>
              <span className={styles.principalBadge}>Destacado</span>
              {(principalPost.categories as any)?.name && (
                <span className={styles.categoryText}>
                  {(principalPost.categories as any).name}
                </span>
              )}
            </div>
            <h2 className={styles.principalTitle}>{principalPost.title}</h2>
            {principalPost.excerpt && (
              <p className={styles.principalExcerpt}>{principalPost.excerpt}</p>
            )}
            <div className={styles.principalFooter}>
              <span>{formatDate(principalPost.created_at)}</span>
              <span className={styles.readMore}>Leer artículo →</span>
            </div>
          </div>
        </Link>
      )}

      {posts.length === 0 && !principalPost ? (
        <div className={styles.emptyState}>
          No se encontraron artículos con los filtros actuales.
        </div>
      ) : (
        posts.length > 0 && (
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className={styles.postCard}
              >
                <div className={styles.postImageWrap}>
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className={styles.postImage}
                    />
                  ) : (
                    <div className={styles.postPlaceholder}>Bassfactory</div>
                  )}
                </div>

                {(post.categories as any)?.name && (
                  <span className={styles.categoryText}>
                    {(post.categories as any).name}
                  </span>
                )}

                <h2 className={styles.postTitle}>{post.title}</h2>

                {post.excerpt && (
                  <p className={styles.postExcerpt}>{post.excerpt}</p>
                )}

                <div className={styles.postFooter}>
                  <span>{formatDate(post.created_at)}</span>
                  <span className={styles.readMore}>Leer →</span>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      <div className={styles.adWrap}>
        <AdBanner placementName="blog_horizontal" />
      </div>
    </div>
  );
}
