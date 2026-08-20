import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconGrid(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function IconFileText(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function IconCart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 4h2l1.6 10.2a2 2 0 0 0 2 1.7h7.4a2 2 0 0 0 1.98-1.7L20 8H6.2" />
      <circle cx="9.5" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="17" cy="8.5" r="2.5" />
      <path d="M15.8 11.6c2 .3 3.6 1.8 4.1 4.4" />
    </svg>
  );
}

export function IconPackage(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" />
      <path d="M4 8l8 4.5L20 8" />
      <path d="M12 12.5V21" />
    </svg>
  );
}

export function IconUserCog(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="18" cy="16.5" r="2.3" />
      <path d="M18 13v.8M18 18.7v.8M20.4 15l-.7.4M15.6 17.6l-.7.4M20.4 18l-.7-.4M15.6 15.4l-.7-.4" />
    </svg>
  );
}

export function IconFolder(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 6.5a1 1 0 0 1 1-1H9l2 2h8.5a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-11.5Z" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7 6.3 6.3" />
    </svg>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 5v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function IconReceipt(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h12v17l-2.5-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 20.5v-17Z" />
      <path d="M9 8h6M9 11.5h6M9 15h4" />
    </svg>
  );
}
