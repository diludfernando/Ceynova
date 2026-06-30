import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import HeroBackground from './HeroBackground';
import { 
  SiReact, SiHtml5, SiTailwindcss, SiJavascript, SiTypescript, 
  SiNodedotjs, SiMongodb, SiFirebase, 
  SiFigma, SiPython, SiFlutter, SiGit, SiDocker 
} from 'react-icons/si';
import { FaDatabase, FaMobileAlt, FaCode, FaCss3Alt, FaAws } from 'react-icons/fa';
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
                  let type = 'default';

                  if (name.includes('react') || name.includes('next')) { color = '#61dafb'; type = 'react'; }
                  else if (name.includes('node') || name.includes('express')) { color = '#339933'; type = 'node'; }
                  else if (name.includes('mongo')) { color = '#47a248'; type = 'mongo'; }
                  else if (name.includes('firebase')) { color = '#ffca28'; type = 'firebase'; }
                  else if (name.includes('sql') || name.includes('db') || name.includes('data')) { color = '#47a248'; type = 'db'; }
                  else if (name.includes('tailwind')) { color = '#06b6d4'; type = 'tailwind'; }
                  else if (name.includes('css') || name.includes('sass')) { color = '#1572B6'; type = 'css'; }
                  else if (name.includes('ts') || name.includes('typescript')) { color = '#3178c6'; type = 'ts'; }
                  else if (name.includes('js') || name.includes('javascript')) { color = '#f7df1e'; type = 'js'; }
                  else if (name.includes('aws') || name.includes('cloud') || name.includes('server')) { color = '#ff9900'; type = 'aws'; }
                  else if (name.includes('figma') || name.includes('design') || name.includes('ui') || name.includes('ux')) { color = '#F24E1E'; type = 'figma'; }
                  else if (name.includes('html')) { color = '#E34F26'; type = 'html'; }
                  else if (name.includes('python') || name.includes('django') || name.includes('flask') || name.includes('ai')) { color = '#3776AB'; type = 'python'; }
                  else if (name.includes('flutter')) { color = '#02569B'; type = 'flutter'; }
                  else if (name.includes('mobile') || name.includes('ios') || name.includes('android')) { color = '#a4c639'; type = 'mobile'; }
                  else if (name.includes('docker')) { color = '#2496ED'; type = 'docker'; }
                  else if (name.includes('git') || name.includes('devops')) { color = '#F05032'; type = 'git'; }

                  const getSymbol = () => {
                    const props = { size: 26, color: color };
                    switch (type) {
                      case 'react': return <SiReact {...props} />;
                      case 'node': return <SiNodedotjs {...props} />;
                      case 'mongo': return <SiMongodb {...props} />;
                      case 'firebase': return <SiFirebase {...props} />;
                      case 'db': return <FaDatabase {...props} />;
                      case 'tailwind': return <SiTailwindcss {...props} />;
                      case 'css': return <FaCss3Alt {...props} />;
                      case 'ts': return <SiTypescript {...props} />;
                      case 'js': return <SiJavascript {...props} />;
                      case 'aws': return <FaAws {...props} />;
                      case 'figma': return <SiFigma {...props} />;
                      case 'html': return <SiHtml5 {...props} />;
                      case 'python': return <SiPython {...props} />;
                      case 'flutter': return <SiFlutter {...props} />;
                      case 'mobile': return <FaMobileAlt {...props} />;
                      case 'docker': return <SiDocker {...props} />;
                      case 'git': return <SiGit {...props} />;
                      default: return <FaCode {...props} />;
                    }
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
      <section style={{ paddingBottom: '80px' }}>
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
