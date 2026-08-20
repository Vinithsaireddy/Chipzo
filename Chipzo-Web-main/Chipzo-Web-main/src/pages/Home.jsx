import SmoothScroll from '../components/SmoothScroll.jsx'
import Navbar from '../components/Navbar.jsx'
import HeroScrollExperience from '../components/HeroScrollExperience.jsx'
import CategoryShowcase from '../components/CategoryShowcase.jsx'
import KitsSection from '../components/KitsSection.jsx'
import HowItWorks from '../components/HowItWorks.jsx'
import RoboticsSection from '../components/RoboticsSection.jsx'
import Footer from '../components/Footer.jsx'

export default function Home({ onNavigate, activeCategory, cartCount, onAddToCart }) {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[color:var(--chipzo-paper)] text-[color:var(--chipzo-ink)]">
        <Navbar onNavigate={onNavigate} currentPage="home" activeCategory={activeCategory} cartCount={cartCount} />
        <main>
          <HeroScrollExperience />
          <section id="shop">
            <CategoryShowcase onNavigate={onNavigate} />
          </section>
          <KitsSection onNavigate={onNavigate} onAddToCart={onAddToCart} />
          <HowItWorks />
          <RoboticsSection />
        </main>
        <Footer />
      </div>
    </SmoothScroll>
  )
}
