import { memo } from "react";

interface SchoolEmblemProps {
  schoolId: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const SchoolEmblem = memo(function SchoolEmblem({
  schoolId,
  size = "sm",
  className = "",
}: SchoolEmblemProps) {
  const isLincoln = schoolId === "lincoln" || schoolId.includes("lincoln");

  const sizeClasses = {
    xs: "size-4 text-[9px] rounded-md",
    sm: "size-6 text-[11px] rounded-lg",
    md: "size-8 text-sm rounded-xl",
    lg: "size-10 text-base rounded-xl",
    xl: "size-14 text-2xl rounded-2xl",
  }[size];

  if (isLincoln) {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center font-black tracking-tight select-none shadow-xs transition-transform ${sizeClasses} bg-gradient-to-br from-blue-700 via-blue-900 to-indigo-950 text-white border border-blue-400/40 ring-1 ring-blue-500/20 ${className}`}
        aria-label="Lincoln High School"
        title="Lincoln High School (Railsplitters)"
      >
        <span className="font-serif font-black tracking-wider leading-none drop-shadow-xs">L</span>
      </div>
    );
  }

  // East High School (Scarlets)
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center font-black tracking-tight select-none shadow-xs transition-transform ${sizeClasses} bg-gradient-to-br from-rose-600 via-red-800 to-rose-950 text-white border border-rose-400/40 ring-1 ring-rose-500/20 ${className}`}
      aria-label="East High School"
      title="East High School (Scarlets)"
    >
      <span className="font-serif font-black tracking-wider leading-none drop-shadow-xs">E</span>
    </div>
  );
});
