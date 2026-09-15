"use client";

import { motion } from "framer-motion";

/** Generic hover wrapper — scales/lifts/tilts a child on hover with a spring. */
export function HoverScale({
  children,
  className = "",
  scale = 1.05,
  y = 0,
  rotate = 0,
}: {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  y?: number;
  rotate?: number;
}) {
  return (
    <motion.div
      whileHover={{ scale, y, rotate }}
      whileTap={{ scale: scale > 1 ? scale - 0.03 : scale }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
