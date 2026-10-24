import { useAppState } from '@components/common/context/app.js';
import React from 'react';
import { Spinner } from './ui/Spinner.js';
import './LoadingBar.scss';

const LoadingBar = function LoadingBar() {
  const { fetching } = useAppState();
  const [navigating, setNavigating] = React.useState(false);

  React.useEffect(() => {
    const beginNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest('a[href]')
          : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.hasAttribute('download') ||
        (link.target && link.target !== '_self')
      )
        return;
      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        !['http:', 'https:'].includes(destination.protocol)
      )
        return;
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      )
        return;
      setNavigating(true);
    };
    const start = () => setNavigating(true);
    const finish = () => setNavigating(false);
    const cancel = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    document.addEventListener('click', beginNavigation);
    document.addEventListener('keydown', cancel);
    window.addEventListener('beforeunload', start);
    window.addEventListener('pageshow', finish);
    return () => {
      document.removeEventListener('click', beginNavigation);
      document.removeEventListener('keydown', cancel);
      window.removeEventListener('beforeunload', start);
      window.removeEventListener('pageshow', finish);
    };
  }, []);

  if (!fetching && !navigating) return null;

  return (
    <div className="page-progress" role="status" aria-live="polite">
      <div className="loading-bar" aria-hidden="true" />
      <div className="page-progress-label">
        <Spinner aria-hidden="true" />
        <span>{navigating ? 'Opening page…' : 'Updating view…'}</span>
      </div>
    </div>
  );
};

export { LoadingBar };
