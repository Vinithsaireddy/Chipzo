import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, UserRound, Menu, X, Store } from 'lucide-react'
import ProfilePanel from './ProfilePanel'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Navbar({ onNavigate, currentPage = 'home', activeCategory = '', cartCount = 0 }) {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
        navigate(`/shop?search=${encodeURIComponent(q)}`)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const lenis = window.__lenis
    if (isMobileMenuOpen) {
      if (lenis) lenis.stop()
      else document.body.style.overflow = 'hidden'
    } else {
      if (lenis) lenis.start()
      else document.body.style.overflow = ''
    }
    return () => {
      if (lenis) lenis.start()
      else document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleNavClick = (page, category) => {
    setIsMobileMenuOpen(false)
    onNavigate?.(page, category)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const q = searchQuery.trim()
      if (q) navigate(`/shop?search=${encodeURIComponent(q)}`)
      else navigate('/shop')
    }
  }

  const handleSearchBarClick = (e) => {
    if (location.pathname !== '/shop') {
      const q = searchQuery.trim()
      if (q) navigate(`/shop?search=${encodeURIComponent(q)}`)
      else navigate('/shop')
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
              className="group relative inline-flex flex-col border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-4 py-1.5 font-black uppercase tracking-[-0.05em] text-[color:var(--chipzo-primary)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="text-2xl leading-none sm:text-3xl">Chipzo</span>
              <span className="absolute -bottom-2 -right-3 border-2 border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-[color:var(--chipzo-lime)] transition-colors group-hover:bg-[color:var(--chipzo-primary)] group-hover:text-[color:var(--chipzo-paper)]">
                SYS.ON
              </span>
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

            {/* Shop — Mobile Only */}
            <button
              type="button"
              aria-label="Shop"
              onClick={() => handleNavClick('shop')}
              className="group relative flex h-9 w-9 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] text-[color:var(--chipzo-paper)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all sm:h-11 sm:w-11 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-[color:var(--chipzo-ink)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] lg:hidden"
            >
              <Store strokeWidth={2.5} className="h-[18px] w-[18px] transition-transform group-hover:scale-110 sm:h-[22px] sm:w-[22px]" />
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

        {/* Mobile layout: two rows */}
        <div className="relative z-10 mx-auto flex w-full flex-col gap-2.5 px-2.5 sm:px-6 lg:hidden">
          {/* Row 1: Logo + Right Actions */}
          <div className="flex w-full items-center justify-between">
            {/* Logo */}
            <div className={`origin-left transition-all duration-500 ${scrolled ? 'scale-[0.92]' : 'scale-100'}`}>
              <button
                type="button"
                onClick={() => handleNavClick('home')}
                className="group relative inline-flex flex-col border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] px-3 py-1 font-black uppercase tracking-[-0.05em] text-[color:var(--chipzo-primary)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <span className="text-xl leading-none sm:text-2xl">Chipzo</span>
                <span className="absolute -bottom-2 -right-3 border-2 border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-ink)] px-1 py-0.5 text-[7px] font-bold tracking-widest text-[color:var(--chipzo-lime)] transition-colors group-hover:bg-[color:var(--chipzo-primary)] group-hover:text-[color:var(--chipzo-paper)]">
                  SYS.ON
                </span>
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

              {/* Hamburger — Mobile Only */}
              <button
                type="button"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="group flex h-9 w-9 items-center justify-center border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all sm:h-11 sm:w-11 hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                {isMobileMenuOpen
                  ? <X strokeWidth={2.5} className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
                  : <Menu strokeWidth={2.5} className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
                }
              </button>
            </div>
          </div>

          {/* Row 2: Search Bar — Mobile */}
          <div onClick={handleSearchBarClick} className="group flex w-full items-stretch border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 focus-within:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-within:translate-x-[2px] focus-within:translate-y-[2px] focus-within:border-[color:var(--chipzo-primary)]">
            <span className="flex items-center justify-center bg-[color:var(--chipzo-ink)] px-2.5 border-r-[3px] border-[color:var(--chipzo-ink)] text-[9px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-lime)] select-none">
              SEARCH &gt;
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="SEARCH PARTS OR SPECS..."
              className="flex-1 bg-transparent px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-ink)] placeholder:text-[color:var(--chipzo-muted)] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSearchQuery('') }}
                className="flex items-center justify-center px-1.5 text-[color:var(--chipzo-muted)] hover:text-[color:var(--chipzo-primary)] transition-colors cursor-pointer"
              >
                <X size={12} strokeWidth={3} />
              </button>
            )}
            <span className="flex items-center justify-center px-2 border-l-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)]">
              <Search size={12} strokeWidth={2.5} className="text-[color:var(--chipzo-muted)]" />
            </span>
          </div>
        </div>
      </header>

      {/* ====================== MOBILE MENU OVERLAY ====================== */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[80] bg-[color:var(--chipzo-ink)]/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Slide-in Panel */}
      <div
        className={`fixed right-0 top-0 z-[90] h-full w-[85vw] max-w-xs border-l-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)] shadow-[-8px_0_0_rgba(0,0,0,1)] transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b-[3px] border-[color:var(--chipzo-ink)] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse bg-[color:var(--chipzo-lime)] border border-[color:var(--chipzo-ink)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--chipzo-muted)]">NAV SYSTEM</span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] transition-all hover:bg-[color:var(--chipzo-lime)] active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-5">
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.22em] text-[color:var(--chipzo-muted)]">Quick Access</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); onNavigate?.('cart') }}
              className="relative flex flex-col items-center justify-center gap-2 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)] py-4 text-[10px] font-black uppercase tracking-[0.1em] shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-[color:var(--chipzo-ink)] hover:text-[color:var(--chipzo-paper)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <ShoppingCart size={18} strokeWidth={2.5} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center border-[1.5px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-lime)] text-[8px] font-black text-[color:var(--chipzo-ink)]">
                  {cartCount}
                </span>
              )}
            </button>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); onNavigate?.('profile') }}
                className="flex flex-col items-center justify-center gap-2 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] py-4 text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-paper)] shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-[color:var(--chipzo-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <UserRound size={18} strokeWidth={2.5} />
                Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); onNavigate?.('login') }}
                className="flex flex-col items-center justify-center gap-2 border-[2px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] py-4 text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--chipzo-paper)] shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-[color:var(--chipzo-ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <UserRound size={18} strokeWidth={2.5} />
                Account
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t-[2px] border-dashed border-[color:var(--chipzo-rule)]" />

        {/* Footer Status */}
        <div className="absolute bottom-0 left-0 w-full border-t-[2px] border-dashed border-[color:var(--chipzo-rule)] px-5 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[color:var(--chipzo-muted)]">
            CHIPZO_IND // SYS.ON // BUILD_882
          </p>
        </div>
      </div>

      <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onNavigate={onNavigate} />
    </div>
  )
}
