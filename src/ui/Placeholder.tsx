export function Placeholder({ title }: { title: string }) {
  return (
    <main className="wrap main" id="contenuto">
      <h1 className="h1">{title}</h1>
      <p className="card">Questa pagina arriva nella prossima fase. Intanto torna al simulatore.</p>
      <a href="#/" className="btn dark">
        <span aria-hidden="true">←</span> Torna al simulatore
      </a>
    </main>
  );
}
