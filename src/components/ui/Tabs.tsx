"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  return (
    <div style={{ width: "100%" }}>
      {/* Tab Headers */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          borderBottom: "1px solid var(--color-border)",
          marginBottom: "var(--space-3)",
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              onChange?.(tab.id);
            }}
            style={{
              position: "relative",
              padding: "0.75rem 0.5rem",
              background: "transparent",
              border: "none",
              color: activeTab === tab.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: "pointer",
              fontSize: "0.875rem",
              outline: "none",
              transition: "color 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                style={{
                  position: "absolute",
                  bottom: "-1px",
                  left: 0,
                  right: 0,
                  height: "2px",
                  background: "var(--color-magenta)",
                  borderRadius: "2px 2px 0 0",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ position: "relative" }}>
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </div>
    </div>
  );
}
