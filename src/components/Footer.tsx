export function Footer() {
  return (
    <footer className="border-t bg-muted mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">Rybník Ostrata</h3>
            <p className="text-sm text-muted-foreground">
              Rezervační systém pro lovná místa na rybníku Ostrata
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Kontakt</h3>
            <p className="text-sm text-muted-foreground">
              Email: info@rybnikostrata.cz<br />
              Tel: +420 123 456 789
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Provozní doba</h3>
            <p className="text-sm text-muted-foreground">
              Po - Ne: 6:00 - 22:00
            </p>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          © 2026 Rybník Ostrata. Všechna práva vyhrazena.
        </div>
      </div>
    </footer>
  );
}