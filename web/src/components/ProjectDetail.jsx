import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import HeroBackground from './HeroBackground';
import './ProjectDetail.css';

const API = 'http://localhost:5000';

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
  if (Array.isArray(cat)) return cat.map(c => catLabels[c] || c).join(' / ');
  return catLabels[cat] || cat;
};

const getImageSrc = (img) => {
  if (!img) return '/placeholder.jpg';
  return img.startsWith('data:') ? img : `${API}${img}`;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [year] = useState(new Date().getFullYear());
  const [menuOpen, setMenuOpen] = useState(false);

  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Carousel
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef(0);
  const scrollStart = useRef(0);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  // Fetch project + all projects for prev/next nav
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projRes, allRes] = await Promise.all([
          fetch(`${API}/api/projects/${id}`),
          fetch(`${API}/api/projects`)
        ]);
        if (!projRes.ok) throw new Error('Project not found');
        const projData = await projRes.json();
        const allData = allRes.ok ? await allRes.json() : [];
        setProject(projData);
        setAllProjects(allData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);



  // Scroll-triggered reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.pd-reveal, .pd-info-card, .pd-feature-card, .pd-gallery-item, .pd-tech-pill');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [project]);

  // Carousel drag support
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const onDown = (e) => {
      isDragging.current = true;
      dragStart.current = e.pageX || e.touches?.[0]?.pageX || 0;
      scrollStart.current = el.scrollLeft;
      el.style.scrollSnapType = 'none';
      el.style.cursor = 'grabbing';
    };
    const onMove = (e) => {
      if (!isDragging.current) return;
      const x = e.pageX || e.touches?.[0]?.pageX || 0;
      el.scrollLeft = scrollStart.current - (x - dragStart.current);
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      el.style.scrollSnapType = 'x mandatory';
      el.style.cursor = 'grab';
      // Snap to nearest slide & update index
      requestAnimationFrame(() => {
        const items = el.querySelectorAll('.pd-carousel-slide');
        let closest = 0;
        let minDist = Infinity;
        items.forEach((item, i) => {
          const dist = Math.abs(item.offsetLeft - el.scrollLeft - el.offsetWidth * 0.05);
          if (dist < minDist) { minDist = dist; closest = i; }
        });
        setCarouselIndex(closest);
      });
    };

    // Scroll event to update active dot
    const onScroll = () => {
      if (isDragging.current) return;
      const items = el.querySelectorAll('.pd-carousel-slide');
      let closest = 0;
      let minDist = Infinity;
      items.forEach((item, i) => {
        const dist = Math.abs(item.offsetLeft - el.scrollLeft - el.offsetWidth * 0.05);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setCarouselIndex(closest);
    };

    el.addEventListener('mousedown', onDown);
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseup', onUp);
    el.addEventListener('mouseleave', onUp);
    el.addEventListener('touchstart', onDown, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onUp);
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseup', onUp);
      el.removeEventListener('mouseleave', onUp);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onUp);
      el.removeEventListener('scroll', onScroll);
    };
  }, [project]);

  // Scroll carousel to index
  const scrollToSlide = useCallback((index) => {
    const el = carouselRef.current;
    if (!el) return;
    const slide = el.querySelectorAll('.pd-carousel-slide')[index];
    if (slide) {
      const targetLeft = slide.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
      el.scrollTo({ left: targetLeft, behavior: 'smooth' });
      setCarouselIndex(index);
    }
  }, []);

  // Auto-slide carousel (pauses on hover / drag)
  const autoPlayPaused = useRef(false);
  useEffect(() => {
    if (!project?.images || project.images.length <= 1) return;
    const el = carouselRef.current;

    const pause = () => { autoPlayPaused.current = true; };
    const resume = () => { autoPlayPaused.current = false; };

    if (el) {
      el.addEventListener('mouseenter', pause);
      el.addEventListener('mouseleave', resume);
      el.addEventListener('touchstart', pause, { passive: true });
      el.addEventListener('touchend', resume);
    }

    const interval = setInterval(() => {
      if (autoPlayPaused.current || isDragging.current || lightboxOpen) return;
      setCarouselIndex(prev => {
        const next = prev >= project.images.length - 1 ? 0 : prev + 1;
        const track = carouselRef.current;
        if (track) {
          const slide = track.querySelectorAll('.pd-carousel-slide')[next];
          if (slide) {
            const targetLeft = slide.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
            track.scrollTo({ left: targetLeft, behavior: 'smooth' });
          }
        }
        return next;
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      if (el) {
        el.removeEventListener('mouseenter', pause);
        el.removeEventListener('mouseleave', resume);
        el.removeEventListener('touchstart', pause);
        el.removeEventListener('touchend', resume);
      }
    };
  }, [project, lightboxOpen]);

  // Cursor spotlight on feature cards
  useEffect(() => {
    const cards = document.querySelectorAll('.pd-feature-card');
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
  }, [project]);

  // Lightbox keyboard nav
  const handleLightboxKey = useCallback((e) => {
    if (!lightboxOpen || !project) return;
    if (e.key === 'Escape') setLightboxOpen(false);
    if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % project.images.length);
    if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + project.images.length) % project.images.length);
  }, [lightboxOpen, project]);

  useEffect(() => {
    window.addEventListener('keydown', handleLightboxKey);
    return () => window.removeEventListener('keydown', handleLightboxKey);
  }, [handleLightboxKey]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen]);

  // Prev/Next projects
  const currentIndex = allProjects.findIndex(p => p._id === id);
  const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
  const nextProject = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;

  /* ======== Render states ======== */

  if (loading) {
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
          </div>
        </header>
        <div className="pd-loading">
          <div className="pd-spinner"></div>
          <p>Loading project…</p>
        </div>
      </>
    );
  }

  if (error || !project) {
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
          </div>
        </header>
        <div className="pd-error">
          <h2>Project not found</h2>
          <p>{error || "The project you're looking for doesn't exist or has been removed."}</p>
          <Link className="btn btn-primary" to="/portfolio">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            Back to Portfolio
          </Link>
        </div>
      </>
    );
  }

  const heroImage = project.images && project.images.length > 0 ? getImageSrc(project.images[0]) : null;

  return (
    <>
      <HeroBackground />
      <div className="grid-overlay"></div>

      {/* Navigation */}
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

      {/* Floating back button */}
      <Link to="/portfolio" className="pd-back">
        <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        Portfolio
      </Link>

      {/* ===== HERO (text only) ===== */}
      <section className="pd-hero pd-hero--noimg">
        <div className="pd-hero-content">
          <div className="pd-crumb">
            <Link to="/">Home</Link>
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
            <Link to="/portfolio">Portfolio</Link>
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
            <span>{project.title}</span>
          </div>
          <div className="pd-hero-badges">
            <span className="pd-badge">{getCategoryLabel(project.cat)}</span>
            <span className="pd-badge">{project.yr}</span>
            {project.featured && <span className="pd-badge featured">★ Featured</span>}
          </div>
          <h1 style={{ viewTransitionName: 'project-title' }}><span className="grad">{project.title}</span></h1>
          <p className="pd-hero-desc">{project.desc}</p>
        </div>
      </section>

      {/* ===== INFO BAR ===== */}
      <div className="pd-info-bar">
        <div className="pd-info-card" style={{ transitionDelay: '0s' }}>
          <div className="pd-info-label">
            <svg viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
            Category
          </div>
          <div className="pd-info-value">{getCategoryLabel(project.cat)}</div>
        </div>
        <div className="pd-info-card" style={{ transitionDelay: '.08s' }}>
          <div className="pd-info-label">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Year
          </div>
          <div className="pd-info-value">{project.yr}</div>
        </div>
        <div className="pd-info-card" style={{ transitionDelay: '.16s' }}>
          <div className="pd-info-label">
            <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            Tech Stack
          </div>
          <div className="pd-info-tags">
            {project.tags && project.tags.map(t => <i key={t}>{t}</i>)}
          </div>
        </div>
        {project.images && (
          <div className="pd-info-card" style={{ transitionDelay: '.24s' }}>
            <div className="pd-info-label">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              Gallery
            </div>
            <div className="pd-info-value">{project.images.length} image{project.images.length !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* ===== CHALLENGE ===== */}
      {project.problem && (
        <section className="pd-section">
          <div className="pd-reveal">
            <div className="pd-section-header">
              <div className="pd-section-eyebrow">The Challenge</div>
              <h2 className="pd-section-title">
                Understanding <span className="grad">the problem</span>
              </h2>
            </div>
            <div className="pd-challenge">
              <div className="pd-challenge-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <p>{project.problem}</p>
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURES ===== */}
      {project.features && project.features.length > 0 && (
        <>
          {project.problem && <div className="pd-divider"><hr /></div>}
          <section className="pd-section">
            <div className="pd-reveal">
              <div className="pd-section-header">
                <div className="pd-section-eyebrow">Key Features</div>
                <h2 className="pd-section-title">
                  What we <span className="grad">built</span>
                </h2>
              </div>
            </div>
            <div className="pd-features-grid">
              {project.features.map((f, i) => (
                <div
                  key={i}
                  className="pd-feature-card"
                  style={{ transitionDelay: `${i * 0.08}s` }}
                >
                  <div className="pd-feature-num">{String(i + 1).padStart(2, '0')}</div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ===== GALLERY CAROUSEL ===== */}
      {project.images && project.images.length > 0 && (
        <>
          <div className="pd-divider"><hr /></div>
          <section className="pd-section">
            <div className="pd-reveal">
              <div className="pd-section-header">
                <div className="pd-section-eyebrow">Gallery</div>
                <h2 className="pd-section-title">
                  Project <span className="grad">visuals</span>
                </h2>
              </div>
            </div>
            <div className="pd-carousel-wrap pd-reveal">
              {/* Prev arrow */}
              {project.images.length > 1 && (
                <button
                  className="pd-carousel-arrow pd-carousel-arrow-prev"
                  aria-label="Previous image"
                  onClick={() => scrollToSlide(Math.max(0, carouselIndex - 1))}
                  disabled={carouselIndex === 0}
                >
                  <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              )}
              {/* Track */}
              <div className="pd-carousel-track" ref={carouselRef}>
                {project.images.map((img, i) => (
                  <div
                    key={i}
                    className={`pd-carousel-slide ${i === carouselIndex ? 'active' : ''}`}
                    onClick={() => { if (!isDragging.current) { setLightboxIndex(i); setLightboxOpen(true); } }}
                  >
                    <img
                      src={getImageSrc(img)}
                      alt={`${project.title} screenshot ${i + 1}`}
                      draggable="false"
                      style={i === 0 ? { viewTransitionName: 'project-hero' } : {}}
                    />
                    <div className="pd-gallery-zoom">
                      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                    </div>
                  </div>
                ))}
              </div>
              {/* Next arrow */}
              {project.images.length > 1 && (
                <button
                  className="pd-carousel-arrow pd-carousel-arrow-next"
                  aria-label="Next image"
                  onClick={() => scrollToSlide(Math.min(project.images.length - 1, carouselIndex + 1))}
                  disabled={carouselIndex === project.images.length - 1}
                >
                  <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              )}
            </div>
            {/* Dot indicators */}
            {project.images.length > 1 && (
              <div className="pd-carousel-dots">
                {project.images.map((_, i) => (
                  <button
                    key={i}
                    className={`pd-carousel-dot ${i === carouselIndex ? 'active' : ''}`}
                    aria-label={`Go to image ${i + 1}`}
                    onClick={() => scrollToSlide(i)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ===== TECH STACK (Infinite Scrolling Ribbon) ===== */}
      {project.tags && project.tags.length > 0 && (
        <>
          <div className="pd-divider"><hr /></div>
          <section className="pd-section pd-tech-ribbon-section">
            <div className="pd-reveal">
              <div className="pd-section-header">
                <div className="pd-section-eyebrow">Tech Stack</div>
                <h2 className="pd-section-title">
                  Engineered <span className="grad">with</span>
                </h2>
              </div>
            </div>

            <div className="pd-ribbon-container pd-reveal">
              {(() => {
                const repeatCount = Math.max(30, Math.ceil(80 / project.tags.length));
                const renderPill = (t, key) => {
                  const name = t.toLowerCase().trim();
                  let color = 'var(--cyan)';
                  if (name.includes('react') || name.includes('next')) color = '#61dafb';
                  else if (name.includes('node') || name.includes('express')) color = '#339933';
                  else if (name.includes('mongo') || name.includes('sql') || name.includes('db') || name.includes('data') || name.includes('firebase')) color = '#47a248';
                  else if (name.includes('tailwind') || name.includes('css') || name.includes('sass')) color = '#38b2ac';
                  else if (name.includes('js') || name.includes('javascript') || name.includes('ts') || name.includes('typescript')) color = '#f7df1e';
                  else if (name.includes('aws') || name.includes('cloud') || name.includes('server')) color = '#ff9900';
                  else if (name.includes('figma') || name.includes('design') || name.includes('ui') || name.includes('ux')) color = '#f24e1e';
                  else if (name.includes('html')) color = '#e34f26';
                  else if (name.includes('python') || name.includes('django') || name.includes('flask') || name.includes('ai')) color = '#3776ab';
                  else if (name.includes('mobile') || name.includes('ios') || name.includes('android') || name.includes('flutter')) color = '#a4c639';
                  else if (name.includes('git') || name.includes('docker') || name.includes('devops')) color = '#f14e32';

                  const getSymbol = () => {
                    if (name.includes('react') || name.includes('next')) {
                      return (
                        <svg viewBox="-11.5 -10.23174 23 20.46348" width="30" height="30">
                          <circle cx="0" cy="0" r="2.05" fill={color} />
                          <g stroke={color} strokeWidth="1.2" fill="none">
                            <ellipse rx="11" ry="4.2" />
                            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                          </g>
                        </svg>
                      );
                    }
                    if (name.includes('html')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 2l1.5 17L12 21l6.5-2L20 2H4z" />
                          <path d="M8 8h8l-.5 5.5-3.5 1-3.5-1-.25-2.5H12" />
                        </svg>
                      );
                    }
                    if (name.includes('css') || name.includes('tailwind') || name.includes('sass')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 6c-2.5 0-4.5 1.5-6 4 1.5 2.5 3.5 4 6 4s4.5-1.5 6-4c-1.5-2.5-3.5-4-6-4z" />
                          <path d="M6 14c-1.5 1.5-2 3-2 4 1.5 0 3-.5 4.5-2" />
                          <path d="M18 14c1.5 1.5 2 3 2 4-1.5 0-3-.5-4.5-2" />
                        </svg>
                      );
                    }
                    if (name.includes('js') || name.includes('javascript') || name.includes('ts') || name.includes('typescript')) {
                      const label = (name.includes('ts') || name.includes('typescript')) ? 'TS' : 'JS';
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28">
                          <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke={color} strokeWidth="2" />
                          <text x="12" y="16.5" fill={color} fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">{label}</text>
                        </svg>
                      );
                    }
                    if (name.includes('node') || name.includes('express')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
                          <path d="M12 12v10" />
                          <path d="M12 12L3 7" />
                          <path d="M12 12l9-5" />
                        </svg>
                      );
                    }
                    if (name.includes('mongo') || name.includes('sql') || name.includes('db') || name.includes('data') || name.includes('firebase')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <ellipse cx="12" cy="5" rx="9" ry="3" />
                          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                        </svg>
                      );
                    }
                    if (name.includes('aws') || name.includes('cloud') || name.includes('server')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
                        </svg>
                      );
                    }
                    if (name.includes('figma') || name.includes('design') || name.includes('ui') || name.includes('ux')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19l7-7 3 3-7 7-3-3z" />
                          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                          <path d="M2 2l7.586 7.586" />
                          <circle cx="11" cy="11" r="2" />
                        </svg>
                      );
                    }
                    if (name.includes('python') || name.includes('django') || name.includes('flask') || name.includes('ai')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2c-3.5 0-6 2-6 5v3h6v2H5c-2.5 0-4 1.5-4 4s1.5 4 4 4h2v2c0 3 2.5 5 6 5s6-2 6-5v-3h-6v-2h7c2.5 0 4-1.5 4-4s-1.5-4-4-4h-2V7c0-3-2.5-5-6-5z" />
                          <circle cx="9" cy="6" r="1" fill={color} />
                          <circle cx="15" cy="18" r="1" fill={color} />
                        </svg>
                      );
                    }
                    if (name.includes('mobile') || name.includes('ios') || name.includes('android') || name.includes('flutter') || name.includes('app')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                        </svg>
                      );
                    }
                    if (name.includes('git') || name.includes('docker') || name.includes('devops')) {
                      return (
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="6" cy="18" r="3" />
                          <line x1="6" y1="9" x2="6" y2="15" />
                          <circle cx="18" cy="9" r="3" />
                          <path d="M18 12v3a3 3 0 01-3 3h-3" />
                        </svg>
                      );
                    }
                    return (
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    );
                  };

                  return (
                    <span key={key} className="pd-ribbon-pill" style={{ '--tech-color': color }} title={t}>
                      <div className="pd-ribbon-icon">
                        {getSymbol()}
                      </div>
                    </span>
                  );
                };

                return (
                  <>
                    {/* Row 1: Scrolling Left */}
                    <div className="pd-marquee-row pd-marquee-left">
                      <div className="pd-marquee-track">
                        {[...Array(repeatCount)].flatMap(() => project.tags).map((t, i) => renderPill(t, `left-1-${i}`))}
                      </div>
                      <div className="pd-marquee-track" aria-hidden="true">
                        {[...Array(repeatCount)].flatMap(() => project.tags).map((t, i) => renderPill(t, `left-2-${i}`))}
                      </div>
                    </div>

                    {/* Row 2: Scrolling Right */}
                    <div className="pd-marquee-row pd-marquee-right">
                      <div className="pd-marquee-track">
                        {[...Array(repeatCount)].flatMap(() => [...project.tags].reverse()).map((t, i) => renderPill(t, `right-1-${i}`))}
                      </div>
                      <div className="pd-marquee-track" aria-hidden="true">
                        {[...Array(repeatCount)].flatMap(() => [...project.tags].reverse()).map((t, i) => renderPill(t, `right-2-${i}`))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </section>
        </>
      )}

      {/* ===== CTA ===== */}
      <section>
        <div className="wrap">
          <div className="cta-band">
            <div className="glow"></div>
            <h2>Have a similar <span className="grad">project?</span></h2>
            <p>Let's build something your business will be proud of. Tell us what you're working on and we'll take it from there.</p>
            <div className="row">
              <Link className="btn btn-primary" to="/#follow">
                Start a Project
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link className="btn btn-ghost" to="/#contact">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PREV / NEXT NAV ===== */}
      {(prevProject || nextProject) && (
        <section style={{ paddingTop: 60 }}>
          <div className="pd-project-nav">
            {prevProject ? (
              <Link to={`/portfolio/${prevProject._id}`} className="pd-nav-card prev">
                <div className="pd-nav-label">
                  <svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                  Previous Project
                </div>
                <div className="pd-nav-title">{prevProject.title}</div>
              </Link>
            ) : <div />}
            {nextProject ? (
              <Link to={`/portfolio/${nextProject._id}`} className="pd-nav-card next">
                <div className="pd-nav-label">
                  Next Project
                  <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </div>
                <div className="pd-nav-title">{nextProject.title}</div>
              </Link>
            ) : <div />}
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="site">
        <div className="wrap foot-in">
          <Link to="/"><img src="/logo-white.png" alt="Ceynova Digital Solutions" /></Link>
          <p>© <span>{year}</span> Ceynova Digital Solutions. All rights reserved.</p>
          <div className="fsoc">
            <a href="https://www.instagram.com/ceynova_digital" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 4.38a5.3 5.3 0 100 10.6 5.3 5.3 0 000-10.6zm0 1.62a3.68 3.68 0 110 7.36 3.68 3.68 0 010-7.36zm5.5-1.18a1.24 1.24 0 110 2.48 1.24 1.24 0 010-2.48z" fill="#fff" /></svg>
            </a>
            <a href="https://www.facebook.com/share/1Ej6yHwqNx/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" fill="#fff" /></svg>
            </a>
          </div>
        </div>
      </footer>

      {/* ===== LIGHTBOX ===== */}
      <div className={`pd-lightbox ${lightboxOpen ? 'open' : ''}`} onClick={() => setLightboxOpen(false)}>
        <button className="pd-lightbox-close" onClick={() => setLightboxOpen(false)} aria-label="Close lightbox">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        {project.images && project.images.length > 1 && (
          <>
            <button
              className="pd-lightbox-nav pd-lightbox-prev"
              aria-label="Previous image"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + project.images.length) % project.images.length); }}
            >
              <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              className="pd-lightbox-nav pd-lightbox-next"
              aria-label="Next image"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % project.images.length); }}
            >
              <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </>
        )}
        {project.images && project.images[lightboxIndex] && (
          <img
            src={getImageSrc(project.images[lightboxIndex])}
            alt={`${project.title} ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {project.images && project.images.length > 1 && (
          <div className="pd-lightbox-counter">
            {lightboxIndex + 1} / {project.images.length}
          </div>
        )}
      </div>
    </>
  );
}
