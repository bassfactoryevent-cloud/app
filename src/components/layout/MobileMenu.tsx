"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import styles from "./Header.module.css";
import { ThemeToggle } from "./ThemeToggle";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className={styles.mobileMenuContainer}>
      <button onClick={toggleMenu} className={styles.hamburgerBtn} aria-label="Menu">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className={styles.mobileOverlay}>
          <nav className={styles.mobileNav}>
            <Link href="/events" onClick={toggleMenu} className={styles.mobileNavLink}>Eventos</Link>
            <Link href="/djs" onClick={toggleMenu} className={styles.mobileNavLink}>DJs & Booking</Link>
            <Link href="/merch" onClick={toggleMenu} className={styles.mobileNavLink}>Merch</Link>
            <Link href="/blog" onClick={toggleMenu} className={styles.mobileNavLink}>Cultura (Blog)</Link>
            
            <div className={styles.mobileMenuFooter}>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
