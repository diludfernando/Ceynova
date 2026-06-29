import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMorphTransition } from '../context/MorphTransitionContext';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  const year = new Date().getFullYear();

  const { transitionData, clearTransition } = useMorphTransition();
  const arrivedViaMorph = transitionData && transitionData.id === id;

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        } else {
          setError("Project not found");
        }
      } catch (err) {
        console.error("Failed to fetch project", err);
        setError("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  // Clear transition data after mount
  useEffect(() => {
    if (arrivedViaMorph) {
      const timer = setTimeout(() => clearTransition(), 800);
      return () => clearTimeout(timer);
    }
  }, [arrivedViaMorph, clearTransition]);

  useEffect(() => {
    // Card spotlight follow-cursor
    const cards = document.querySelectorAll('.pd-card');
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

  if (loading) {
    return (
      <div className="pd-loading">
        <div className="spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="pd-error-container">
        <h2>Oops!</h2>
        <p>{error || "Project details could not be found."}</p>
        <Link to="/portfolio" className="btn btn-primary">Back to Portfolio</Link>
      </div>
    );
  }

  // Enrich project with realistic fallback data if not present in DB
  const categories = Array.isArray(project.cat) ? project.cat : [project.cat];
  const clientName = project.client || `${project.title.split(' ')[0]} Solutions`;
  const problem = project.problem || `Prior to this collaboration, the client struggled with modernizing their workflow. Their legacy systems were highly fragmented, resulting in significant delays, high maintenance costs, and a suboptimal user experience. They needed an integrated, scalable, and responsive digital solution to unify their operations, optimize performance, and engage their users more effectively.`;

  const features = project.features || [
    {
      title: "Scalable Architecture",
      desc: "Designed to handle heavy user traffic and transactions seamlessly with optimized load times and high availability."
    },
    {
      title: "Intelligent UX & Design",
      desc: "An intuitive, user-centric interface focused on maximizing user engagement, retention, and smooth navigation."
    },
    {
      title: "Real-time Monitoring & Sync",
      desc: "Instant data synchronization and status updates across devices to keep users and administrators perfectly aligned."
    },
    {
      title: "Advanced Data Security",
      desc: "Fully encrypted communications and secure user authorization protocols, ensuring complete protection of sensitive data."
    }
  ];

  const techStack = project.tags && project.tags.length > 0 ? project.tags : ['React', 'Node.js', 'MongoDB', 'Express', 'CSS3'];
  const coverImage = project.images && project.images.length > 0 ? (project.images[0].startsWith('data:') ? project.images[0] : `${API}${project.images[0]}`) : '/placeholder.jpg';
  const additionalImages = project.images && project.images.length > 1 ? project.images.slice(1) : [];

  // Stagger class helper — only stagger when arriving via morph transition
  const stagger = (n) => arrivedViaMorph ? `morph-stagger morph-stagger-${n}` : '';
  const slideIn = (n) => arrivedViaMorph ? `morph-slide-in morph-slide-in-${n}` : '';

  return (
    <>
      <div className="aurora"><div className="blob a"></div><div className="blob b"></div><div className="blob c"></div></div>
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

      {/* Hero Section */}
      <section
        className="pd-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(3, 7, 15, 0.4) 0%, rgba(3, 7, 15, 0.95) 100%), url(${coverImage})`,
          viewTransitionName: 'project-hero'
        }}
      >
        <div className="wrap pd-hero-content">
          <div className={`pf-crumb ${slideIn(1)}`}>
            <Link to="/">Home</Link>
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" strokeWidth="2" fill="none" stroke="currentColor" /></svg>
            <Link to="/portfolio">Portfolio</Link>
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" strokeWidth="2" fill="none" stroke="currentColor" /></svg>
            <span>{project.title}</span>
          </div>

          <div className={`pd-badge-list ${slideIn(2)}`}>
            {categories.map(c => (
              <span key={c} className="pd-badge">{catLabels[c] || c}</span>
            ))}
          </div>

          <h1 className="pd-title" style={{ viewTransitionName: 'project-title' }}>{project.title}</h1>
          <p className={`pd-tagline ${slideIn(3)}`}>{project.desc}</p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="pd-content-section">
        <div className="wrap pd-grid">

          {/* Left Column: Problem & Key Features */}
          <div className="pd-main-col">
            <div className={`pd-card pd-problem-card ${stagger(1)}`}>
              <h2 className="pd-section-title">The Problem</h2>
              <p className="pd-problem-text">{problem}</p>
            </div>

            <div className={`pd-card pd-features-card ${stagger(2)}`}>
              <h2 className="pd-section-title">Key Features</h2>
              <div className="pd-features-list">
                {features.map((feat, index) => (
                  <div key={index} className="pd-feature-item">
                    <div className="pd-feature-icon-wrapper">
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="pd-feature-details">
                      <h3>{feat.title}</h3>
                      <p>{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {additionalImages.length > 0 && (
              <div className={`pd-gallery-section ${stagger(3)}`}>
                <h2 className="pd-section-title">Project Gallery</h2>
                <div className="pd-gallery-grid">
                  {additionalImages.map((img, index) => (
                    <div key={index} className="pd-gallery-item" onClick={() => setLightboxImg(img)}>
                      <motion.img 
                        layoutId={`lightbox-${img}`}
                        src={img.startsWith('data:') ? img : `${API}${img}`} 
                        alt={`${project.title} screenshot ${index + 1}`} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Project Details & Tech Stack */}
          <div className="pd-side-col">
            <div className={`pd-card pd-details-card ${stagger(3)}`}>
              <h3 className="pd-side-title">Project Details</h3>
              <ul className="pd-details-list">
                <li>
                  <span className="pd-detail-label">Client</span>
                  <span className="pd-detail-value">{clientName}</span>
                </li>
                <li>
                  <span className="pd-detail-label">Year</span>
                  <span className="pd-detail-value">{project.yr}</span>
                </li>
                <li>
                  <span className="pd-detail-label">Category</span>
                  <span className="pd-detail-value">
                    {categories.map(c => catLabels[c] || c).join(', ')}
                  </span>
                </li>
                <li>
                  <span className="pd-detail-label">Duration</span>
                  <span className="pd-detail-value">Completed</span>
                </li>
              </ul>
            </div>

            <div className={`pd-card pd-tech-card ${stagger(4)}`}>
              <h3 className="pd-side-title">Tech Stack</h3>
              <div className="pd-tech-grid">
                {techStack.map(tech => (
                  <span key={tech} className="pd-tech-badge">{tech}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className={`pd-cta-section ${stagger(5)}`}>
        <div className="wrap">
          <div className="cta-band">
            <div className="glow"></div>
            <h2>Have a project <span className="grad">in mind?</span></h2>
            <p>Let's build something your business will be proud of. Tell us what you're working on and we'll take it from there.</p>
            <div className="row">
              <Link className="btn btn-primary" to="/#follow">Start a Project
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <Link className="btn btn-ghost" to="/#contact">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pd-lightbox" 
            onClick={() => setLightboxImg(null)}
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="pd-lightbox-close" 
              onClick={(e) => { e.stopPropagation(); setLightboxImg(null); }}
            >&times;</motion.span>
            <motion.img 
              layoutId={`lightbox-${lightboxImg}`}
              className="pd-lightbox-content" 
              src={lightboxImg.startsWith('data:') ? lightboxImg : `${API}${lightboxImg}`} 
              alt="Expanded view" 
              onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
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
