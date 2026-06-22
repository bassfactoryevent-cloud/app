export default function TestEnvPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div style={{ padding: '2rem', color: 'black', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1>Vercel Environment Variables Test</h1>
      
      <h2>URL:</h2>
      <pre style={{ padding: '1rem', background: '#eee' }}>
        {url === undefined ? "UNDEFINED (La variable no existe)" : 
         url === "" ? "EMPTY STRING (La variable está vacía)" : 
         `"${url}"`}
      </pre>

      <h2>KEY:</h2>
      <pre style={{ padding: '1rem', background: '#eee' }}>
        {key === undefined ? "UNDEFINED (La variable no existe)" : 
         key === "" ? "EMPTY STRING (La variable está vacía)" : 
         `"${key.substring(0, 10)}..." (Empieza con estos caracteres)`}
      </pre>
      
      <p style={{ marginTop: '2rem', fontWeight: 'bold' }}>
        Si ves "UNDEFINED", significa que Vercel no cargó las variables durante el Build.
        Si ves comillas extra como <code>""https://...""</code>, significa que las guardaste con comillas en Vercel.
      </p>
    </div>
  );
}
