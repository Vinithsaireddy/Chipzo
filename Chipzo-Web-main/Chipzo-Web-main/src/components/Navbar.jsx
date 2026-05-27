import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, UserRound, X, Store } from 'lucide-react'
import ProfilePanel from './ProfilePanel'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Navbar({ onNavigate, currentPage = 'home', activeCategory = '', cartCount = 0 }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const hideMobileBottomSearch = currentPage === 'cart' || currentPage === 'checkout'
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(() => location.state?.mobileSearchExpanded || false)
  const [scrolled, setScrolled] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const desktopSearchRef = useRef(null)
  const mobileExpandedSearchRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState(() => {
    if (location.pathname === '/shop') {
      return new URLSearchParams(location.search).get('search') || ''
    }
    return ''
  })

  // Debounced dynamic search — updates URL as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchQuery.trim()
      const currentParam = new URLSearchParams(location.search).get('search') || ''
      if (q === currentParam) return

      if (location.pathname === '/shop') {
        const params = new URLSearchParams(location.search)
        if (q) params.set('search', q)
        else params.delete('search')
        const qs = params.toString()
        navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true })
      } else if (q) {
        navigate(`/shop?search=${encodeURIComponent(q)}`, { state: { mobileSearchExpanded: true } })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Synchronize search input state with URL query parameters
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('search') || ''
    if (location.pathname === '/shop') {
      if (q !== searchQuery) {
        setSearchQuery(q)
      }
    } else {
      if (searchQuery !== '') {
        setSearchQuery('')
      }
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (location.pathname !== '/shop' || !location.state?.focusSearch) return

    const focusVisibleSearch = () => {
      const target = [desktopSearchRef.current, mobileExpandedSearchRef.current].find(
        (input) => input && input.offsetParent !== null
      )

      if (!target) return

      target.focus()
      const length = target.value.length
      target.setSelectionRange(length, length)
    }

    const timer = window.setTimeout(focusVisibleSearch, 0)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })

    return () => window.clearTimeout(timer)
  }, [location.pathname, location.search, location.state, navigate])

  const handleNavClick = (page, category) => {
    onNavigate?.(page, category)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const q = searchQuery.trim()
      if (q) navigate(`/shop?search=${encodeURIComponent(q)}`, { state: { focusSearch: true, mobileSearchExpanded: true } })
      else navigate('/shop', { state: { focusSearch: true, mobileSearchExpanded: true } })
    }
  }

  const handleSearchBarClick = (e) => {
    if (location.pathname !== '/shop') {
      const q = searchQuery.trim()
      if (q) navigate(`/shop?search=${encodeURIComponent(q)}`, { state: { focusSearch: true, mobileSearchExpanded: true } })
      else navigate('/shop', { state: { focusSearch: true, mobileSearchExpanded: true } })
    } else {
      const el = e.currentTarget.querySelector('input')
      el?.focus()
    }
  }

  return (
    <div className="fixed left-0 top-0 z-50 flex w-full justify-center pt-4 sm:pt-6">
      <header
        className={[
          'pointer-events-auto w-[92%] max-w-[88rem] overflow-hidden border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)]',
          'transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]',
          scrolled ? 'py-2.5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : 'py-3.5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
        ].join(' ')}
      >
        {/* Desktop layout: single row */}
        <div className="relative z-10 mx-auto hidden w-full items-center justify-between gap-4 px-2.5 sm:px-6 lg:px-8 lg:flex">
          {/* Logo */}
          <div className={`origin-left transition-all duration-500 ${scrolled ? 'scale-[0.92]' : 'scale-100'}`}>
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="group relative inline-flex items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-3 py-1.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              {/* Subtle Tech Background Layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                {/* Blurred gradient blobs */}
                <div className="absolute -inset-10 bg-[radial-gradient(circle_at_30%_30%,rgba(0,194,255,0.12)_0%,rgba(145,53,255,0.08)_50%,transparent_100%)] opacity-45 group-hover:scale-110 transition-transform duration-700" />
                {/* Tech grid texture */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:8px_8px]" />
                {/* Animated circuit accent line */}
                <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[linear-gradient(90deg,transparent_0%,rgba(0,194,255,0.15)_50%,transparent_100%)] opacity-40 animate-[pulse_2s_infinite]" />
              </div>

              <img src="/logo.png" alt="Chipzo Logo" className="relative z-10 h-8 object-contain sm:h-9" />
            </button>
          </div>

          {/* Search Bar — Desktop */}
          <div onClick={handleSearchBarClick} className="flex flex-1 items-center justify-center max-w-2xl cursor-pointer">
            <div className="group flex w-full items-stretch border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 focus-within:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:border-[color:var(--chipzo-primary)] focus-within:ring-2 focus-within:ring-[color:var(--chipzo-lime)]/20 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]">
              <span className="flex items-center justify-center bg-[color:var(--chipzo-ink)] px-3 sm:px-4 border-r-[3px] border-[color:var(--chipzo-ink)] text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-lime)] select-none">
                SEARCH &gt;
              </span>
              <input
                type="text"
                ref={desktopSearchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="SEARCH PARTS OR SPECS..."
                className="flex-1 bg-transparent px-3 sm:px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-ink)] placeholder:text-[color:var(--chipzo-muted)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSearchQuery('') }}
                  className="flex items-center justify-center px-2 text-[color:var(--chipzo-muted)] hover:text-[color:var(--chipzo-primary)] transition-colors cursor-pointer"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}
              <span className="flex items-center justify-center px-3 border-l-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)]">
                <Search size={14} strokeWidth={2.5} className="text-[color:var(--chipzo-muted)] transition-colors group-hover:text-[color:var(--chipzo-primary)]" />
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart */}
            <button
              type="button"
              aria-label="Cart"
              onClick={() => handleNavClick('cart')}
              className="group relative flex h-9 w-9 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all sm:h-11 sm:w-11 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <ShoppingCart strokeWidth={2.5} className="h-[18px] w-[18px] transition-transform group-hover:scale-110 sm:h-[22px] sm:w-[22px]" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] text-[10px] font-black text-[color:var(--chipzo-ink)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:scale-110">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Account — Desktop Only */}
            <button
              type="button"
              aria-label="Account"
              onClick={() => {
                if (isLoggedIn) {
                  handleNavClick('profile');
                } else {
                  handleNavClick('login');
                }
              }}
              className="group relative hidden lg:flex h-9 w-9 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-paper)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all sm:h-11 sm:w-11 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[color:var(--chipzo-ink)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <UserRound strokeWidth={2.5} className="h-[18px] w-[18px] transition-transform group-hover:scale-110 sm:h-[22px] sm:w-[22px]" />
            </button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="relative z-10 mx-auto flex w-full items-center justify-between gap-2 px-2.5 sm:px-6 lg:hidden">
          <div className="flex w-full items-center justify-between gap-2">
            {/* Logo */}
            <div className={`origin-left transition-all duration-500 ${scrolled ? 'scale-[0.92]' : 'scale-100'}`}>
              <button
                type="button"
                onClick={() => handleNavClick('home')}
                className="group relative inline-flex items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-2.5 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                {/* Subtle Tech Background Layer */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                  {/* Blurred gradient blobs */}
                  <div className="absolute -inset-10 bg-[radial-gradient(circle_at_30%_30%,rgba(0,194,255,0.12)_0%,rgba(145,53,255,0.08)_50%,transparent_100%)] opacity-45 group-hover:scale-110 transition-transform duration-700" />
                  {/* Tech grid texture */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:8px_8px]" />
                  {/* Animated circuit accent line */}
                  <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[linear-gradient(90deg,transparent_0%,rgba(0,194,255,0.15)_50%,transparent_100%)] opacity-40 animate-[pulse_2s_infinite]" />
                </div>

                <img src="/logo.png" alt="Chipzo Logo" className="relative z-10 h-6 object-contain sm:h-7" />
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Cart */}
              <button
                type="button"
                aria-label="Cart"
                onClick={() => handleNavClick('cart')}
                className="group relative flex h-9 w-9 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all sm:h-11 sm:w-11 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[color:var(--chipzo-primary)] hover:text-[color:var(--chipzo-paper)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <ShoppingCart strokeWidth={2.5} className="h-[18px] w-[18px] transition-transform group-hover:scale-110 sm:h-[22px] sm:w-[22px]" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] text-[10px] font-black text-[color:var(--chipzo-ink)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:scale-110">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Auth */}
              {isLoggedIn ? (
                <button
                  type="button"
                  aria-label="Profile"
                  onClick={() => handleNavClick('profile')}
                  className="group relative flex h-9 w-9 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all sm:h-11 sm:w-11 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <UserRound strokeWidth={2.5} className="h-[18px] w-[18px] transition-transform group-hover:scale-110 sm:h-[22px] sm:w-[22px]" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Sign in"
                  onClick={() => handleNavClick('login')}
                  className="group relative flex h-9 w-9 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all sm:h-11 sm:w-11 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <UserRound strokeWidth={2.5} className="h-[18px] w-[18px] transition-transform group-hover:scale-110 sm:h-[22px] sm:w-[22px]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onNavigate={onNavigate} />

      {!hideMobileBottomSearch && (
        <>
          {!isMobileSearchExpanded ? (
            /* Compact Collapsed Search Icon Button - Floating on the Bottom Right */
            <div className="fixed bottom-24 right-6 z-40 flex justify-end pointer-events-none lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileSearchExpanded(true)}
                className={`pointer-events-auto flex h-12 w-12 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] shadow-[4px_4px_0_var(--chipzo-ink)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--chipzo-ink)] cursor-pointer ${
                  location.pathname === '/shop'
                    ? 'bg-[color:var(--chipzo-ink)]'
                    : 'bg-[color:var(--chipzo-surface)]'
                }`}
                aria-label="Search Catalog"
              >
                <Search 
                  size={22} 
                  strokeWidth={3} 
                  className={
                    location.pathname === '/shop'
                      ? 'text-[color:var(--chipzo-paper)]'
                      : 'text-[color:var(--chipzo-ink)]'
                  } 
                />
              </button>
            </div>
          ) : (
            /* Full Expanded Search Bar - Centered Horizontally */
            <div className="fixed bottom-24 left-0 right-0 z-40 flex w-full justify-center pointer-events-none lg:hidden">
              <div
                onClick={handleSearchBarClick}
                className="pointer-events-auto w-[92%] max-w-md group flex items-stretch border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 focus-within:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[2px] focus-within:translate-y-[2px]"
              >
                <span className="flex items-center justify-center bg-[color:var(--chipzo-ink)] px-3 border-r-[3px] border-[color:var(--chipzo-ink)] text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-lime)] select-none">
                  SEARCH &gt;
                </span>
                <input
                  type="text"
                  autoFocus
                  ref={mobileExpandedSearchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="SEARCH PARTS OR SPECS..."
                  className="flex-1 bg-transparent px-3 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-ink)] placeholder:text-[color:var(--chipzo-muted)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (searchQuery) {
                      setSearchQuery('')
                    } else {
                      setIsMobileSearchExpanded(false)
                    }
                  }}
                  className="flex items-center justify-center px-3 border-l-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] text-[color:var(--chipzo-muted)] hover:text-red-500 transition-colors cursor-pointer"
                  aria-label="Clear or Collapse"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
