import React from 'react';
import { Brand } from '@components/common/Brand.js';
import { ArrowUpRight } from 'lucide-react';

export function Footer({ copyRight }: { copyRight: string }) {
  return (
    <footer className="ordex-footer">
      <div className="page-width">
        <div className="footer-topline">
          <div className="footer-message">
            <span className="eyebrow">Made for the everyday</span>
            <h2>
              Good things.
              <br />
              <em>Good company.</em>
            </h2>
            <a href="/products">
              Find your next favourite <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="footer-link-column">
            <h3>Find your everyday</h3>
            <a href="/living">Home & living</a>
            <a href="/workspace">Work & desk</a>
            <a href="/audio">Sound & tech</a>
            <a href="/everyday-carry">Out & about</a>
          </div>
          <div className="footer-link-column">
            <h3>Here to help</h3>
            <a href="/account">Your account</a>
            <a href="/account/orders">Orders & delivery</a>
            <a href="/account/returns">Returns & refunds</a>
            <a href="/admin">Seller studio</a>
          </div>
        </div>
        <div className="footer-bottom">
          <a className="ordex-brand" href="/" aria-label="Ordex home">
            <Brand />
          </a>
          <span>{copyRight || 'Ordex · Thoughtful everyday objects'}</span>
          <span>Demo store · Payments are simulated</span>
          <a href="https://evershop.io">Powered by EverShop</a>
        </div>
      </div>
    </footer>
  );
}
