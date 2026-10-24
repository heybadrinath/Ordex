import React, { useEffect, useRef, useState } from 'react';
const links = [
  ['/admin', 'Overview'],
  ['/admin/orders', 'Orders'],
  ['/admin/returns', 'Returns'],
  ['/admin/products', 'Products'],
  ['/admin/customers', 'Customers'],
  ['/admin/categories', 'Categories'],
  ['/admin/collections', 'Collections'],
  ['/admin/attributes', 'Attributes'],
  ['/admin/setting/store', 'Settings']
];
export default function MobileNavigation() {
  const [path, setPath] = useState('');
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => setPath(window.location.pathname), []);
  useEffect(() => {
    if (!window.matchMedia('(max-width: 760px)').matches) return;
    const menu = navRef.current;
    const item = menu?.querySelector<HTMLElement>('[aria-current="page"]');
    if (item && menu) {
      menu.scrollLeft += item.getBoundingClientRect().left -
        menu.getBoundingClientRect().left - (menu.clientWidth - item.offsetWidth) / 2;
    }
  }, [path]);
  return (
    <nav
      ref={navRef}
      className="mobile-studio-nav"
      aria-label="Seller navigation"
    >
      {links.map(([href, label]) => (
        <a
          key={href}
          href={href}
          aria-current={
            path === href ||
            (href !== '/admin' && path.startsWith(href + '/')) ||
            (href === '/admin/orders' && path.startsWith('/admin/order/')) ||
            (label === 'Settings' && path.startsWith('/admin/setting/'))
              ? 'page'
              : undefined
          }
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
export const layout = { areaId: 'header', sortOrder: 15 };
