export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          World Cup 2026
        </p>
        <h1 className="text-2xl font-semibold">WC Fantasy</h1>
      </div>
      {children}
    </div>
  );
}
