import Image from "next/image";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import { cn } from "@/lib/utils";

function BrandMark() {
  return (
    <Link
      aria-label="ServiceFlow home"
      className="inline-flex items-center gap-3"
      href="/"
    >
      <span className="grid size-9 place-items-center rounded-[8px] bg-[#3525cd] text-white ring-1 ring-[#3525cd]/10 sm:size-10 sm:rounded-[10px]">
        <Layers3 className="size-5" aria-hidden="true" />
      </span>
      <span className="text-xl font-bold leading-8 tracking-tight text-[#0b1c30] sm:text-[22px]">
        ServiceFlow
      </span>
    </Link>
  );
}

function AuthVisualPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative isolate hidden min-h-0 overflow-hidden border-s border-[#d8dff0] bg-[#f8f9ff] lg:flex"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#eef4ff_28%,#ecfdf5_62%,#f4f0ff_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(53,37,205,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(53,37,205,0.052)_1px,transparent_1px)] bg-[size:48px_48px] opacity-55 [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)]" />
      <div className="absolute -right-28 top-0 h-full w-[66%] bg-[linear-gradient(180deg,rgba(53,37,205,0.22),rgba(16,185,129,0.08)_58%,rgba(56,189,248,0.13))] [clip-path:polygon(26%_0,100%_0,100%_100%,0_100%)]" />
      <div className="absolute -left-32 bottom-0 h-[52%] w-[70%] bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(53,37,205,0.05))] blur-3xl [clip-path:polygon(0_18%,100%_0,82%_100%,0_84%)]" />
      <div className="absolute left-[11%] right-[8%] top-[31%] h-[34%] -skew-y-6 bg-[linear-gradient(90deg,rgba(53,37,205,0.18),rgba(56,189,248,0.16),rgba(16,185,129,0.14))] blur-3xl" />
      <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="absolute inset-y-10 right-10 w-px bg-gradient-to-b from-transparent via-white/75 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[780px] items-center justify-center px-8 py-12 xl:px-12 xl:py-14">
        <div className="relative flex h-[min(72dvh,680px)] w-[min(72%,520px)] min-w-[360px] items-center justify-center xl:h-[min(74dvh,720px)] xl:w-[min(68%,560px)]">
          <div className="absolute inset-x-[5%] bottom-[7%] h-[11%] -skew-x-6 bg-[#3525cd]/16 blur-2xl" />
          <Image
            src="/auth/serviceflow-auth-network-cutout.png"
            alt=""
            width={941}
            height={1432}
            priority
            sizes="(min-width: 1280px) 34vw, (min-width: 1024px) 38vw, 0px"
            className="relative z-10 h-auto max-h-full w-auto max-w-full object-contain opacity-[0.96] drop-shadow-[0_24px_54px_rgba(53,37,205,0.24)]"
          />
        </div>
      </div>
    </aside> 
  );
}

export function AuthLayout({
  children,
  className,
  description,
  eyebrow,
  footer,
  title
}) {
  return (
    <main className="min-h-dvh w-full overflow-x-hidden bg-white text-[#0b1c30] lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="grid min-h-dvh w-full min-w-0 grid-cols-[minmax(0,1fr)] lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex min-h-dvh w-full min-w-0 items-center justify-center px-5 py-7 sm:px-8 sm:py-8 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-4 xl:px-10">
          <div
            className={cn(
              "w-full min-w-0 max-w-[calc(100vw-2.5rem)] sm:max-w-[430px]",
              className
            )}
          >
            <BrandMark />
            <div className="mt-5 sm:mt-6">
              <div className="mb-5 space-y-1.5 lg:mb-4">
                {eyebrow ? (
                  <p className="text-sm font-semibold text-[#3525cd]">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="text-[30px] font-bold leading-[1.08] tracking-tight text-[#0b1c30] sm:text-4xl lg:text-[34px]">
                  {title}
                </h1>
                {description ? (
                  <p className="text-sm leading-6 text-[#586377] sm:text-base lg:text-sm">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
            {children}
            {footer ? (
              <div className="mt-5 text-center text-sm text-[#586377] lg:mt-4">
                {footer}
              </div>
            ) : null}
          </div>
        </section>
        <AuthVisualPanel />
      </div>
    </main>
  );
}
