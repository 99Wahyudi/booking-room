import React from 'react';
import { Link } from 'react-router-dom';

const Mark = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="#FD7549" height="10" rx="2" width="10" x="8" y="18" />
    <circle cx="34" cy="18" fill="#FFFFFF" r="4.5" />
    <path
      d="M8 32C14 32 18 24 24 24C30 24 34 30 40 26"
      stroke="#FFFFFF"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4.5"
    />
  </svg>
);

/**
 * StayEasy brand logo.
 *  - variant "horizontal" (default): icon mark + "StayEasy" wordmark
 *  - variant "icon": only the rounded teal mark
 */
export default function Logo({ variant = 'horizontal', to = '/', className = '', light = false }) {
  return (
    <Link to={to} className={`${className} inline-flex items-center gap-2.5`} aria-label="StayEasy Beranda">
      <span className={`inline-flex rounded-xl ${light ? 'bg-white/10' : 'bg-green-600'} text-on-primary`}>
        <Mark />
      </span>
      {variant === 'horizontal' && (
        <span className="flex flex-col leading-none">
          <span className="leading-none">
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">Stay</span>
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-secondary">Easy</span>
          </span>
          <span className="font-label-sm text-label-sm tracking-wide uppercase text-[10px] text-on-surface-variant">
            Booking &amp; Hospitality
          </span>
        </span>
      )}
    </Link>
  );
}