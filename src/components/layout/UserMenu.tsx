"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut, Settings, Ticket } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

export default function UserMenu({ userEmail, userName }: { userEmail: string; userName: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: "transparent", 
          border: "1px solid var(--glass-border)", 
          borderRadius: "99px",
          padding: "6px 16px 6px 6px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
          color: "white"
        }}
      >
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--color-magenta), var(--color-accent))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "14px"
        }}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="hide-on-mobile" style={{ fontSize: "14px", fontWeight: "500" }}>
          {userName.split(' ')[0]}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="user-menu-dropdown"
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: "220px",
                padding: "8px",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.8)"
              }}
            >
              <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)", marginBottom: "4px" }}>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-text-primary)", margin: 0 }}>{userName}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</p>
            </div>
            
            <Link href="/account" className="menu-item" onClick={() => setIsOpen(false)}>
              <User size={16} /> Mi Panel
            </Link>
            <Link href="/account/tickets" className="menu-item" onClick={() => setIsOpen(false)}>
              <Ticket size={16} /> Mis Tickets
            </Link>
            <Link href="/account/settings" className="menu-item" onClick={() => setIsOpen(false)}>
              <Settings size={16} /> Ajustes
            </Link>
            
            <div style={{ height: "1px", background: "var(--glass-border)", margin: "4px 0" }} />
            
            <button onClick={() => signOut()} className="menu-item text-error" style={{ border: "none", background: "transparent", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--color-magenta)" }}>
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .menu-item {
          display: flex;
          alignItems: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 14px;
          color: var(--color-text-primary);
          transition: background 0.2s;
        }
        .menu-item:hover {
          background: rgba(128,128,128,0.1);
        }
        @media (max-width: 600px) {
          .hide-on-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
