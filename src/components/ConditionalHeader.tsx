'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const LANDING_PAGE_PREFIXES = [
  '/63days',
  '/30days',
]

export default function ConditionalHeader() {
  const pathname = usePathname()

  const isLandingPage = LANDING_PAGE_PREFIXES.some(prefix => 
    pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (isLandingPage) {
    return null
  }

  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-center">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.png"
            alt="WithinSuccess"
            width={60}
            height={60}
            priority
            className="w-[50px] h-[50px] md:w-[60px] md:h-[60px]"
          />
          <span
            className="text-lg md:text-xl font-semibold tracking-tight text-black"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            WithinSuccess
          </span>
        </Link>
      </div>
    </header>
  )
}
