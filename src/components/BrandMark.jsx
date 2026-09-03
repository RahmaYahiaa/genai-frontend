export default function BrandMark({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="7" fill="#1B4DA8" />
      <path
        d="M14 5L21 9.5V18.5L14 23L7 18.5V9.5L14 5Z"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="14" r="3" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}
