'use client'

import { trackArticleToAssessment } from '@/lib/analytics'

type Props = {
  articleSlug: string
}

export default function AssessmentCTA({ articleSlug }: Props) {
  return (
    <div className="mt-16 p-8 bg-gray-50 rounded-2xl text-center">
      <p className="text-sm font-medium tracking-widest text-gray-400 uppercase mb-3">Επόμενο βήμα</p>
      <h3 className="text-2xl font-semibold mb-4" style={{fontFamily: 'Georgia, serif'}}>
        Ανακάλυψε πού βρίσκεσαι τώρα.
      </h3>
      <p className="text-gray-500 mb-6 text-sm">Κάνε το Within Assessment — δωρεάν. 3 λεπτά.</p>
      <a 
        href="/assessment" 
        onClick={() => trackArticleToAssessment(articleSlug)}
        className="inline-block bg-black text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        Κάνε το assessment →
      </a>
    </div>
  )
}
