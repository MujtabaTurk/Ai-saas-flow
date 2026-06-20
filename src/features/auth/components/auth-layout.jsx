import Link from "next/link";

export function AuthLayout({ children, eyebrow, title, description, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-growth-dashboard px-6 py-12">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link className="text-lg font-bold text-growth-sidebar" href="/">
            ServiceFlow
          </Link>
        </div>
        <div className="rounded-2xl border border-growth-border bg-white p-6 shadow-sm">
          <div className="mb-6 space-y-2">
            {eyebrow ? <p className="text-sm font-semibold text-primary">{eyebrow}</p> : null}
            <h1 className="text-2xl font-bold tracking-tight text-growth-sidebar">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {children}
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </section>
    </main>
  );
}
