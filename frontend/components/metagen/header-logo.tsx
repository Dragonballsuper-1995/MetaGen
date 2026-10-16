import * as React from "react"

interface HeaderLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function HeaderLogo({ className = "h-full w-auto", ...props }: HeaderLogoProps) {
  return (
    <svg
      viewBox="0 0 520 80"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MetaGen"
      {...props}
    >
      <g transform="translate(10, 16)">
        {/* "META" (Heavy Weight: r=4.5, adapts to Light/Dark Mode) */}
        <g className="fill-foreground">
          {/* M */}
          <g transform="translate(0, 0)">
            <circle cx="0" cy="0" r="4.5" />
            <circle cx="0" cy="12" r="4.5" />
            <circle cx="0" cy="24" r="4.5" />
            <circle cx="0" cy="36" r="4.5" />
            <circle cx="0" cy="48" r="4.5" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="24" cy="24" r="4.5" />
            <circle cx="36" cy="12" r="4.5" />
            <circle cx="48" cy="0" r="4.5" />
            <circle cx="48" cy="12" r="4.5" />
            <circle cx="48" cy="24" r="4.5" />
            <circle cx="48" cy="36" r="4.5" />
            <circle cx="48" cy="48" r="4.5" />
          </g>
          {/* E */}
          <g transform="translate(72, 0)">
            <circle cx="0" cy="0" r="4.5" />
            <circle cx="0" cy="12" r="4.5" />
            <circle cx="0" cy="24" r="4.5" />
            <circle cx="0" cy="36" r="4.5" />
            <circle cx="0" cy="48" r="4.5" />
            <circle cx="12" cy="0" r="4.5" />
            <circle cx="24" cy="0" r="4.5" />
            <circle cx="36" cy="0" r="4.5" />
            <circle cx="48" cy="0" r="4.5" />
            <circle cx="12" cy="24" r="4.5" />
            <circle cx="24" cy="24" r="4.5" />
            <circle cx="36" cy="24" r="4.5" />
            <circle cx="12" cy="48" r="4.5" />
            <circle cx="24" cy="48" r="4.5" />
            <circle cx="36" cy="48" r="4.5" />
            <circle cx="48" cy="48" r="4.5" />
          </g>
          {/* T */}
          <g transform="translate(144, 0)">
            <circle cx="0" cy="0" r="4.5" />
            <circle cx="12" cy="0" r="4.5" />
            <circle cx="24" cy="0" r="4.5" />
            <circle cx="36" cy="0" r="4.5" />
            <circle cx="48" cy="0" r="4.5" />
            <circle cx="24" cy="12" r="4.5" />
            <circle cx="24" cy="24" r="4.5" />
            <circle cx="24" cy="36" r="4.5" />
            <circle cx="24" cy="48" r="4.5" />
          </g>
          {/* A */}
          <g transform="translate(216, 0)">
            <circle cx="12" cy="0" r="4.5" />
            <circle cx="24" cy="0" r="4.5" />
            <circle cx="36" cy="0" r="4.5" />
            <circle cx="0" cy="12" r="4.5" />
            <circle cx="48" cy="12" r="4.5" />
            <circle cx="0" cy="24" r="4.5" />
            <circle cx="12" cy="24" r="4.5" />
            <circle cx="24" cy="24" r="4.5" />
            <circle cx="36" cy="24" r="4.5" />
            <circle cx="48" cy="24" r="4.5" />
            <circle cx="0" cy="36" r="4.5" />
            <circle cx="48" cy="36" r="4.5" />
            <circle cx="0" cy="48" r="4.5" />
            <circle cx="48" cy="48" r="4.5" />
          </g>
        </g>

        {/* "GEN" (Light Weight: r=2.5, Accent Blue) */}
        <g className="fill-[#0084FF]">
          {/* G */}
          <g transform="translate(300, 0)">
            <circle cx="12" cy="0" r="2.5" />
            <circle cx="24" cy="0" r="2.5" />
            <circle cx="36" cy="0" r="2.5" />
            <circle cx="48" cy="0" r="2.5" />
            <circle cx="0" cy="12" r="2.5" />
            <circle cx="0" cy="24" r="2.5" />
            <circle cx="24" cy="24" r="2.5" />
            <circle cx="36" cy="24" r="2.5" />
            <circle cx="48" cy="24" r="2.5" />
            <circle cx="0" cy="36" r="2.5" />
            <circle cx="48" cy="36" r="2.5" />
            <circle cx="12" cy="48" r="2.5" />
            <circle cx="24" cy="48" r="2.5" />
            <circle cx="36" cy="48" r="2.5" />
            <circle cx="48" cy="48" r="2.5" />
          </g>
          {/* E */}
          <g transform="translate(372, 0)">
            <circle cx="0" cy="0" r="2.5" />
            <circle cx="0" cy="12" r="2.5" />
            <circle cx="0" cy="24" r="2.5" />
            <circle cx="0" cy="36" r="2.5" />
            <circle cx="0" cy="48" r="2.5" />
            <circle cx="12" cy="0" r="2.5" />
            <circle cx="24" cy="0" r="2.5" />
            <circle cx="36" cy="0" r="2.5" />
            <circle cx="48" cy="0" r="2.5" />
            <circle cx="12" cy="24" r="2.5" />
            <circle cx="24" cy="24" r="2.5" />
            <circle cx="36" cy="24" r="2.5" />
            <circle cx="12" cy="48" r="2.5" />
            <circle cx="24" cy="48" r="2.5" />
            <circle cx="36" cy="48" r="2.5" />
            <circle cx="48" cy="48" r="2.5" />
          </g>
          {/* N */}
          <g transform="translate(444, 0)">
            <circle cx="0" cy="0" r="2.5" />
            <circle cx="0" cy="12" r="2.5" />
            <circle cx="0" cy="24" r="2.5" />
            <circle cx="0" cy="36" r="2.5" />
            <circle cx="0" cy="48" r="2.5" />
            <circle cx="12" cy="12" r="2.5" />
            <circle cx="24" cy="24" r="2.5" />
            <circle cx="36" cy="36" r="2.5" />
            <circle cx="48" cy="0" r="2.5" />
            <circle cx="48" cy="12" r="2.5" />
            <circle cx="48" cy="24" r="2.5" />
            <circle cx="48" cy="36" r="2.5" />
            <circle cx="48" cy="48" r="2.5" />
          </g>
        </g>
      </g>
    </svg>
  )
}
