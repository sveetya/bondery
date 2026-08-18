"use client";

import { LogoIcon } from "@bondery/mantine-next";
import { Card, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconApi, IconBrandInstagram, IconBrandLinkedin } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const SATELLITES = [
  {
    ariaLabel: "LinkedIn",
    color: "#0A66C2",
    icon: IconBrandLinkedin,
    id: "linkedin",
    label: "Profile update",
  },
  {
    ariaLabel: "Instagram",
    color: "#E4405F",
    icon: IconBrandInstagram,
    id: "instagram",
    label: "Instagram import",
  },
  {
    ariaLabel: "API",
    color: "#7C3AED",
    icon: IconApi,
    id: "api",
    label: "API write",
  },
] as const;

function satelliteAngle(index: number): number {
  return ((index + 1) / 4) * 2 * Math.PI - Math.PI / 2;
}

export function SyncedConnectionsAnimation() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const reduceMotion = useReducedMotion();

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SATELLITES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  const radius = isMobile ? 90 : 130;
  const centerSize = 80;
  const satelliteSize = 48;

  const activeSat = SATELLITES[activeIndex];

  return (
    <Card
      className="bg-transparent border-none shadow-none overflow-visible relative flex items-center justify-center p-0"
      padding="xl"
      radius="lg"
      style={{
        aspectRatio: "4/3",
        fontSize: "1rem",
        maxWidth: 500,
        width: "100%",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 flex justify-center z-30 pointer-events-none h-12"
      >
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-gray-100 dark:border-zinc-700 mt-2"
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            key={activeSat.id}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: activeSat.color }}
            >
              <activeSat.icon size={14} />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
              {activeSat.label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          className="relative z-20 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl flex items-center justify-center border border-gray-100 dark:border-zinc-700"
          style={{ height: centerSize, width: centerSize }}
          transition={{ damping: 17, stiffness: 400, type: "spring" }}
          whileHover={reduceMotion ? undefined : { scale: 1.1 }}
        >
          <LogoIcon className="text-zinc-900 dark:text-white" size={48} />

          <AnimatePresence>
            {!reduceMotion && (
              <motion.div
                animate={{ opacity: [0, 0.3, 0], scale: [1, 1.4, 1.6] }}
                className="absolute inset-0 rounded-2xl -z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                key={`pulse-${activeIndex}`}
                style={{ backgroundColor: activeSat.color }}
                transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        <svg
          className="absolute left-1/2 top-1/2 overflow-visible pointer-events-none z-10"
          style={{
            height: 600,
            marginLeft: -300,
            marginTop: -300,
            width: 600,
          }}
          viewBox="-300 -300 600 600"
        >
          {SATELLITES.map((sat, index) => {
            const angle = satelliteAngle(index);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const isActive = activeIndex === index;

            return (
              <motion.line
                animate={{
                  opacity: isActive ? 1 : 0.3,
                  stroke: isActive ? sat.color : colorScheme === "dark" ? "#52525b" : "#d1d5db",
                }}
                initial={{ opacity: 0.3 }}
                key={`line-${sat.id}`}
                stroke={isActive ? sat.color : colorScheme === "dark" ? "#52525b" : "#d1d5db"}
                strokeWidth={isActive ? 2 : 1}
                transition={{ duration: 0.3 }}
                x1={0}
                x2={x}
                y1={0}
                y2={y}
              />
            );
          })}
        </svg>

        {SATELLITES.map((sat, index) => {
          const angle = satelliteAngle(index);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isActive = index === activeIndex;

          return (
            <div className="absolute left-1/2 top-1/2" key={sat.id} style={{ height: 0, width: 0 }}>
              <AnimatePresence>
                {isActive && !reduceMotion && (
                  <motion.div
                    animate={{
                      opacity: [1, 1, 0],
                      scale: [1, 1, 0],
                      x: [x, 0],
                      y: [y, 0],
                    }}
                    className="absolute w-3 h-3 rounded-full z-10 shadow-sm pointer-events-none"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0, scale: 0, x: x, y: y }}
                    style={{
                      backgroundColor: sat.color,
                      marginLeft: -6,
                      marginTop: -6,
                    }}
                    transition={{
                      duration: 1,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </AnimatePresence>

              <motion.button
                animate={{
                  opacity: isActive ? 1 : 0.8,
                  scale: isActive ? 1.2 : 1,
                }}
                aria-label={sat.ariaLabel}
                aria-pressed={isActive}
                className="absolute bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center border border-gray-100 dark:border-zinc-700 z-20 cursor-pointer p-0"
                onClick={() => setActiveIndex(index)}
                style={{
                  height: satelliteSize,
                  marginLeft: -satelliteSize / 2,
                  marginTop: -satelliteSize / 2,
                  width: satelliteSize,
                  x: x,
                  y: y,
                }}
                transition={{ duration: 0.3 }}
                type="button"
                whileHover={reduceMotion ? undefined : { opacity: 1, scale: 1.2, zIndex: 30 }}
              >
                <sat.icon
                  color={isActive ? sat.color : "#9ca3af"}
                  size={24}
                  style={{ transition: "color 0.3s" }}
                />
              </motion.button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
