export function Footer() {
  return (
    <footer className="w-full border-t border-border/60 bg-secondary">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 text-sm text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Mentra AI. Все права защищены.
      </div>
    </footer>
  );
}
