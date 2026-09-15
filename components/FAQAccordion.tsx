"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import { IconChevronDown } from "./icons";
import type { FaqCopy } from "@/lib/i18n";

const GROUP_RADIUS = 28; // ~half the row's min height, so a standalone closed row reads as a true pill

const ROW_TRANSITION: Transition = { type: "spring", duration: 0.55, bounce: 0.38 };
const CONTENT_OPEN_TRANSITION: Transition = { type: "spring", duration: 0.58, bounce: 0.32 };
const CONTENT_CLOSE_TRANSITION: Transition = { type: "spring", duration: 0.46, bounce: 0.26 };
const DESCRIPTION_TRANSITION: Transition = { duration: 0.18, ease: [0.16, 1, 0.3, 1] };
const CHEVRON_TRANSITION: Transition = { type: "spring", duration: 0.42, bounce: 0.28 };

type Row = { id: string; title: string; description: string };

function FAQAccordionRow({
  row,
  open,
  startsGroup,
  endsGroup,
  separatedFromPrevious,
  contentId,
  triggerId,
  reduce,
  onToggle,
}: {
  row: Row;
  open: boolean;
  startsGroup: boolean;
  endsGroup: boolean;
  separatedFromPrevious: boolean;
  contentId: string;
  triggerId: string;
  reduce: boolean | null;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const updateHeight = () => setContentHeight(node.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={false}
      animate={{ marginTop: separatedFromPrevious ? 12 : 0 }}
      transition={reduce ? { duration: 0 } : ROW_TRANSITION}
    >
      <motion.div
        data-state={open ? "open" : "closed"}
        initial={false}
        animate={{
          borderTopLeftRadius: startsGroup ? GROUP_RADIUS : 0,
          borderTopRightRadius: startsGroup ? GROUP_RADIUS : 0,
          borderBottomLeftRadius: endsGroup ? GROUP_RADIUS : 0,
          borderBottomRightRadius: endsGroup ? GROUP_RADIUS : 0,
        }}
        transition={reduce ? { duration: 0 } : ROW_TRANSITION}
        className="faq-row overflow-hidden bg-paper-raised text-ink"
      >
        <button
          id={triggerId}
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={onToggle}
          className="flex min-h-[56px] w-full items-center gap-4 px-5 text-start outline-none transition-colors focus-visible:bg-mark/10 focus-visible:outline-offset-[-3px]"
        >
          <span className="min-w-0 flex-1 text-sm sm:text-base font-semibold text-ink">{row.title}</span>
          <motion.span
            aria-hidden="true"
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : CHEVRON_TRANSITION}
            className="grid h-6 w-6 shrink-0 place-items-center text-mark"
          >
            <IconChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        <motion.div
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          aria-hidden={!open}
          initial={false}
          animate={{ height: open ? contentHeight : 0 }}
          transition={reduce ? { duration: 0 } : open ? CONTENT_OPEN_TRANSITION : CONTENT_CLOSE_TRANSITION}
          className="overflow-hidden"
        >
          <motion.div
            ref={contentRef}
            animate={{ opacity: open ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : DESCRIPTION_TRANSITION}
            className="px-5 pb-5"
          >
            <div className="text-sm text-muted leading-relaxed max-w-xl">{row.description}</div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function FAQAccordion({ items }: { items: FaqCopy[] }) {
  const reduce = useReducedMotion();
  const baseId = useId();
  const rows: Row[] = items.map((item, index) => ({ id: String(index), title: item.q, description: item.a }));

  const [openId, setOpenId] = useState<string | null>(rows[0]?.id ?? null);
  const activeIndex = rows.findIndex((row) => row.id === openId);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="w-full">
      {rows.map((row, index) => {
        const open = openId === row.id;
        const previousIsOpen = activeIndex === index - 1;
        const nextIsOpen = activeIndex === index + 1;
        const startsGroup = open || index === 0 || previousIsOpen;
        const endsGroup = open || index === rows.length - 1 || nextIsOpen;
        const separatedFromPrevious = index > 0 && (open || previousIsOpen);

        return (
          <FAQAccordionRow
            key={row.id}
            row={row}
            open={open}
            startsGroup={startsGroup}
            endsGroup={endsGroup}
            separatedFromPrevious={separatedFromPrevious}
            contentId={`${baseId}-${row.id}-content`}
            triggerId={`${baseId}-${row.id}-trigger`}
            reduce={reduce}
            onToggle={() => toggle(row.id)}
          />
        );
      })}
    </div>
  );
}
