import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMorphTransition } from '../context/MorphTransitionContext';
import HeroBackground from './HeroBackground';
import './Portfolio.css';

const API = 'http://localhost:5000';

export default function Portfolio() {
  const [year] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [exitingId, setExitingId] = useState(null);

  const navigate = useNavigate();
  const { navigateWithTransition } = useMorphTransition();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API}/api/projects`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to fetch projects", err);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    // Card spotlight follow-cursor
    const cards = document.querySelectorAll('.pf-project-card');
    const handlePointerMove = (c, e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    };
    const listeners = new Map();
    cards.forEach(c => {
      const listener = (e) => handlePointerMove(c, e);
      c.addEventListener('pointermove', listener);
      listeners.set(c, listener);
    });

    return () => {
      cards.forEach(c => {
        const listener = listeners.get(c);
        if (listener) c.removeEventListener('pointermove', listener);
      });
    };
  }, [projects, filter]);

  const matchesCategory = (p, catVal) => {
    if (!p.cat) return false;
    return Array.isArray(p.cat) ? p.cat.includes(catVal) : p.cat === catVal;
  };

  const catLabels = {
    web: 'Web Platform',
    mobile: 'Mobile App',
    uiux: 'UI/UX Design',
    ecommerce: 'E-commerce',
    ai: 'AI & Automation',
    branding: 'Branding',
    marketing: 'Digital Marketing'
  };

  const getCategoryLabel = (cat) => {
    if (Array.isArray(cat)) {
      return cat.map(c => catLabels[c] || c).join(' / ');
    }
    return catLabels[cat] || cat;
  };

  const filteredProjects = filter === 'all' ? projects : projects.filter(p => matchesCategory(p, filter));

  const handleCardClick = useCallback((e, project) => {
    e.preventDefault();

    const imgSrc = project.images && project.images.length > 0 ? (project.images[0].startsWith('data:') ? project.images[0] : `${API}${project.images[0]}`) : '/placeholder.jpg';

    // Mark exiting sibling cards
    setExitingId(project._id);

    // Assign view-transition-name to the clicked card's image dynamically
    const clickedCard = e.currentTarget;
    const cardImg = clickedCard.querySelector('img');
    const cardTitle = clickedCard.querySelector('h3');

    if (cardImg) {
      cardImg.style.viewTransitionName = 'project-hero';
    }
    if (cardTitle) {
      cardTitle.style.viewTransitionName = 'project-title';
    }

    // Small delay to let exit animations start, then trigger view transition
    requestAnimationFrame(() => {
      navigateWithTransition(navigate, `/portfolio/${project._id}`, {
        id: project._id,
        imgSrc,
        title: project.title,
      });
    });
  }, [navigate, navigateWithTransition]);

  return (
    <>
      <HeroBackground />
      <div className="grid-overlay"></div>

      <header className="nav">
        <div className="wrap nav-in">
          <Link className="brand" to="/">
            <img src="/mark-white.png" alt="Ceynova logo" />
            <span><b>CEYNOVA</b><span>Digital Solutions</span></span>
          </Link>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} id="navLinks">
            <Link to="/#about" onClick={closeMenu}>About</Link>
            <Link to="/#services" onClick={closeMenu}>Services</Link>
            <Link to="/portfolio" className="active" onClick={closeMenu}>Work</Link>
            <Link to="/#follow" onClick={closeMenu}>Connect</Link>
            <Link to="/#contact" onClick={closeMenu}>Contact</Link>
            <Link className="btn btn-primary" to="/#follow" onClick={closeMenu}>Grow With Us</Link>
          </nav>
          <button className="menu-toggle" id="menuToggle" aria-label="Toggle menu" onClick={toggleMenu}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      <section className="pf-hero">
        <div className="wrap">
          <div className="pf-crumb"><Link to="/">Home</Link> <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" strokeWidth="2" fill="none" stroke="currentColor" /></svg> <span>Portfolio</span></div>
          <div><span className="eyebrow">Our Work</span></div>
          <h1><span className="grad">Projects that deliver results</span></h1>
          <p>A selection of work across web, mobile, design, and intelligent systems. Every project is built around one goal — moving the business forward.</p>
        </div>
      </section>

      <div className="wrap">
        <div className="filters" id="filters">
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All <span className="n">{projects.length}</span></button>
          <button className={`chip ${filter === 'web' ? 'active' : ''}`} onClick={() => setFilter('web')}>Web <span className="n">{projects.filter(p => matchesCategory(p, 'web')).length}</span></button>
          <button className={`chip ${filter === 'mobile' ? 'active' : ''}`} onClick={() => setFilter('mobile')}>Mobile <span className="n">{projects.filter(p => matchesCategory(p, 'mobile')).length}</span></button>
          <button className={`chip ${filter === 'uiux' ? 'active' : ''}`} onClick={() => setFilter('uiux')}>UI/UX <span className="n">{projects.filter(p => matchesCategory(p, 'uiux')).length}</span></button>
          <button className={`chip ${filter === 'ecommerce' ? 'active' : ''}`} onClick={() => setFilter('ecommerce')}>E-commerce <span className="n">{projects.filter(p => matchesCategory(p, 'ecommerce')).length}</span></button>
          <button className={`chip ${filter === 'ai' ? 'active' : ''}`} onClick={() => setFilter('ai')}>AI &amp; Automation <span className="n">{projects.filter(p => matchesCategory(p, 'ai')).length}</span></button>
          <button className={`chip ${filter === 'branding' ? 'active' : ''}`} onClick={() => setFilter('branding')}>Branding <span className="n">{projects.filter(p => matchesCategory(p, 'branding')).length}</span></button>
          <button className={`chip ${filter === 'marketing' ? 'active' : ''}`} onClick={() => setFilter('marketing')}>Marketing <span className="n">{projects.filter(p => matchesCategory(p, 'marketing')).length}</span></button>
        </div>
      </div>

      <section className="pf-section">
        <div className="wrap">
          <div className="pf-grid" id="grid">
            {filteredProjects.map((p, i) => (
              <a
                key={p._id}
                className={`pf-project-card${exitingId && exitingId !== p._id ? ' morph-exit' : ''}${exitingId === p._id ? ' morph-active' : ''}`}
                href={`/portfolio/${p._id}`}
                onClick={(e) => handleCardClick(e, p)}
                style={{ animationDelay: `${i * 0.05}s` }}
                data-project-id={p._id}
              >
                <img src={p.images && p.images.length > 0 ? (p.images[0].startsWith('data:') ? p.images[0] : `${API}${p.images[0]}`) : '/placeholder.jpg'} alt={p.title} />
                <span className="yr">{p.yr}</span>
                <span className="go"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="#fff" strokeWidth="2.2" /></svg></span>
                <div className="ov">
                  <span className="cat">{getCategoryLabel(p.cat)}</span>
                  <h3>{p.title}</h3>
                  <p className="desc">{p.desc}</p>
                  <div className="tags">
                    {p.tags.map(t => <i key={t}>{t}</i>)}
                  </div>
                </div>
              </a>
            ))}
          </div>
          {filteredProjects.length === 0 && (
            <div className="empty" id="empty" style={{ display: 'block' }}>No projects in this category yet — check back soon.</div>
          )}
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="cta-band">
            <div className="glow"></div>
            <h2>Have a project <span className="grad">in mind?</span></h2>
            <p>Let's build something your business will be proud of. Tell us what you're working on and we'll take it from there.</p>
            <div className="row">
              <Link className="btn btn-primary" to="/#follow">Start a Project
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
              <Link className="btn btn-ghost" to="/#contact">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="site">
        <div className="wrap foot-in">
          <Link to="/"><img src="/logo-white.png" alt="Ceynova Digital Solutions" /></Link>
          <p>© <span>{year}</span> Ceynova Digital Solutions. All rights reserved.</p>
          <div className="fsoc">
            <a href="https://www.instagram.com/ceynova_digital" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 4.38a5.3 5.3 0 100 10.6 5.3 5.3 0 000-10.6zm0 1.62a3.68 3.68 0 110 7.36 3.68 3.68 0 010-7.36zm5.5-1.18a1.24 1.24 0 110 2.48 1.24 1.24 0 010-2.48z" fill="#fff" /></svg></a>
            <a href="https://www.facebook.com/share/1Ej6yHwqNx/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" fill="#fff" /></svg></a>
          </div>
        </div>
      </footer>
    </>
  );
}
