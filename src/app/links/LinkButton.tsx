'use client'

import { trackEvent } from '@/lib/analytics'

type Props = {
  href: string
  title: string
  subtitle?: string
  symbol?: string
  destination: string
}

export default function LinkButton({ href, title, subtitle, symbol = '✦', destination }: Props) {
  const isExternal = href.startsWith('http://') || href.startsWith('https://')

  function handleClick() {
    trackEvent('links_button_click', { destination })
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="group block w-full bg-white rounded-xl px-5 py-4 transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98]"
      style={{
        border: '1px solid #EFE9DD',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03), 0 0 0 0 rgba(201, 169, 110, 0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(201, 169, 110, 0.2)'
        e.currentTarget.style.borderColor = '#C9A96E'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03), 0 0 0 0 rgba(201, 169, 110, 0)'
        e.currentTarget.style.borderColor = '#EFE9DD'
      }}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{ 
            backgroundColor: '#FBF6EC',
            border: '1px solid #F0E6D2',
          }}
        >
          <span 
            className="text-[17px] leading-none"
            style={{ 
              color: '#C9A96E', 
              fontFamily: 'Georgia, serif',
            }}
          >
            {symbol}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <p 
            className="text-[15px] font-normal leading-tight tracking-tight"
            style={{ 
              fontFamily: 'Georgia, serif',
              color: '#1A1A1A',
            }}
          >
            {title}
          </p>
          {subtitle && (
            <p 
              className="text-[12px] mt-1 truncate"
              style={{ 
                color: '#8E8B82',
                letterSpacing: '0.01em',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        <svg 
          className="w-3.5 h-3.5 transition-all duration-300 group-hover:translate-x-1 flex-shrink-0"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: '#C9A96E' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  )
}
