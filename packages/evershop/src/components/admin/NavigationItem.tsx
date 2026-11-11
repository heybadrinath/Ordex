import React from 'react';
import './NavigationItem.scss';

export interface NavigationItemProps {
  Icon: React.ElementType;
  url: string;
  title: string;
}

export function NavigationItem({ Icon, url, title }: NavigationItemProps) {
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const checkActive = () => {
      const currentUrl = window.location.href;
      const currentUrlObj = new URL(currentUrl);
      const menuUrlObj = new URL(url, window.location.origin);

      const currentPath = currentUrlObj.pathname;
      const menuPath = menuUrlObj.pathname;

      if (
        currentPath === menuPath ||
        (menuPath === '/admin/orders' &&
          currentPath.startsWith('/admin/order/'))
      ) {
        setIsActive(true);
        return;
      }

      const menuSegments = menuPath.split('/').filter(Boolean);

      if (menuSegments.length >= 2 && currentPath.startsWith(menuPath + '/')) {
        setIsActive(true);
        return;
      }

      setIsActive(false);
    };

    checkActive();
  }, [url]);

  return (
    <li className={isActive ? 'active nav-item' : 'nav-item'}>
      <a
        href={url}
        className="flex justify-left"
        aria-current={isActive ? 'page' : undefined}
      >
        <i className="menu-icon">
          <Icon />
        </i>
        {title}
      </a>
    </li>
  );
}
