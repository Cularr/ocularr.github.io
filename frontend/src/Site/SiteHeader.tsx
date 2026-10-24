import { Menu, Moon, Sun, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Logo from 'Components/Logo';
import styles from './SiteHeader.module.css';

type Theme = 'light' | 'dark';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#download', label: 'Download' },
  { href: '#support', label: 'Support' },
  { href: 'https://opencollective.com/sonarr', label: 'Donate' },
  { href: 'https://github.com/cularr/ocularr', label: 'GitHub' },
];

function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem('theme', theme);

    return true;
  } catch {
    return false;
  }
}

function SiteHeader() {
  const [theme, setTheme] = useState<Theme>(getTheme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isMenuOpen]);

  const handleThemePress = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';

    setTheme(next);
    saveTheme(next);
  }, [theme]);

  const handleMenuPress = useCallback(() => {
    setIsMenuOpen((value) => !value);
  }, []);

  const handleLinkPress = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return (
    <header ref={headerRef} className={styles.header}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>

      <div className={styles.inner}>
        <a className={styles.brand} href="#home">
          <Logo size={28} />
          <span>Ocularr</span>
        </a>

        <nav
          id="site-navigation"
          className={isMenuOpen ? styles.navOpen : styles.nav}
          aria-label="Main"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              className={styles.link}
              href={link.href}
              onClick={handleLinkPress}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <button
            className={styles.iconButton}
            type="button"
            aria-label={
              theme === 'dark'
                ? 'Switch to light theme'
                : 'Switch to dark theme'
            }
            onClick={handleThemePress}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className={styles.menuButton}
            type="button"
            aria-label="Menu"
            aria-controls="site-navigation"
            aria-expanded={isMenuOpen}
            onClick={handleMenuPress}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
