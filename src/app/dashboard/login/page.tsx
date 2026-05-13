'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginFormInner() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/dashboard/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (data.success) {
        router.push(redirectTo)
        router.refresh()
      } else {
        setError(data.error || 'Λάθος password')
        setLoading(false)
      }
    } catch {
      setError('Σφάλμα σύνδεσης')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="text-center mb-10">
          <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            WithinSuccess
          </h1>
          <p className="text-xs text-gray-400 tracking-widest uppercase mt-2">
            Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1" style={{ backgroundColor: '#C9A96E' }} />
          
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50"
                placeholder="••••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-black text-white py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Σύνδεση...' : 'Σύνδεση'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Authorized access only
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <LoginFormInner />
    </Suspense>
  )
}
