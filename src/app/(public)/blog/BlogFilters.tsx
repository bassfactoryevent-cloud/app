"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";

export default function BlogFilters({ categories }: { categories: any[] }) {
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

  const handleCategoryClick = (slug: string) => {
    const newCategory = currentCategory === slug ? "" : slug;
    router.push(`/blog?${createQueryString("category", newCategory)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/blog?${createQueryString("q", searchValue)}`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', width: '100%', marginBottom: '2rem' }}>
      
      {/* Category Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', flex: 1 }}>
        <button 
          onClick={() => handleCategoryClick("")}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '100px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid',
            transition: 'all 0.2s',
            backgroundColor: !currentCategory ? 'var(--color-magenta)' : 'transparent',
            borderColor: !currentCategory ? 'var(--color-magenta)' : 'rgba(255,255,255,0.2)',
            color: 'white'
          }}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => handleCategoryClick(cat.slug)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '100px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              transition: 'all 0.2s',
              backgroundColor: currentCategory === cat.slug ? 'var(--color-magenta)' : 'transparent',
              borderColor: currentCategory === cat.slug ? 'var(--color-magenta)' : 'rgba(255,255,255,0.2)',
              color: 'white'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#111', borderRadius: '100px', padding: '0.5rem 1rem', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '300px', width: '100%' }}>
        <Search size={18} style={{ opacity: 0.5, marginRight: '0.5rem' }} />
        <input 
          type="text" 
          placeholder="Buscar artículos..." 
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.875rem' }}
        />
      </form>

    </div>
  );
}
