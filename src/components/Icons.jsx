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

  // ── Instructor Workspace module icons (ported from the GenAIDesign system) ──

export function IconChevronRight({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M8 5L13 10L8 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconChevronLeft({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M12 5L7 10L12 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconArrowRight({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 10H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 5L16 10L11 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconArrowLeft({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M16 10H4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 5L4 10L9 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconCheck({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 10L8 14L16 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconAnchor({ size = 12, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="3" r="1.5" stroke={color} strokeWidth="1.2" />
      <path d="M6 4.5V9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M3 7C3 7 3.5 9 6 9C8.5 9 9 7 9 7" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 6H8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>;
}

export function IconWarning({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M9.11 3.94L2.2 15.5C2.07 15.72 2 15.97 2 16.22C2 17.2 2.8 18 3.78 18H16.22C17.2 18 18 17.2 18 16.22C18 15.97 17.93 15.72 17.8 15.5L10.89 3.94C10.64 3.51 10.13 3.24 9.58 3.24C9.03 3.24 8.52 3.51 8.27 3.94" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 8V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.75" fill={color} />
    </svg>;
}

export function IconSparkle({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2L11.5 8L17 9.5L11.5 11L10 17L8.5 11L3 9.5L8.5 8L10 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 3L16.5 5L18 5.5L16.5 6L16 8L15.5 6L14 5.5L15.5 5L16 3Z" stroke={color} strokeWidth="1" strokeLinejoin="round" />
    </svg>;
}

export function IconBookOpen({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 5C10 5 7 4 4 4.5V15.5C7 15 10 16 10 16V5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 5C10 5 13 4 16 4.5V15.5C13 15 10 16 10 16V5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>;
}

export function IconLogoBrand({ size = 28 }) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="#1B4DA8" />
      <path d="M14 5L21 9.5V18.5L14 23L7 18.5V9.5L14 5Z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <circle cx="14" cy="14" r="3" fill="white" fillOpacity="0.9" />
    </svg>;
}

export function IconSend({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M17 3L3 9.5L9 11L11 17L17 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 11L13 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

export function IconSendRtl({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ transform: "scaleX(-1)" }}>
      <path d="M17 3L3 9.5L9 11L11 17L17 3Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 11L13 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

export function IconFilter({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 5H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 10H14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 15H11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

export function IconTrendUp({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 14L8 9L11 12L17 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 5H17V9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconInfo({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth="1.5" />
      <path d="M10 9V14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.5" r="0.75" fill={color} />
    </svg>;
}

export function IconClipboard({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="4" y="4" width="12" height="13" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M7.5 4V3.5C7.5 2.95 7.95 2.5 8.5 2.5H11.5C12.05 2.5 12.5 2.95 12.5 3.5V4" stroke={color} strokeWidth="1.5" />
      <path d="M7 8.5H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 11.5H11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

export function IconPlus({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 4V16M4 10H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

export function IconX({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5.5 5.5L14.5 14.5M14.5 5.5L5.5 14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

export function IconPencil({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M13.5 3.5L16.5 6.5L7.5 15.5L4 16.5L5 13L13.5 3.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 5L15 8" stroke={color} strokeWidth="1.5" />
    </svg>;
}

export function IconBan({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth="1.5" />
      <path d="M4.8 4.8L15.2 15.2" stroke={color} strokeWidth="1.5" />
    </svg>;
}

export function IconReply({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M8 4L4 8L8 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8H12C14.2 8 16 9.8 16 12V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconHistory({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 8C4.8 5.7 7.2 4 10 4C13.3 4 16 6.7 16 10C16 13.3 13.3 16 10 16C7.4 16 5.2 14.3 4.4 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 4V8H8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 7.5V10L12 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconDoubleCheck({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M2.5 10.5L6 14L12.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12L11.5 13.5L17.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconShield({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5L16 5V10C16 13.6 13.4 16.6 10 17.5C6.6 16.6 4 13.6 4 10V5L10 2.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 10L9.3 11.8L12.5 8.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconGear({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.6" stroke={color} strokeWidth="1.5" />
      <path d="M10 2.8V4.6M10 15.4V17.2M17.2 10H15.4M4.6 10H2.8M15.1 4.9L13.8 6.2M6.2 13.8L4.9 15.1M15.1 15.1L13.8 13.8M6.2 6.2L4.9 4.9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

export function IconImageAttach({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="1.5" />
      <circle cx="7.5" cy="8" r="1.4" stroke={color} strokeWidth="1.3" />
      <path d="M3.5 14L8 10L11 13L13.5 10.5L16.5 13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconClock({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={color} strokeWidth="1.5" />
      <path d="M10 5.8V10L13 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconChevronDown({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 8L10 13L15 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconTrash({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M4 6H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.5 6V4.8C6.5 4.1 7.1 3.5 7.8 3.5H12.2C12.9 3.5 13.5 4.1 13.5 4.8V6" stroke={color} strokeWidth="1.5" />
      <path d="M5.5 6L6.2 15.2C6.25 15.95 6.9 16.5 7.65 16.5H12.35C13.1 16.5 13.75 15.95 13.8 15.2L14.5 6" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.5 9V13.5M11.5 9V13.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>;
}

export function IconRefresh({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M16 10C16 13.3 13.3 16 10 16C6.7 16 4 13.3 4 10C4 6.7 6.7 4 10 4C12.4 4 14.5 5.4 15.5 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15.8 3.8V7.5H12.1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconUsers({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="7" r="2.8" stroke={color} strokeWidth="1.5" />
      <path d="M2.8 16C3.4 13.5 5.2 12 7.5 12C9.8 12 11.6 13.5 12.2 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 4.6C14.3 4.9 15.3 6 15.3 7.4C15.3 8.8 14.3 9.9 13 10.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.2 12.3C15.8 12.8 16.9 14.1 17.3 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>;
}

export function IconDoc({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 3.5H12L15.5 7V16.5H5V3.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 3.5V7H15.5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 10.5H12.5M7.5 13H11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>;
}

export function IconArrowUpRight({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M6 14L14 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 6H14V11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}

export function IconInbox({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M3 11L5 4H15L17 11V16H3V11Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 11H7C7 12.7 8.3 14 10 14C11.7 14 13 12.7 13 11H17" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>;
}

export function IconDownload({ size = defaultSize, color = "currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>;
}