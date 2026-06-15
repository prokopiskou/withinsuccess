import LinkButton from './LinkButton'
import UTMCapture from '@/components/UTMCapture'

export default function LinksPage() {
  return (
    <main 
      className="min-h-screen flex flex-col items-center px-5 py-12"
      style={{ 
        background: 'linear-gradient(180deg, #FBF9F4 0%, #FFFFFF 60%)',
      }}
    >
      <UTMCapture />
      <div className="w-full max-w-sm">
        
        {/* Profile section */}
        <header className="text-center pt-4 pb-10">
          <div className="relative inline-block mb-7">
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-40"
              style={{ 
                backgroundColor: '#C9A96E',
                transform: 'scale(0.85)',
              }}
            />
            <img 
              src="/prokopis_about.webp" 
              alt="Προκόπης Κούκης"
              className="relative w-32 h-32 rounded-full object-cover border-[3px] border-white shadow-lg mx-auto"
              style={{ objectPosition: 'center 5%' }}
            />
            <div 
              className="absolute -bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
              style={{ backgroundColor: '#C9A96E' }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <p 
            className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-3"
            style={{ fontWeight: 500 }}
          >
            WithinSuccess
          </p>

          <h1 
            className="text-[26px] font-normal mb-5 leading-tight tracking-tight"
            style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}
          >
            Προκόπης Κούκης
          </h1>

          {/* Gold accent divider */}
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="h-px w-10" style={{ backgroundColor: '#E5DDD0' }} />
            <div 
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: '#C9A96E' }}
            />
            <div className="h-px w-10" style={{ backgroundColor: '#E5DDD0' }} />
          </div>
          
          <p 
            className="text-[15px] leading-relaxed max-w-[280px] mx-auto"
            style={{ 
              fontFamily: 'Georgia, serif', 
              color: '#52524A',
              fontStyle: 'italic',
            }}
          >
            Η ζωή αλλάζει όταν αλλάζει
            <br />
            <span 
              style={{ 
                color: '#1A1A1A',
                fontWeight: 500,
              }}
            >
              η εσωτερική ιστορία.
            </span>
          </p>
        </header>

        {/* Buttons */}
        <div className="space-y-3">
          <LinkButton
            href="/assessment"
            title="Within Assessment"
            subtitle="Δωρεάν · 3 λεπτά"
            symbol="✦"
            destination="assessment"
          />
          
          <LinkButton
            href="/insights"
            title="Σκέψεις & άρθρα"
            subtitle="Νέο άρθρο κάθε εβδομάδα"
            symbol="✎"
            destination="insights"
          />
          
          <LinkButton
            href="https://www.youtube.com/@Prokopiskoukis"
            title="YouTube"
            subtitle="Βίντεο & masterclasses"
            symbol="▶"
            destination="youtube"
          />
          
          <LinkButton
            href="/work"
            title="1-on-1 Coaching"
            subtitle="Προσωπική διαδικασία · με αίτηση"
            symbol="⊙"
            destination="coaching"
          />
        </div>

        {/* Footer */}
        <footer className="pt-12 pb-8">
          <div className="flex items-center justify-center gap-5 text-[11px] uppercase tracking-widest text-gray-400">
            <a 
              href="https://www.instagram.com/withinsuccess/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              Instagram
            </a>
            <span className="text-gray-200">·</span>
            <a 
              href="mailto:hello@withinsuccess.gr"
              className="hover:text-black transition-colors"
            >
              Email
            </a>
            <span className="text-gray-200">·</span>
            <a 
              href="https://withinsuccess.gr"
              className="hover:text-black transition-colors"
            >
              Site
            </a>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-6 tracking-wider">
            © {new Date().getFullYear()} WithinSuccess
          </p>
        </footer>
      </div>
    </main>
  )
}
