'use client'

import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

type Props = {
  href: string
  title: string
  subtitle?: string
  symbol?: string
  destination: string
}

export default function LinkButton({
  href,
  title,
  subtitle,
  symbol,
  destination,
}: Props) {
  const isExternal = href.startsWith('http://') || href.startsWith('https://')

  function handleClick() {
    trackEvent('links_click', { destination })
  }

  const className =
    'group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 transition-all hover:border-gray-200 hover:shadow-sm'

  const inner = (
    <>
      {symbol && (
        <span
          aria-hidden
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 text-base text-gray-500 transition-colors group-hover:bg-gray-100"
        >
          {symbol}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className="text-base font-semibold text-black"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {title}
        </span>
        {subtitle && (
          <span className="mt-0.5 text-xs uppercase tracking-wider text-gray-400">
            {subtitle}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500"
      >
        →
      </span>
    </>
  )

  if (isExternal) {
    return (
      <a
        href={href}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    )
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {inner}
    </Link>
  )
}
