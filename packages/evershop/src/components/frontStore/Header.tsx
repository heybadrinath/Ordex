// Modified for Ordex on 19 October 2026.
import Area from '@components/common/Area.js';
import React from 'react';
import { ArrowUpRight } from 'lucide-react';
export function Header() {
  return (
    <header className="header ordex-header">
      <div className="ordex-announcement">
        <span>A little more thought. A little less ordinary.</span>
        <span>
          Free standard delivery <ArrowUpRight size={12} />
        </span>
      </div>
      <div className="header__middle page-width">
        <a href="/" className="ordex-brand" aria-label="Ordex home">
          <span className="brand-symbol">✳</span> ordex
          <span className="brand-dot">®</span>
        </a>
        <nav className="ordex-nav" aria-label="Main navigation">
          <a href="/products">Shop all</a>
          <a href="/accessories">Everyday objects</a>
          <a href="/about-us">Our story</a>
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
