const defaultSize = 18;

export function IconDashboard({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconCourses({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 6C4 4.9 4.9 4 6 4H14C15.1 4 16 4.9 16 6V15C16 16.1 15.1 17 14 17H6C4.9 17 4 16.1 4 15V6Z" stroke={color} strokeWidth="1.5" />
      <path d="M7 8H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 11H11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 6L4 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 10L4 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 14L4 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconMastery({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4" stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1.5" fill={color} />
      <path d="M10 2.5V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 16V17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 10H4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10H17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconTutor({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 3C6.686 3 4 5.462 4 8.5C4 10.108 4.71 11.56 5.85 12.6L5.5 16L9.1 14.45C9.39 14.48 9.69 14.5 10 14.5C13.314 14.5 16 12.038 16 9C16 5.962 13.314 3 10 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 8.5H10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 10.5H9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 8C17.2 8.6 18 9.7 18 11C18 12.3 17.2 13.4 16 14V16L13.8 14.8C13.5 14.9 13.3 14.9 13 14.9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconDiagnostic({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 16L8 9L11 13L16 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 4H16V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPractice({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="14" height="14" rx="3" stroke={color} strokeWidth="1.5" />
      <path d="M7 10L9.5 12.5L13.5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconReassessment({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 10C4 6.686 6.686 4 10 4C12.5 4 14.7 5.5 15.7 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10C16 13.314 13.314 16 10 16C7.5 16 5.3 14.5 4.3 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.5 4V7.5H12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 16V12.5H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconProfile({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6.5" r="3.5" stroke={color} strokeWidth="1.5" />
      <path d="M3.5 17C4.2 14.2 6.8 12.5 10 12.5C13.2 12.5 15.8 14.2 16.5 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconBell({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 3C7.5 3 5.5 5 5.5 7.5V10.5L4 13H16L14.5 10.5V7.5C14.5 5 12.5 3 10 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5 15.5C8.8 16.3 9.3 16.8 10 16.8C10.7 16.8 11.2 16.3 11.5 15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconGlobe({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth="1.5" />
      <path d="M2.5 10H17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 2.5C12 4.5 12.8 7 12.8 10C12.8 13 12 15.5 10 17.5C8 15.5 7.2 13 7.2 10C7.2 7 8 4.5 10 2.5Z" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconSun({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" stroke={color} strokeWidth="1.5" />
      <path d="M10 2V4M10 16V18M2 10H4M16 10H18M4.5 4.5L6 6M14 14L15.5 15.5M15.5 4.5L14 6M6 14L4.5 15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconMoon({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M16.5 12.5C15.7 15 13.2 16.8 10.3 16.5C6.9 16.1 4.2 13 4.5 9.3C4.7 6.7 6.4 4.5 8.9 3.8C7.9 5.8 8.3 8.2 10 9.9C11.7 11.6 14.1 12 16.5 12.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSignOut({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M12.5 3H6.5C5.4 3 4.5 3.9 4.5 5V15C4.5 16.1 5.4 17 6.5 17H12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 10H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 7L17 10L14 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IconMenu({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 5.5H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 10H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 14.5H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconEye({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M2 10C2 10 5 5 10 5C15 5 18 10 18 10C18 10 15 15 10 15C5 15 2 10 2 10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconEyeOff({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 3L17 17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.5 5.8C3.7 7 2 10 2 10C2 10 5 15 10 15C11.6 15 13 14.5 14.2 13.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 5.1C9.3 5 9.7 5 10 5C15 5 18 10 18 10C18 10 17.3 11.3 16 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconLock({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="4.5" y="8.5" width="11" height="8" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M7 8.5V6.5C7 4.8 8.3 3.5 10 3.5C11.7 3.5 13 4.8 13 6.5V8.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconUpload({ size = defaultSize, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 13V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 7.5L10 4L13.5 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 13.5V15C4 16.1 4.9 17 6 17H14C15.1 17 16 16.1 16 15V13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}