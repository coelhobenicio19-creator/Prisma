export function PrismaMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className="prisma-mark"
    >
      <path
        d="M20 3 36 31 20 37 4 31 20 3Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="m20 3 6 25-6 9-6-9L20 3ZM4 31l22-3 10 3M14 28l6 9"
        stroke="currentColor"
        strokeWidth=".8"
        opacity=".65"
      />
      <circle cx="20" cy="3" r="1.5" fill="currentColor" />
    </svg>
  );
}
