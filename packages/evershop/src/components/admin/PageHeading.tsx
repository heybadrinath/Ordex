import Area from '@components/common/Area.js';
import React from 'react';
import './PageHeading.scss';

function BackIcon({ backUrl = undefined }: { backUrl?: string }) {
  if (!backUrl) return null;
  return (
    <a
      href={backUrl}
      aria-label="Back to list"
      className="breadcrum-icon border block border-border rounded mr-2"
    >
      <span className="flex items-center justify-center">
        <svg
          className="text-icon"
          viewBox="0 0 20 20"
          focusable="false"
          aria-hidden="true"
        >
          <path d="M17 9H5.414l3.293-3.293a.999.999 0 1 0-1.414-1.414l-5 5a.999.999 0 0 0 0 1.414l5 5a.997.997 0 0 0 1.414 0 .999.999 0 0 0 0-1.414L5.414 11H17a1 1 0 1 0 0-2z" />
        </svg>
      </span>
    </a>
  );
}

function Heading({
  heading,
  description,
  eyebrow
}: {
  heading: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="page-heading-copy self-center">
      {eyebrow && <span className="page-heading-eyebrow">{eyebrow}</span>}
      <h1 className="page-heading-title">{heading}</h1>
      {description && <p className="page-heading-description">{description}</p>}
    </div>
  );
}

export interface PageHeadingProps {
  backUrl?: string;
  heading: string;
  description?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
}

function PageHeading({
  backUrl = undefined,
  heading,
  description,
  eyebrow,
  icon
}: PageHeadingProps) {
  if (!heading) {
    return null;
  }

  return (
    <div
      className={`page-heading flex justify-between items-center ${
        description ? 'page-heading-rich' : ''
      }`}
    >
      <div className="page-heading-main flex justify-start space-x-2 items-center">
        {icon && (
          <span className="page-heading-symbol" aria-hidden="true">
            {icon}
          </span>
        )}
        <Area
          id="pageHeadingLeft"
          noOuter
          coreComponents={[
            {
              component: { default: BackIcon },
              props: {
                backUrl
              },
              sortOrder: 0,
              id: 'breadcrumb'
            },
            {
              component: { default: Heading },
              props: {
                heading,
                description,
                eyebrow
              },
              sortOrder: 0,
              id: 'heading'
            }
          ]}
        />
      </div>
      <div className="flex justify-end space-x-2 items-center">
        <Area id="pageHeadingRight" noOuter coreComponents={[]} />
      </div>
    </div>
  );
}

export { PageHeading };
