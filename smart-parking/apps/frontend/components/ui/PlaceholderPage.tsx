interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 shadow-sm">
      <p className="text-xs font-bold tracking-widest text-[#CC0000] uppercase">
        Próximamente
      </p>
      <h1 className="mt-2 text-3xl font-black text-[#003366]">{title}</h1>
      {description && (
        <p className="mt-4 max-w-lg text-slate-600">{description}</p>
      )}
      <p className="mt-8 text-sm text-slate-400">
        Esta sección está en desarrollo. La autenticación y navegación ya
        funcionan correctamente.
      </p>
    </div>
  );
}
