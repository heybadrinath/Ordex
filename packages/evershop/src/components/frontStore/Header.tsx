// Modified for Ordex on 19 October 2026.
import Area from '@components/common/Area.js';
import React, { useEffect, useState } from 'react';
import { Brand } from '@components/common/Brand.js';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const links = [
  ['/products', 'Shop all'],
  ['/living', 'Home'],
  ['/workspace', 'Desk'],
  ['/audio', 'Tech'],
  ['/everyday-carry', 'Carry']
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [path, setPath] = useState('');
  useEffect(() => setPath(window.location.pathname), []);
  return (
    <header
      className="header ordex-header"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setMenuOpen(false);
      }}
    >
      <div className="ordex-announcement">
        <span>Good things for the everyday.</span>
        <span>
          Free standard delivery <ArrowUpRight size={12} />
        </span>
      </div>
      <div className="header__middle page-width">
        <a href="/" className="ordex-brand" aria-label="Ordex home">
          <Brand />
        </a>
        <button
          className="ordex-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="store-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav
          className="ordex-nav"
          id="store-navigation"
          aria-label="Main navigation"
          data-open={menuOpen}
        >
          {links.map(([href, label]) => (
            <a
              href={href}
              key={href}
              aria-current={
                path === href ||
                path.startsWith(`${href}/`) ||
                (href === '/products' && path === '/')
                  ? 'page'
                  : undefined
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
        <Area
          id="headerMiddleRight"
          className="header__middle__right"
          isGlobal
        />
      </div>
    </header>
  );
}
