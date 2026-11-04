import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { StoryBubble } from "@/components/ui/StoryBubble";
import { earStories } from "@/features/street-smart/data/earStories";
import { getApprovedStories } from "@/features/archive/client/archiveQuery";
import { cn } from "@/lib/utils";
import { earArt } from "@/assets/local";

export function HearingInteraction() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [storiesMap, setStoriesMap] = useState<Record<string, { story: string; who: string }>>({});

  useEffect(() => {
    let active = true;
    getApprovedStories().then((res) => {
      if (active && res.status === "success" && res.data.length > 0) {
        const pool = res.data;
        const map: Record<string, { story: string; who: string }> = {};
        earStories.forEach((ear) => {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (pick) {
            const cityInfo = pick.city
              ? `${pick.city} · ${pick.age || 25}`
              : `Archive · ${pick.name}`;
            map[ear.id] = {
              story: pick.story,
              who: cityInfo,
            };
          }
        });
        setStoriesMap(map);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="paper-texture grain relative overflow-hidden px-4 py-14 sm:px-8 sm:py-24">
      <div className="mx-auto w-full max-w-[1400px]">
        <Reveal>
          <h2 className="font-display leading-[0.95] tracking-tight text-ink [font-size:clamp(1.75rem,7vw,3rem)]">
            Things we keep on hearing
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/75 sm:text-base">
            Across cities and neighbourhoods, the same things come up.
          </p>
        </Reveal>

        {/* desktop: three huge listeners, each with its own bubble, exactly as in the reference */}
        <div className="relative mt-10 hidden h-[470px] w-[139%] origin-top-left scale-[0.72] md:block lg:h-[640px] lg:w-full lg:scale-100">
          {earStories.map((ear) => {
            const isActive = ear.id === activeId;
            const currentStory = storiesMap[ear.id]?.story ?? ear.story;
            const currentWho = storiesMap[ear.id]?.who ?? ear.who;
            return (
              <div
                key={ear.id}
                className="absolute"
                style={{ left: `${ear.x}%`, top: `${ear.y}%`, zIndex: isActive ? 40 : 10 }}
              >
                <motion.button
                  type="button"
                  aria-label={`Story heard in ${currentWho}`}
                  aria-pressed={isActive}
                  onMouseEnter={() => setActiveId(ear.id)}
                  onFocus={() => setActiveId(ear.id)}
                  onBlur={() => setActiveId((cur) => (cur === ear.id ? null : cur))}
                  onClick={() => setActiveId((cur) => (cur === ear.id ? null : ear.id))}
                  animate={{ scale: isActive ? 1.08 : 1, rotate: ear.rotate }}
                  transition={{ type: "spring", stiffness: 240, damping: 22 }}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <img
                    src={earArt.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    style={{
                      width: ear.size,
                      height: ear.size,
                      transform: ear.flip ? "scaleX(-1)" : undefined,
                    }}
                    className="select-none object-contain"
                  />
                </motion.button>

                <div
                  className="pointer-events-none absolute"
                  style={
                    ear.tail === "left"
                      ? { left: -ear.size * 0.9, top: -ear.size * 0.06 }
                      : { left: -ear.size * 0.95, top: -ear.size * 0.1 }
                  }
                >
                  <AnimatePresence>
                    {isActive ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.88, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 6 }}
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        style={{ rotate: ear.bubbleRotate }}
                      >
                        <StoryBubble
                          storyKey={ear.id}
                          story={currentStory}
                          meta={currentWho}
                          size="desktop"
                          tail={ear.tail}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* phone (< sm): smaller ear with the bubble sitting right next to it */}
        <div className="mt-10 sm:hidden">
          <p className="font-hand text-xl text-ink/70">tap an ear →</p>
          <div className="mt-5 space-y-8">
            {earStories.map((ear, i) => {
              const isActive = ear.id === activeId;
              const right = i === 1;
              const currentStory = storiesMap[ear.id]?.story ?? ear.story;
              const currentWho = storiesMap[ear.id]?.who ?? ear.who;
              return (
                <div
                  key={ear.id}
                  className={cn(
                    "flex items-center gap-2",
                    right ? "flex-row-reverse justify-start" : "justify-start",
                  )}
                >
                  <motion.button
                    type="button"
                    aria-label={`Story heard in ${currentWho}`}
                    aria-pressed={isActive}
                    onClick={() => setActiveId((cur) => (cur === ear.id ? null : ear.id))}
                    animate={{ scale: isActive ? 1.06 : 1, rotate: ear.rotate * 0.5 }}
                    transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    className="block shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    <img
                      src={earArt.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      style={{ transform: ear.flip ? "scaleX(-1)" : undefined }}
                      className="w-[clamp(84px,24vw,120px)] select-none object-contain"
                    />
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {isActive ? (
                      <motion.div
                        key={ear.id}
                        initial={{ opacity: 0, scale: 0.9, x: right ? 8 : -8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        className="min-w-0 flex-1"
                      >
                        <StoryBubble
                          storyKey={ear.id}
                          story={currentStory}
                          meta={currentWho}
                          size="tiny"
                          tail={right ? "right" : "left"}
                          className="max-w-full"
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* large phones / small tablets (sm to md): side-by-side, exactly like the reference */}
        <div className="mt-10 hidden sm:block md:hidden">
          <p className="font-hand text-xl text-ink/70">tap an ear →</p>
          <div className="mt-4 space-y-8">
            {earStories.map((ear, i) => {
              const isActive = ear.id === activeId;
              const right = i === 1;
              const currentStory = storiesMap[ear.id]?.story ?? ear.story;
              const currentWho = storiesMap[ear.id]?.who ?? ear.who;
              return (
                <div
                  key={ear.id}
                  className={cn(
                    "flex items-center gap-3",
                    right ? "flex-row-reverse justify-start" : "justify-start",
                  )}
                >
                  <motion.button
                    type="button"
                    aria-label={`Story heard in ${currentWho}`}
                    aria-pressed={isActive}
                    onClick={() => setActiveId((cur) => (cur === ear.id ? null : ear.id))}
                    animate={{ scale: isActive ? 1.06 : 1, rotate: ear.rotate * 0.5 }}
                    transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    className="block shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    <img
                      src={earArt.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      style={{ transform: ear.flip ? "scaleX(-1)" : undefined }}
                      className="w-[clamp(100px,18vw,140px)] select-none object-contain"
                    />
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {isActive ? (
                      <motion.div
                        key={ear.id}
                        initial={{ opacity: 0, scale: 0.9, x: right ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        className="min-w-0 flex-1"
                      >
                        <StoryBubble
                          storyKey={ear.id}
                          story={currentStory}
                          meta={currentWho}
                          size="mobile"
                          tail={right ? "right" : "left"}
                          className="max-w-full"
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
