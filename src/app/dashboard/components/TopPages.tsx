'use client'

type Page = {
  pagePath: string
  pageTitle: string
  views: number
  users: number
  avgEngagementTime: number
  bounceRate: number
}

type Props = {
  pages: Page[]
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const min = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  return `${min}m ${sec}s`
}

function getPageCategory(path: string): { label: string; color: string; bg: string } {
  if (path === '/' || path === '') return { label: 'Home', color: '#525252', bg: '#F5F5F5' }
  if (path.startsWith('/63days')) return { label: '63 Days', color: '#8B7340', bg: '#FAF6EF' }
  if (path.startsWith('/30days')) return { label: '30 Days', color: '#3E5C76', bg: '#F0F4F8' }
  if (path.startsWith('/insights')) return { label: 'Insight', color: '#525252', bg: '#F5F5F5' }
  if (path.startsWith('/assessment')) return { label: 'Quiz', color: '#C9A96E', bg: '#FAF6EF' }
  if (path.startsWith('/work') || path.startsWith('/apply')) return { label: 'Work', color: '#1A1A1A', bg: '#FAFAFA' }
  return { label: 'Page', color: '#737373', bg: '#F5F5F5' }
}

export default function TopPages({ pages }: Props) {
  if (!pages || pages.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
        Δεν υπάρχουν δεδομένα σελίδων
      </div>
    )
  }

  const topPages = pages.slice(0, 10)
  const maxViews = Math.max(...topPages.map((p) => p.views), 1)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-baseline justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          Top 10 Pages
        </p>
        <p className="text-xs text-gray-400">
          {pages.reduce((sum, p) => sum + p.views, 0).toLocaleString('el-GR')} total views
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {topPages.map((p, idx) => {
          const cat = getPageCategory(p.pagePath)
          const widthPercent = (p.views / maxViews) * 100

          return (
            <div key={p.pagePath} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-baseline gap-3 min-w-0 flex-1">
                  <span className="text-xs text-gray-300 font-mono w-5 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                      <span
                        className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ color: cat.color, backgroundColor: cat.bg }}
                      >
                        {cat.label}
                      </span>
                      <p className="text-xs text-gray-400 truncate">
                        {p.pagePath}
                      </p>
                    </div>
                    <p className="text-sm font-medium truncate" style={{ fontFamily: 'Georgia, serif' }}>
                      {p.pageTitle.replace(' | WithinSuccess', '')}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-4 sm:gap-6 text-right flex-shrink-0">
                  <div>
                    <p className="text-sm font-semibold">
                      {p.views.toLocaleString('el-GR')}
                    </p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold">
                      {formatTime(p.avgEngagementTime)}
                    </p>
                    <p className="text-xs text-gray-400">avg time</p>
                  </div>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: cat.color,
                    opacity: 0.6,
                  }}
                />
              </div>

              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span>{p.users.toLocaleString('el-GR')} users</span>
                <span className="text-gray-300">·</span>
                <span>{(p.bounceRate * 100).toFixed(0)}% bounce</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
