interface WorkspacePlaceholderPageProps {
  title: string;
  description: string;
}

export function WorkspacePlaceholderPage({
  title,
  description,
}: WorkspacePlaceholderPageProps) {
  return (
    <section className="workspace-panel">
      <p className="eyebrow">Modul internal</p>
      <h1>{title}</h1>
      <p className="workspace-lede">{description}</p>
      <div className="workspace-placeholder-box" role="status">
        <p>
          Halaman ini adalah penanda navigasi. Fungsi operasional akan dibangun
          pada fase berikutnya setelah autentikasi resmi BPS tersedia.
        </p>
      </div>
    </section>
  );
}
