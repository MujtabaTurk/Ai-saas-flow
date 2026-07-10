"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BellRing,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  LoaderCircle,
  MousePointerClick,
  Rocket,
  Settings2,
  Sparkles,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const premiumEase = [0.22, 1, 0.36, 1];

const journeySteps = [
  {
    key: "business",
    title: "Create Business",
    shortTitle: "Business",
    description: "A profile, logo, category, and public URL come together.",
    icon: Building2,
    duration: 7200,
    phaseDelays: [420, 900, 1320, 3200, 4400, 5600],
    typing: {
      text: "Start Beauty Studio",
      startDelay: 1560,
      speed: 74
    }
  },
  {
    key: "services",
    title: "Create Services",
    shortTitle: "Services",
    description: "The first service is priced, timed, and saved.",
    icon: Settings2,
    duration: 6800,
    phaseDelays: [360, 850, 2800, 3900, 4900, 5750],
    typing: {
      text: "Signature Cut & Style",
      startDelay: 1180,
      speed: 68
    }
  },
  {
    key: "availability",
    title: "Configure Availability",
    shortTitle: "Availability",
    description: "Working days and bookable times become visible.",
    icon: CalendarDays,
    duration: 7000,
    phaseDelays: [420, 1160, 1900, 2920, 4100, 5400]
  },
  {
    key: "publish",
    title: "Publish Booking Page",
    shortTitle: "Publish",
    description: "The customer page moves from draft to live.",
    icon: Rocket,
    duration: 6200,
    phaseDelays: [420, 1120, 2200, 3300, 4500]
  },
  {
    key: "customer",
    title: "Customer Booking",
    shortTitle: "Customer",
    description: "A visitor chooses a service, date, slot, and confirms.",
    icon: MousePointerClick,
    duration: 7600,
    phaseDelays: [400, 1240, 2260, 3380, 5160, 6350],
    typing: {
      text: "Aisha Khan",
      startDelay: 3860,
      speed: 82
    }
  },
  {
    key: "confirmed",
    title: "Booking Confirmed",
    shortTitle: "Confirmed",
    description: "The dashboard receives a clear booking notification.",
    icon: CalendarCheck,
    duration: 5900,
    phaseDelays: [360, 920, 1680, 2820, 4020]
  }
];

const sceneVariants = {
  enter: { opacity: 0, scale: 0.985, y: 18 },
  center: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.992, y: -12 }
};

function getTypingDelay(text, index, base) {
  const rhythm = [0, 28, -8, 42, 12, 56, -4, 24];
  const char = text[index] || "";
  const pause = char === " " ? 70 : /[&./-]/.test(char) ? 95 : 0;

  return Math.max(48, base + rhythm[index % rhythm.length] + pause);
}

function getVisibleState(visible, lift = 10) {
  return visible
    ? { opacity: 1, scale: 1, y: 0 }
    : { opacity: 0, scale: 0.98, y: lift };
}

function getCursorPoint(points, phase) {
  return points.reduce((current, point) => {
    return phase >= point.phase ? point : current;
  }, points[0]);
}

function PublishBookingJourney() {
  const reduceMotion = useReducedMotion();
  const [journeyState, setJourneyState] = useState({
    activeIndex: 0,
    phase: 0,
    typedLength: 0
  });
  const { activeIndex, phase, typedLength } = journeyState;
  const activeStep = journeySteps[activeIndex];

  useEffect(() => {
    const timers = [];
    const typingText = activeStep.typing?.text || "";

    if (reduceMotion) {
      return () => {};
    }

    activeStep.phaseDelays.forEach((delay, index) => {
      timers.push(
        window.setTimeout(() => {
          setJourneyState((current) => {
            if (current.activeIndex !== activeIndex) {
              return current;
            }

            return { ...current, phase: index + 1 };
          });
        }, delay)
      );
    });

    if (activeStep.typing) {
      let nextLength = 0;

      const typeNextCharacter = () => {
        nextLength += 1;
        setJourneyState((current) => {
          if (current.activeIndex !== activeIndex) {
            return current;
          }

          return { ...current, typedLength: nextLength };
        });

        if (nextLength < typingText.length) {
          timers.push(
            window.setTimeout(
              typeNextCharacter,
              getTypingDelay(typingText, nextLength, activeStep.typing.speed)
            )
          );
        }
      };

      timers.push(
        window.setTimeout(typeNextCharacter, activeStep.typing.startDelay)
      );
    }

    timers.push(
      window.setTimeout(() => {
        setJourneyState((current) => ({
          activeIndex: (current.activeIndex + 1) % journeySteps.length,
          phase: 0,
          typedLength: 0
        }));
      }, activeStep.duration)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [activeIndex, activeStep, reduceMotion]);

  const typedText = useMemo(() => {
    const visibleLength = reduceMotion
      ? activeStep.typing?.text.length || 0
      : typedLength;

    return activeStep.typing?.text.slice(0, visibleLength) || "";
  }, [activeStep, reduceMotion, typedLength]);

  const typingComplete = activeStep.typing
    ? reduceMotion || typedLength >= activeStep.typing.text.length
    : true;
  const visiblePhase = reduceMotion ? 99 : phase;

  return (
    <div className="rounded-[8px] border border-serviceflow-border bg-card p-3 text-card-foreground shadow-[0_24px_70px_-58px_rgb(11_28_48/0.75)]">
      <div className="grid gap-3 lg:grid-cols-[12.5rem_minmax(0,1fr)]">
        <JourneyStepRail
          activeIndex={activeIndex}
          activeStep={activeStep}
          reduceMotion={reduceMotion}
        />

        <JourneyFrame>
          <AnimatePresence mode="wait">
            <motion.div
              animate="center"
              className="h-full"
              exit="exit"
              initial="enter"
              key={activeStep.key}
              transition={{ duration: reduceMotion ? 0 : 0.48, ease: premiumEase }}
              variants={sceneVariants}
            >
              {activeStep.key === "business" ? (
                <CreateBusinessScene
                  phase={visiblePhase}
                  typedText={typedText}
                  typingComplete={typingComplete}
                />
              ) : null}
              {activeStep.key === "services" ? (
                <CreateServicesScene
                  phase={visiblePhase}
                  typedText={typedText}
                  typingComplete={typingComplete}
                />
              ) : null}
              {activeStep.key === "availability" ? (
                <AvailabilityScene phase={visiblePhase} />
              ) : null}
              {activeStep.key === "publish" ? (
                <PublishPageScene phase={visiblePhase} />
              ) : null}
              {activeStep.key === "customer" ? (
                <CustomerBookingScene
                  phase={visiblePhase}
                  typedText={typedText}
                  typingComplete={typingComplete}
                />
              ) : null}
              {activeStep.key === "confirmed" ? (
                <BookingConfirmedScene phase={visiblePhase} />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </JourneyFrame>
      </div>
    </div>
  );
}

function JourneyStepRail({ activeIndex, activeStep, reduceMotion }) {
  return (
    <div className="overflow-x-auto rounded-[8px] border border-serviceflow-border bg-serviceflow-canvas p-3 lg:overflow-visible">
      <div className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
        {journeySteps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <div
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "relative min-w-40 overflow-hidden rounded-[8px] border p-3 transition-colors lg:min-w-0",
                isActive
                  ? "border-primary/45 bg-card shadow-sm"
                  : isComplete
                    ? "border-serviceflow-border bg-card/80"
                    : "border-transparent bg-transparent"
              )}
              key={step.key}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-[8px]",
                    isActive || isComplete
                      ? "bg-primary text-primary-foreground"
                      : "bg-serviceflow-panelSoft text-serviceflow-subtle"
                  )}
                >
                  {isComplete ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Icon className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-serviceflow-ink">
                    {step.shortTitle}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-serviceflow-subtle">
                    Step {index + 1}
                  </p>
                </div>
              </div>

              {isActive ? (
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-serviceflow-panelSoft">
                  <motion.span
                    animate={{ scaleX: 1 }}
                    className="block h-full origin-left rounded-full bg-primary"
                    initial={{ scaleX: 0 }}
                    key={activeStep.key}
                    transition={{
                      duration: reduceMotion ? 0 : activeStep.duration / 1000,
                      ease: "linear"
                    }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JourneyFrame({ children }) {
  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[8px] border border-serviceflow-border bg-serviceflow-canvas p-3 sm:min-h-[560px] sm:p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 dark:opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(216,223,240,0.58) 1px, transparent 1px), linear-gradient(90deg, rgba(216,223,240,0.58) 1px, transparent 1px)",
          backgroundSize: "28px 28px"
        }}
      />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-card to-transparent" />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function SceneToolbar({ icon: Icon, status, title }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-[8px] border border-serviceflow-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-serviceflow-panelSoft text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <p className="truncate text-sm font-bold text-serviceflow-ink">{title}</p>
      </div>
      <span className="shrink-0 rounded-full border border-serviceflow-border bg-serviceflow-panelSoft px-2.5 py-1 text-[11px] font-bold text-serviceflow-subtle">
        {status}
      </span>
    </div>
  );
}

function SceneCursor({ phase, points }) {
  const point = getCursorPoint(points, phase);

  return (
    <motion.div
      animate={{
        left: point.left,
        opacity: point.opacity ?? 1,
        scale: point.scale ?? 1,
        top: point.top
      }}
      aria-hidden="true"
      className="pointer-events-none absolute z-40 hidden text-primary drop-shadow-[0_10px_14px_rgb(53_37_205/0.26)] sm:block"
      initial={false}
      transition={{ duration: 0.58, ease: premiumEase }}
    >
      <MousePointerClick className="-rotate-12 fill-card stroke-[2.35] size-5" />
    </motion.div>
  );
}

function AnimatedField({
  active = false,
  className,
  complete = false,
  label,
  placeholder = "Waiting...",
  value
}) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-serviceflow-border bg-card p-3",
        active ? "ring-2 ring-primary/15" : null,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-serviceflow-subtle">
          {label}
        </p>
        {complete ? (
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className="grid size-5 shrink-0 place-items-center rounded-full bg-serviceflow-success text-white"
            initial={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.24, ease: premiumEase }}
          >
            <Check className="size-3.5" aria-hidden="true" />
          </motion.span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 min-h-6 text-sm font-bold leading-6 text-serviceflow-ink",
          value ? null : "text-serviceflow-subtle"
        )}
      >
        {value || placeholder}
        {active && !complete ? (
          <span className="ms-1 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-primary" />
        ) : null}
      </p>
    </div>
  );
}

function StatusPill({ children, complete = false, delay = 0, visible = true }) {
  return (
    <motion.div
      animate={getVisibleState(visible, 6)}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
        complete
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-serviceflow-border bg-card text-serviceflow-subtle"
      )}
      initial={false}
      transition={{ delay, duration: 0.34, ease: premiumEase }}
    >
      <span
        className={cn(
          "grid size-4 place-items-center rounded-full",
          complete ? "bg-serviceflow-success text-white" : "bg-serviceflow-panelSoft"
        )}
      >
        {complete ? <Check className="size-3" aria-hidden="true" /> : null}
      </span>
      {children}
    </motion.div>
  );
}

function CreateBusinessScene({ phase, typedText, typingComplete }) {
  return (
    <div className="relative h-full">
      <SceneToolbar icon={Building2} status={phase >= 6 ? "Ready" : "Draft"} title="Business setup" />
      <SceneCursor
        phase={phase}
        points={[
          { left: "12%", phase: 0, top: "18%", opacity: 0 },
          { left: "42%", phase: 2, top: "27%", opacity: 1 },
          { left: "37%", phase: 3, top: "47%" },
          { left: "63%", phase: 5, top: "78%" },
          { left: "75%", phase: 6, top: "29%", scale: 0.92 }
        ]}
      />

      <motion.div
        animate={getVisibleState(phase >= 1)}
        className="mx-auto max-w-md rounded-[8px] border border-serviceflow-border bg-card p-4 shadow-sm"
        initial={false}
        transition={{ duration: 0.44, ease: premiumEase }}
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={getVisibleState(phase >= 2, 4)}
            className="grid size-14 shrink-0 place-items-center rounded-[8px] border border-dashed border-primary/35 bg-primary/10 text-primary"
            initial={false}
            transition={{ duration: 0.42, ease: premiumEase }}
          >
            <Sparkles className="size-6" aria-hidden="true" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-serviceflow-subtle">
              Public profile
            </p>
            <h3 className="mt-1 truncate text-lg font-bold text-serviceflow-ink">
              {typingComplete ? "Start Beauty Studio" : "New business"}
            </h3>
            <p className="mt-1 truncate text-xs font-semibold text-serviceflow-subtle">
              Beauty and wellness
            </p>
          </div>
          {phase >= 6 ? (
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-serviceflow-success text-white"
              initial={{ opacity: 0, scale: 0.75 }}
              transition={{ duration: 0.34, ease: premiumEase }}
            >
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </motion.span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3">
          <AnimatedField
            active={phase >= 3 && !typingComplete}
            complete={phase >= 4}
            label="Business name"
            placeholder="Type business name"
            value={typedText}
          />
          <motion.div
            animate={getVisibleState(phase >= 4, 6)}
            className="grid gap-3 sm:grid-cols-2"
            initial={false}
            transition={{ duration: 0.36, ease: premiumEase }}
          >
            <AnimatedField
              complete={phase >= 5}
              label="Booking URL"
              value={phase >= 4 ? "serviceflow.com/start-beauty" : ""}
            />
            <AnimatedField
              complete={phase >= 5}
              label="Category"
              value={phase >= 4 ? "Salon" : ""}
            />
          </motion.div>
        </div>
      </motion.div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <StatusPill complete={phase >= 2} visible={phase >= 2}>
          Logo added
        </StatusPill>
        <StatusPill complete={phase >= 4} delay={0.04} visible={phase >= 4}>
          Profile named
        </StatusPill>
        <StatusPill complete={phase >= 6} delay={0.08} visible={phase >= 6}>
          Business created
        </StatusPill>
      </div>
    </div>
  );
}

function CreateServicesScene({ phase, typedText, typingComplete }) {
  return (
    <div className="relative h-full">
      <SceneToolbar icon={Settings2} status={phase >= 6 ? "Saved" : "Editing"} title="Services" />
      <SceneCursor
        phase={phase}
        points={[
          { left: "15%", phase: 0, top: "20%", opacity: 0 },
          { left: "34%", phase: 1, top: "40%", opacity: 1 },
          { left: "68%", phase: 4, top: "62%" },
          { left: "76%", phase: 5, top: "77%" },
          { left: "81%", phase: 6, top: "78%", scale: 0.9 }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.82fr]">
        <motion.div
          animate={getVisibleState(phase >= 1)}
          className="rounded-[8px] border border-serviceflow-border bg-card p-4 shadow-sm"
          initial={false}
          transition={{ duration: 0.42, ease: premiumEase }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-serviceflow-ink">New service</h3>
            <span className="rounded-full bg-serviceflow-panelSoft px-2.5 py-1 text-[11px] font-bold text-serviceflow-subtle">
              Draft
            </span>
          </div>

          <div className="mt-4 grid gap-3">
            <AnimatedField
              active={phase >= 1 && !typingComplete}
              complete={phase >= 3}
              label="Service title"
              placeholder="Type service name"
              value={typedText}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <motion.div
                animate={getVisibleState(phase >= 4, 6)}
                initial={false}
                transition={{ duration: 0.34, ease: premiumEase }}
              >
                <AnimatedField complete={phase >= 4} label="Duration" value="45 min" />
              </motion.div>
              <motion.div
                animate={getVisibleState(phase >= 4, 6)}
                initial={false}
                transition={{ delay: 0.08, duration: 0.34, ease: premiumEase }}
              >
                <AnimatedField complete={phase >= 4} label="Price" value="$60" />
              </motion.div>
            </div>
          </div>

          <motion.button
            animate={{
              scale: phase === 5 ? 0.98 : 1
            }}
            className={cn(
              "mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] text-sm font-bold text-white transition-colors",
              phase >= 6 ? "bg-serviceflow-success" : "bg-primary"
            )}
            type="button"
          >
            {phase === 5 ? (
              <>
                <LoaderCircle className="me-2 size-4 animate-spin" aria-hidden="true" />
                Saving service
              </>
            ) : phase >= 6 ? (
              <>
                <Check className="me-2 size-4" aria-hidden="true" />
                Service saved
              </>
            ) : (
              "Save service"
            )}
          </motion.button>
        </motion.div>

        <motion.div
          animate={getVisibleState(phase >= 3, 12)}
          className="rounded-[8px] border border-serviceflow-border bg-card/90 p-4"
          initial={false}
          transition={{ duration: 0.42, ease: premiumEase }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-serviceflow-subtle">
            Booking preview
          </p>
          <div className="mt-4 rounded-[8px] border border-serviceflow-border bg-serviceflow-canvas p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-serviceflow-ink">
                  {typedText || "Service title"}
                </p>
                <p className="mt-1 text-xs font-semibold text-serviceflow-subtle">
                  {phase >= 4 ? "45 min" : "Duration"} <span aria-hidden="true">.</span>{" "}
                  {phase >= 4 ? "$60" : "Price"}
                </p>
              </div>
              <span className="grid size-8 place-items-center rounded-[8px] bg-primary/10 text-primary">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {["Online booking", "Visible on public page", "Staff assignable"].map(
              (item, index) => (
                <motion.div
                  animate={getVisibleState(phase >= 4 + index * 0.35, 4)}
                  className="flex items-center gap-2 text-xs font-bold text-serviceflow-muted"
                  initial={false}
                  key={item}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: premiumEase
                  }}
                >
                  <CheckCircle2 className="size-4 text-serviceflow-success" aria-hidden="true" />
                  {item}
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AvailabilityScene({ phase }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const selectedDays = days.filter((_, index) => {
    if (phase >= 5) return index < 5;
    if (phase >= 3) return index >= 1 && index <= 4;
    if (phase >= 2) return index === 1 || index === 3;
    return false;
  });

  return (
    <div className="relative h-full">
      <SceneToolbar
        icon={CalendarDays}
        status={phase >= 6 ? "Enabled" : "Configuring"}
        title="Availability"
      />
      <SceneCursor
        phase={phase}
        points={[
          { left: "20%", phase: 0, top: "23%", opacity: 0 },
          { left: "30%", phase: 1, top: "39%", opacity: 1 },
          { left: "47%", phase: 2, top: "39%" },
          { left: "65%", phase: 3, top: "39%" },
          { left: "72%", phase: 5, top: "73%" },
          { left: "80%", phase: 6, top: "18%", scale: 0.92 }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.78fr]">
        <motion.div
          animate={getVisibleState(phase >= 1)}
          className="rounded-[8px] border border-serviceflow-border bg-card p-4 shadow-sm"
          initial={false}
          transition={{ duration: 0.42, ease: premiumEase }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-serviceflow-subtle">July</p>
              <h3 className="text-sm font-bold text-serviceflow-ink">Working days</h3>
            </div>
            <span className="rounded-full border border-serviceflow-border bg-serviceflow-panelSoft px-2.5 py-1 text-[11px] font-bold text-serviceflow-subtle">
              UTC+05
            </span>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {days.map((day) => {
              const selected = selectedDays.includes(day);

              return (
                <motion.div
                  animate={{
                    backgroundColor: selected ? "hsl(var(--primary))" : "hsl(var(--sf-panel-soft))",
                    color: selected ? "hsl(var(--primary-foreground))" : "hsl(var(--sf-subtle))",
                    scale: selected ? 1.03 : 1
                  }}
                  className="grid aspect-square min-h-10 place-items-center rounded-[8px] text-xs font-bold"
                  initial={false}
                  key={day}
                  transition={{ duration: 0.32, ease: premiumEase }}
                >
                  {day}
                </motion.div>
              );
            })}
          </div>

          <motion.div
            animate={getVisibleState(phase >= 4)}
            className="mt-5 rounded-[8px] border border-serviceflow-border bg-serviceflow-canvas p-3"
            initial={false}
            transition={{ duration: 0.42, ease: premiumEase }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-serviceflow-subtle">
                  Working hours
                </p>
                <p className="mt-1 text-sm font-bold text-serviceflow-ink">
                  10:00 AM - 6:00 PM
                </p>
              </div>
              <span
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  phase >= 6 ? "bg-primary" : "bg-serviceflow-panelSoft"
                )}
              >
                <motion.span
                  animate={{ x: phase >= 6 ? 20 : 3 }}
                  className="absolute top-1 grid size-4 place-items-center rounded-full bg-white shadow-sm"
                  initial={false}
                  transition={{ duration: 0.32, ease: premiumEase }}
                />
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          animate={getVisibleState(phase >= 3, 12)}
          className="rounded-[8px] border border-serviceflow-border bg-card/95 p-4"
          initial={false}
          transition={{ duration: 0.42, ease: premiumEase }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-serviceflow-subtle">
            Available slots
          </p>
          <div className="mt-4 grid gap-2">
            {["10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM"].map((slot, index) => (
              <motion.div
                animate={getVisibleState(phase >= 3 + index * 0.35, 6)}
                className="flex items-center justify-between rounded-[8px] border border-serviceflow-border bg-serviceflow-canvas px-3 py-2 text-sm font-bold text-serviceflow-ink"
                initial={false}
                key={slot}
                transition={{ delay: index * 0.08, duration: 0.32, ease: premiumEase }}
              >
                <span>{slot}</span>
                <Clock3 className="size-4 text-primary" aria-hidden="true" />
              </motion.div>
            ))}
          </div>
          <motion.div
            animate={getVisibleState(phase >= 6, 6)}
            className="mt-4 flex items-center gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
            initial={false}
            transition={{ duration: 0.34, ease: premiumEase }}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Availability enabled
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function PublishPageScene({ phase }) {
  const publishing = phase >= 3 && phase < 5;
  const live = phase >= 5;

  return (
    <div className="relative h-full">
      <SceneToolbar icon={Rocket} status={live ? "Live" : "Draft"} title="Booking page" />
      <SceneCursor
        phase={phase}
        points={[
          { left: "17%", phase: 0, top: "22%", opacity: 0 },
          { left: "54%", phase: 1, top: "42%", opacity: 1 },
          { left: "73%", phase: 2, top: "78%" },
          { left: "77%", phase: 4, top: "78%", scale: 0.9 },
          { left: "79%", phase: 5, top: "22%", scale: 0.9 }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <motion.div
          animate={getVisibleState(phase >= 1)}
          className="overflow-hidden rounded-[8px] border border-serviceflow-border bg-card shadow-sm"
          initial={false}
          transition={{ duration: 0.42, ease: premiumEase }}
        >
          <div className="border-b border-serviceflow-border bg-serviceflow-canvas px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="ms-2 truncate rounded-full bg-card px-3 py-1 text-[11px] font-bold text-serviceflow-subtle">
                serviceflow.com/start-beauty
              </span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-12 place-items-center rounded-[8px] bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-lg font-bold text-serviceflow-ink">
                  Start Beauty Studio
                </p>
                <p className="mt-1 text-xs font-semibold text-serviceflow-subtle">
                  Book salon services online
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              {["Signature Cut & Style", "Color consultation", "Blowout"].map(
                (service, index) => (
                  <motion.div
                    animate={getVisibleState(phase >= 2 + index * 0.25, 4)}
                    className="flex items-center justify-between rounded-[8px] border border-serviceflow-border bg-serviceflow-canvas px-3 py-2"
                    initial={false}
                    key={service}
                    transition={{ delay: index * 0.05, duration: 0.3, ease: premiumEase }}
                  >
                    <span className="truncate text-sm font-bold text-serviceflow-ink">
                      {service}
                    </span>
                    <ChevronRight className="size-4 text-serviceflow-subtle" aria-hidden="true" />
                  </motion.div>
                )
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={getVisibleState(phase >= 2, 12)}
          className="flex flex-col justify-between rounded-[8px] border border-serviceflow-border bg-card p-4"
          initial={false}
          transition={{ duration: 0.42, ease: premiumEase }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-serviceflow-subtle">
              Launch status
            </p>
            <h3 className="mt-2 text-xl font-bold text-serviceflow-ink">
              {live ? "Your booking page is live" : "Ready to publish"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-serviceflow-muted">
              {live
                ? "Customers can now choose services and available time slots."
                : "Review the preview, then push the page live."}
            </p>
          </div>

          <motion.button
            animate={{
              scale: phase === 3 ? 0.98 : 1
            }}
            className={cn(
              "mt-6 inline-flex h-12 items-center justify-center rounded-[8px] text-sm font-bold text-white",
              live ? "bg-serviceflow-success" : "bg-primary"
            )}
            type="button"
          >
            {publishing ? (
              <>
                <LoaderCircle className="me-2 size-4 animate-spin" aria-hidden="true" />
                Publishing
              </>
            ) : live ? (
              <>
                <Check className="me-2 size-4" aria-hidden="true" />
                Published
              </>
            ) : (
              <>
                <Rocket className="me-2 size-4" aria-hidden="true" />
                Publish page
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

function CustomerBookingScene({ phase, typedText, typingComplete }) {
  return (
    <div className="relative h-full">
      <SceneToolbar
        icon={MousePointerClick}
        status={phase >= 6 ? "Submitted" : "Customer view"}
        title="Customer booking"
      />
      <SceneCursor
        phase={phase}
        points={[
          { left: "17%", phase: 0, top: "24%", opacity: 0 },
          { left: "41%", phase: 1, top: "39%", opacity: 1 },
          { left: "42%", phase: 2, top: "57%" },
          { left: "67%", phase: 3, top: "57%" },
          { left: "54%", phase: 4, top: "73%" },
          { left: "70%", phase: 5, top: "83%" },
          { left: "75%", phase: 6, top: "84%", scale: 0.9 }
        ]}
      />

      <div className="mx-auto max-w-lg rounded-[8px] border border-serviceflow-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[8px] bg-primary/10 text-primary">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-base font-bold text-serviceflow-ink">
              Start Beauty Studio
            </p>
            <p className="text-xs font-semibold text-serviceflow-subtle">
              Choose a service and time
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <motion.div
            animate={{
              borderColor: phase >= 1 ? "hsl(var(--primary))" : "hsl(var(--sf-border))"
            }}
            className="rounded-[8px] border bg-serviceflow-canvas p-3"
            initial={false}
            transition={{ duration: 0.32, ease: premiumEase }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-serviceflow-ink">
                  Signature Cut & Style
                </p>
                <p className="mt-1 text-xs font-semibold text-serviceflow-subtle">
                  45 min . $60
                </p>
              </div>
              {phase >= 1 ? (
                <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
              ) : null}
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-2">
            {["Jul 15", "Jul 16", "Jul 17"].map((date, index) => {
              const selected = phase >= 2 && index === 1;

              return (
                <motion.div
                  animate={{
                    backgroundColor: selected ? "hsl(var(--primary))" : "hsl(var(--sf-panel-soft))",
                    color: selected ? "hsl(var(--primary-foreground))" : "hsl(var(--sf-subtle))",
                    scale: selected ? 1.03 : 1
                  }}
                  className="rounded-[8px] px-3 py-3 text-center text-xs font-bold"
                  initial={false}
                  key={date}
                  transition={{ duration: 0.32, ease: premiumEase }}
                >
                  {date}
                </motion.div>
              );
            })}
          </div>

          <motion.div
            animate={getVisibleState(phase >= 3, 8)}
            className="grid grid-cols-2 gap-2"
            initial={false}
            transition={{ duration: 0.36, ease: premiumEase }}
          >
            {["10:30 AM", "2:30 PM"].map((slot, index) => {
              const selected = phase >= 3 && index === 1;

              return (
                <div
                  className={cn(
                    "rounded-[8px] border px-3 py-2 text-center text-xs font-bold",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-serviceflow-border bg-serviceflow-canvas text-serviceflow-subtle"
                  )}
                  key={slot}
                >
                  {slot}
                </div>
              );
            })}
          </motion.div>

          <AnimatedField
            active={phase >= 4 && !typingComplete}
            complete={phase >= 5}
            label="Customer name"
            placeholder="Type customer name"
            value={typedText}
          />

          <motion.button
            animate={{ scale: phase === 6 ? 0.98 : 1 }}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-[8px] text-sm font-bold text-white",
              phase >= 6 ? "bg-serviceflow-success" : "bg-primary"
            )}
            type="button"
          >
            {phase >= 6 ? (
              <>
                <Check className="me-2 size-4" aria-hidden="true" />
                Booking confirmed
              </>
            ) : (
              <>
                <CreditCard className="me-2 size-4" aria-hidden="true" />
                Confirm booking
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function BookingConfirmedScene({ phase }) {
  return (
    <div className="relative h-full">
      <SceneToolbar
        icon={CalendarCheck}
        status={phase >= 5 ? "Received" : "Confirming"}
        title="Dashboard notification"
      />

      <div className="mx-auto grid max-w-2xl gap-4 lg:grid-cols-[0.82fr_1fr]">
        <motion.div
          animate={getVisibleState(phase >= 1)}
          className="rounded-[8px] border border-serviceflow-border bg-card p-4 text-center shadow-sm"
          initial={false}
          transition={{ duration: 0.42, ease: premiumEase }}
        >
          <motion.div
            animate={{
              boxShadow:
                phase >= 2
                  ? "0 0 0 12px hsl(var(--success-bg)), 0 0 0 24px hsl(var(--success-bg) / 0.45)"
                  : "0 0 0 0 hsl(var(--success-bg))",
              scale: phase >= 2 ? 1 : 0.88
            }}
            className="mx-auto grid size-16 place-items-center rounded-full bg-serviceflow-success text-white"
            initial={false}
            transition={{ duration: 0.54, ease: premiumEase }}
          >
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </motion.div>
          <h3 className="mt-8 text-xl font-bold text-serviceflow-ink">
            Booking confirmed
          </h3>
          <p className="mt-2 text-sm leading-6 text-serviceflow-muted">
            Signature Cut & Style is reserved for Jul 16 at 2:30 PM.
          </p>
          <div className="mt-5 rounded-[8px] border border-serviceflow-border bg-serviceflow-canvas px-3 py-2 text-xs font-bold text-serviceflow-subtle">
            Confirmation SF-1048
          </div>
        </motion.div>

        <div className="space-y-3">
          <motion.div
            animate={getVisibleState(phase >= 3, 12)}
            className="rounded-[8px] border border-serviceflow-border bg-card p-4 shadow-sm"
            initial={false}
            transition={{ duration: 0.42, ease: premiumEase }}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[8px] bg-primary/10 text-primary">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-serviceflow-ink">
                  Aisha Khan
                </p>
                <p className="text-xs font-semibold text-serviceflow-subtle">
                  New customer booking
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniMetric label="Service" value="Cut & Style" />
              <MiniMetric label="Time" value="2:30 PM" />
            </div>
          </motion.div>

          <motion.div
            animate={getVisibleState(phase >= 4, -10)}
            className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 shadow-sm"
            initial={false}
            transition={{ duration: 0.42, ease: premiumEase }}
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-serviceflow-success text-white">
                <BellRing className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold">Booking received</p>
                <p className="mt-1 text-xs font-semibold leading-5">
                  The appointment is now visible in the dashboard schedule.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={getVisibleState(phase >= 5, 8)}
            className="flex items-center justify-between rounded-[8px] border border-serviceflow-border bg-card px-4 py-3 text-sm font-bold text-serviceflow-ink"
            initial={false}
            transition={{ duration: 0.34, ease: premiumEase }}
          >
            <span>Ready for the next setup</span>
            <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-[8px] border border-serviceflow-border bg-serviceflow-canvas px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-serviceflow-subtle">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-bold text-serviceflow-ink">{value}</p>
    </div>
  );
}

export { PublishBookingJourney };
