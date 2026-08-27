"use client";

import { BonderyIcon } from "@bondery/branding/react";
import { Box } from "@mantine/core";
import { motion } from "motion/react";

const NODE_BG = "var(--mantine-color-default)";
const BORDER_COL = "var(--mantine-color-default-border)";
const GRAPE = "var(--mantine-color-grape-5)";
const DESKTOP_BG = "var(--mantine-color-gray-light)";
const TASKBAR_BG = "var(--mantine-color-dark-6)";

const ANIM_W = 300;
const ANIM_H = 118;
const SCENE_W = 112;
const SCENE_H = 92;
const ICON_SIZE = 24;

export function PwaInstallAnimation() {
  return (
    <Box
      style={{
        alignItems: "center",
        display: "flex",
        gap: 16,
        height: ANIM_H,
        justifyContent: "center",
        margin: "0 auto",
        width: ANIM_W,
      }}
    >
      <motion.div
        animate={{ opacity: [1, 0.45, 0.45, 1] }}
        style={{ flexShrink: 0, width: SCENE_W }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      >
        <Box
          style={{
            backgroundColor: NODE_BG,
            border: `1px solid ${BORDER_COL}`,
            borderRadius: 10,
            boxShadow: "var(--mantine-shadow-sm)",
            overflow: "hidden",
          }}
        >
          <Box
            style={{
              alignItems: "center",
              backgroundColor: "var(--mantine-color-gray-light)",
              borderBottom: `1px solid ${BORDER_COL}`,
              display: "flex",
              gap: 4,
              height: 18,
              paddingLeft: 8,
            }}
          >
            <Box
              style={{
                backgroundColor: "var(--mantine-color-red-5)",
                borderRadius: "50%",
                height: 5,
                width: 5,
              }}
            />
            <Box
              style={{
                backgroundColor: "var(--mantine-color-yellow-5)",
                borderRadius: "50%",
                height: 5,
                width: 5,
              }}
            />
            <Box
              style={{
                backgroundColor: "var(--mantine-color-green-5)",
                borderRadius: "50%",
                height: 5,
                width: 5,
              }}
            />
          </Box>
          <Box
            style={{
              backgroundColor: "var(--mantine-color-gray-light)",
              borderBottom: `1px solid ${BORDER_COL}`,
              height: 14,
              padding: "2px 6px",
            }}
          >
            <Box
              style={{
                backgroundColor: NODE_BG,
                border: `1px solid ${BORDER_COL}`,
                borderRadius: 4,
                height: 8,
                width: "85%",
              }}
            />
          </Box>
          <Box
            style={{
              alignItems: "center",
              display: "flex",
              height: SCENE_H - 32,
              justifyContent: "center",
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0.35, 0.35, 1], scale: [1, 0.9, 0.9, 1] }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
            >
              <BonderyIcon height={ICON_SIZE} width={ICON_SIZE} />
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      <motion.div
        animate={{ opacity: [0.35, 0.9, 0.9, 0.35], x: [0, 3, 3, 0] }}
        style={{
          color: GRAPE,
          flexShrink: 0,
          fontSize: 18,
          lineHeight: 1,
          textAlign: "center",
          width: 20,
        }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      >
        →
      </motion.div>

      <motion.div
        animate={{ opacity: [0.45, 1, 1, 0.45] }}
        style={{ flexShrink: 0, width: SCENE_W }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
      >
        <Box
          style={{
            backgroundColor: DESKTOP_BG,
            border: `1px solid ${BORDER_COL}`,
            borderRadius: 10,
            boxShadow: "var(--mantine-shadow-md)",
            height: SCENE_H,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            animate={{
              scale: [0.94, 1, 1, 0.94],
              y: [3, 0, 0, 3],
            }}
            style={{
              backgroundColor: NODE_BG,
              border: `2px solid ${GRAPE}`,
              borderRadius: 7,
              boxShadow: "var(--mantine-shadow-sm)",
              height: 54,
              left: 14,
              overflow: "hidden",
              position: "absolute",
              right: 14,
              top: 8,
            }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
          >
            <Box
              style={{
                alignItems: "center",
                backgroundColor: GRAPE,
                display: "flex",
                height: 12,
                justifyContent: "center",
              }}
            >
              <Box
                style={{
                  backgroundColor: "rgba(255,255,255,0.85)",
                  borderRadius: 2,
                  height: 3,
                  width: 28,
                }}
              />
            </Box>
            <Box
              style={{
                alignItems: "center",
                display: "flex",
                height: 42,
                justifyContent: "center",
              }}
            >
              <BonderyIcon height={ICON_SIZE} width={ICON_SIZE} />
            </Box>
          </motion.div>

          <Box
            style={{
              alignItems: "center",
              backgroundColor: TASKBAR_BG,
              bottom: 0,
              display: "flex",
              gap: 6,
              height: 20,
              justifyContent: "center",
              left: 0,
              position: "absolute",
              right: 0,
            }}
          >
            <Box
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: 3,
                height: 12,
                width: 12,
              }}
            />
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 transparent",
                  `0 0 0 2px ${GRAPE}`,
                  `0 0 0 2px ${GRAPE}`,
                  "0 0 0 0 transparent",
                ],
                scale: [1, 1.08, 1.08, 1],
              }}
              style={{
                alignItems: "center",
                backgroundColor: GRAPE,
                borderRadius: 4,
                display: "flex",
                height: 14,
                justifyContent: "center",
                width: 14,
              }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
            >
              <BonderyIcon height={9} width={9} />
            </motion.div>
            <Box
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: 3,
                height: 12,
                width: 12,
              }}
            />
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
