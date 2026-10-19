// Modified for Ordex on 19 October 2026.
import React from 'react';
import { ArrowUpRight } from 'lucide-react';
export function Footer({ copyRight }: { copyRight: string }) {
  return (
    <footer className="ordex-footer">
      <div className="page-width">
        <div className="footer-topline">
          <a className="ordex-brand" href="/">
            <span className="brand-symbol">✳</span> ordex
          </a>
          <h2>
            Good things.
            <br />
            <em>Every day.</em>
          </h2>
          <div className="footer-links">
            <a href="/products">
              Shop the collection <ArrowUpRight size={14} />
            </a>
            <a href="/account">
              Your account <ArrowUpRight size={14} />
            </a>
            <a href="/account/returns">
              Returns & refunds <ArrowUpRight size={14} />
            </a>
            <a href="/admin">
              Seller studio <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{copyRight || 'Ordex · Thoughtful everyday objects'}</span>
          <span>Demo store · All payments are simulated</span>
          <a href="https://evershop.io">Powered by EverShop</a>
        </div>
      </div>
    </footer>
  );
}
