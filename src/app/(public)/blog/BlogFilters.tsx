"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search, X } from "lucide-react";
import styles from "./Blog.module.css";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BlogFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category");
  const currentQ = searchParams.get("q") || "";

  const [searchValue, setSearchValue] = useState(currentQ);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const pushQuery = (queryStr: string) => {
    router.push(queryStr ? `/blog?${queryStr}` : "/blog");
  };

  const handleCategoryClick = (slug: string) => {
    const newCategory = currentCategory === slug ? "" : slug;
    pushQuery(createQueryString("category", newCategory));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushQuery(createQueryString("q", searchValue.trim()));
  };

  const handleClearSearch = () => {
    setSearchValue("");
    pushQuery(createQueryString("q", ""));
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.filterPills}>
        <button
          type="button"
          onClick={() => handleCategoryClick("")}
          className={`${styles.filterPill} ${!currentCategory ? styles.filterPillActive : ""}`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => handleCategoryClick(cat.slug)}
            className={`${styles.filterPill} ${currentCategory === cat.slug ? styles.filterPillActive : ""}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar artículos..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={styles.searchInput}
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClearSearch}
            className={styles.searchClear}
            aria-label="Limpiar búsqueda"
          >
            <X size={13} />
          </button>
        )}
      </form>
    </div>
  );
}
