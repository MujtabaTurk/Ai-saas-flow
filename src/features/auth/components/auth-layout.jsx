import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

function BrandMark() {
  return (
    <Link
      aria-label="ServiceFlow home"
      className="inline-flex items-center"
      href="/"
    >
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

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[780px] items-center justify-center px-8 py-12 xl:px-12 xl:py-14">
        <div className="relative flex h-[min(72dvh,680px)] w-[min(72%,520px)] min-w-[360px] items-center justify-center xl:h-[min(74dvh,720px)] xl:w-[min(68%,560px)]">
          <Image
            src="/auth/serviceflow-auth-network-cutout.png"
            alt=""
            width={941}
            height={1432}
            priority
            sizes="(min-width: 1280px) 34vw, (min-width: 1024px) 38vw, 0px"
            className="relative z-10 h-auto max-h-full w-auto max-w-full object-contain opacity-[0.96]"
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
        <ScrollArea
          className="min-h-dvh w-full min-w-0 lg:h-full lg:min-h-0"
          viewportClassName="px-5 py-7 [&>div]:!block [&>div]:min-h-full sm:px-8 sm:py-8 lg:px-8 lg:py-6 xl:px-10"
          viewportProps={{ tabIndex: 0 }}
        >
          <div className="flex min-h-full w-full items-center justify-center">
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
          </div>
        </ScrollArea>
        <AuthVisualPanel />
      </div>
    </main>
  );
}
