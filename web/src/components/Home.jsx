import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBackground from './HeroBackground';
import './Home.css';

const API = 'http://localhost:5000';

export default function Home() {
  const [year, setYear] = useState(new Date().getFullYear());
  const heroRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return; // skip on touch devices

    let tx = 0, ty = 0, cx = 0, cy = 0;
    const MAX_ROT = 10;
    const MAX_SHIFT = 16;
    let animationFrameId;

    const handlePointerMove = (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5;
      const ny = (e.clientY - r.top) / r.height - .5;
      tx = nx; ty = ny;
    };

    const handlePointerLeave = () => { tx = 0; ty = 0; };

    hero.addEventListener('pointermove', handlePointerMove);
    hero.addEventListener('pointerleave', handlePointerLeave);

    const loop = () => {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      if (stage) {
        stage.style.setProperty('--ry', (cx * MAX_ROT) + 'deg');
        stage.style.setProperty('--rx', (-cy * MAX_ROT) + 'deg');
        stage.style.setProperty('--px', (cx * MAX_SHIFT) + 'px');
        stage.style.setProperty('--py', (cy * MAX_SHIFT) + 'px');
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      hero.removeEventListener('pointermove', handlePointerMove);
      hero.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    // reveal on scroll
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      })
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // card spotlight follow-cursor
    const cards = document.querySelectorAll('.card');
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
      cards.forEach(c => c.removeEventListener('pointermove', listeners.get(c)));
    };
  }, []);

  useEffect(() => {
    // count-up stats
    const animateCount = (el) => {
      const target = +el.dataset.count, suf = el.dataset.suffix || '';
      let n = 0; const step = Math.max(1, Math.round(target / 45));
      const t = setInterval(() => {
        n += step;
        if (n >= target) { n = target; clearInterval(t); }
        el.textContent = n + suf;
      }, 22);
    };
    const so = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          if (e.target.dataset.count) animateCount(e.target);
          so.unobserve(e.target);
        }
      })
    }, { threshold: .5 });
    document.querySelectorAll('.stat b[data-count]').forEach(el => so.observe(el));

    return () => so.disconnect();
  }, []);

  const [showTop, setShowTop] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setShowTop(currentScrollY > 600);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsNavVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const [menuOpen, setMenuOpen] = useState(false);
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

  return (
    <>



      <HeroBackground />
      <div className="grid-overlay"></div>


      <header className={`nav ${isNavVisible ? '' : 'nav-hidden'}`}>
        <div className="wrap nav-in">
          <a className="brand" href="#top">
            <img src="mark-white.png" alt="Ceynova logo" />
            <span><b>CEYNOVA</b><span>Digital Solutions</span></span>
          </a>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} id="navLinks">
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#work" onClick={closeMenu}>Work</a>
            <a href="#follow" onClick={closeMenu}>Connect</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <a className="btn btn-primary" href="#follow" onClick={closeMenu}>Grow With Us</a>
          </nav>
          <button className="menu-toggle" id="menuToggle" aria-label="Toggle menu" onClick={toggleMenu}><span></span><span></span><span></span></button>
        </div>
      </header>

      <main id="top">

        <section className="hero" id="hero" ref={heroRef}>
          <div className="wrap hero-grid">
            <div>
              <span className="pill"><span className="dot"></span> Innovative Solutions · Real Results</span>
              <h1>
                <span className="word" style={{ animationDelay: '.05s' }}>We</span>
                <span className="word" style={{ animationDelay: '.15s' }}>build</span><br />
                <span className="word gw" style={{ animationDelay: '.28s' }}>digital</span>
                <span className="word gw" style={{ animationDelay: '.4s' }}>solutions</span><br />
                <span className="word" style={{ animationDelay: '.52s' }}>for</span>
                <span className="word" style={{ animationDelay: '.6s' }}>your</span>
                <span className="word" style={{ animationDelay: '.68s' }}>success.</span>
              </h1>
              <p className="lead">Ceynova Digital helps businesses grow through creative, modern, and reliable technology — engineered around your goals.</p>
              <div className="hero-cta">
                <a className="btn btn-primary" href="#services">Explore Services
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
                <a className="btn btn-ghost" href="#follow">Let's Grow Together</a>
              </div>
              <div className="ticker">
                <span className="tg"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg> Web & Mobile</span>
                <span className="tg"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg> UI/UX Design</span>
                <span className="tg"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg> AI & Automation</span>
                <span className="tg"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg> E-commerce</span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="tilt-stage" ref={stageRef}>
                <div className="orbit"></div>
                <div className="orbit two"></div>
                <div className="bubble b1"><svg viewBox="0 0 24 24" fill="#fff"><path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" /></svg></div>
                <div className="bubble b2"><svg viewBox="0 0 24 24" fill="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg></div>
                <div className="bubble b3"><svg viewBox="0 0 24 24" fill="#fff"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg></div>
                <div className="device">
                  <div className="screen">
                    <img src="mark-white.png" alt="Ceynova monogram" />
                    <div className="dl">Digital Solutions</div>
                    <h3>We Build <b>Digital Solutions</b> for Your Success</h3>
                    <div className="sline"></div>
                    <div className="chips">
                      <div className="chip"><span className="ic"><svg viewBox="0 0 24 24"><path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13 5l-2 14" /></svg></span>Web & Mobile</div>
                      <div className="chip"><span className="ic"><svg viewBox="0 0 24 24"><path d="M12 19l7-7-4-4-7 7v4h4zM14 6l4 4" /></svg></span>UI/UX Design</div>
                      <div className="chip"><span className="ic"><svg viewBox="0 0 24 24"><path d="M3 11l18-7-4 18-5-5-4 2v-5z" /></svg></span>Marketing</div>
                      <div className="chip"><span className="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></svg></span>AI & Automation</div>
                      <div className="chip"><span className="ic"><svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h2l3 12h11l2-8H6" /></svg></span>E-commerce</div>
                      <div className="chip"><span className="ic"><svg viewBox="0 0 24 24"><path d="M9 18l-1 3M15 18l1 3M4 4h16v11H4z" /></svg></span>IT Support</div>
                    </div>
                    <div className="tag">Let's grow together →</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        <div className="strip">
          <div className="marquee">
            <span>WEB &amp; MOBILE APPS<i></i></span><span>UI / UX DESIGN<i></i></span><span>DIGITAL MARKETING<i></i></span><span>AI &amp; AUTOMATION<i></i></span><span>E-COMMERCE<i></i></span><span>IT CONSULTING<i></i></span>
            <span>WEB &amp; MOBILE APPS<i></i></span><span>UI / UX DESIGN<i></i></span><span>DIGITAL MARKETING<i></i></span><span>AI &amp; AUTOMATION<i></i></span><span>E-COMMERCE<i></i></span><span>IT CONSULTING<i></i></span>
          </div>
        </div>


        <section className="blk" id="about">
          <div className="wrap about-grid">
            <div className="reveal">
              <span className="eyebrow">Who We Are</span>
              <div className="quote-card" style={{ marginTop: '20px' }}>
                <div className="q">“</div>
                <p>Ceynova Digital was created with a vision to help businesses grow through creative, modern, and reliable digital solutions.</p>
                <div className="sig">— The Ceynova Team</div>
                <div className="halo"></div>
              </div>
            </div>
            <div className="points reveal">
              <div className="pt"><span className="ic"><svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1L12 16.6 5.7 21l2.3-7.1-6-4.5h7.6z" /></svg></span><div><h4>Creative by default</h4><p>We design experiences people remember, not templates they scroll past.</p></div></div>
              <div className="pt"><span className="ic"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" /></svg></span><div><h4>Modern &amp; reliable</h4><p>Current tech, clean engineering, and solutions built to last and scale.</p></div></div>
              <div className="pt"><span className="ic"><svg viewBox="0 0 24 24"><path d="M12 3v18M5 10l7-7 7 7" /></svg></span><div><h4>Growth focused</h4><p>Every decision ties back to one thing — moving your business forward.</p></div></div>
              <div className="pt"><span className="ic"><svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="3" /><path d="M2 21v-2a5 5 0 015-5h4M16 11l2 2 4-4" /></svg></span><div><h4>A real partnership</h4><p>We invite you to grow with us — your success motivates us to go further.</p></div></div>
            </div>
          </div>
        </section>


        <section className="blk" id="services">
          <div className="wrap">
            <div className="sec-head center reveal">
              <span className="eyebrow">What We Do</span>
              <h2>Solutions that <span className="grad">move you forward</span></h2>
              <p>Six core service lines, one partner — from first concept to live product and everything after.</p>
            </div>
            <div className="bento">
              <div className="card tilt wide reveal">
                <span className="num">01</span>
                <div className="ic"><svg className="gl" viewBox="0 0 24 24"><path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13 5l-2 14" /></svg></div>
                <h3>Web &amp; Mobile Applications</h3>
                <p>Fast, responsive, dependable apps for web and mobile — built around how your users actually work, and ready to scale.</p>
                <div className="tags"><i>React</i><i>iOS &amp; Android</i><i>APIs</i><i>Cloud</i></div>
              </div>
              <div className="card tilt tall reveal">
                <span className="num">02</span>
                <div className="ic"><svg className="gl" viewBox="0 0 24 24"><path d="M12 19l7-7-4-4-7 7v4h4zM14 6l4 4" /></svg></div>
                <h3>UI/UX Design</h3>
                <p>Interfaces that are clear, intuitive, and a pleasure to use — designed to convert and to last.</p>
                <div className="tags"><i>Wireframes</i><i>Prototypes</i><i>Design systems</i></div>
              </div>
              <div className="card tilt reveal">
                <span className="num">03</span>
                <div className="ic"><svg className="gl" viewBox="0 0 24 24"><path d="M3 11l18-7-4 18-5-5-4 2v-5z" /></svg></div>
                <h3>Digital Marketing</h3>
                <p>Reach more of the right customers with strategy, content, and campaigns that drive real results.</p>
              </div>
              <div className="card tilt reveal">
                <span className="num">04</span>
                <div className="ic"><svg className="gl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></svg></div>
                <h3>AI &amp; Automation</h3>
                <p>Put intelligent tools and automated workflows to work — save time and unlock new capabilities.</p>
              </div>
              <div className="card tilt reveal">
                <span className="num">05</span>
                <div className="ic"><svg className="gl" viewBox="0 0 24 24"><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h2l3 12h11l2-8H6" /></svg></div>
                <h3>E-commerce Solutions</h3>
                <p>Online stores built to sell — secure, scalable, and designed for a smooth path to checkout.</p>
              </div>
              <div className="card tilt wide reveal">
                <span className="num">06</span>
                <div className="ic"><svg className="gl" viewBox="0 0 24 24"><path d="M9 18l-1 3M15 18l1 3M4 4h16v11H4z" /></svg></div>
                <h3>IT Consulting &amp; Support</h3>
                <p>Guidance you can trust and support you can rely on — keeping your technology running smoothly so you can focus on the business.</p>
                <div className="tags"><i>Strategy</i><i>Maintenance</i><i>Security</i></div>
              </div>
            </div>
          </div>
        </section>


        <section className="blk" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="stats reveal">
              <div className="stat"><b data-count="6" data-suffix="+">6+</b><span>Core service lines</span></div>
              <div className="stat"><b>360°</b><span>Design to deployment</span></div>
              <div className="stat"><b>1:1</b><span>Partner-led support</span></div>
              <div className="stat"><b data-count="100" data-suffix="%">100%</b><span>Focused on your growth</span></div>
            </div>
          </div>
        </section>


        <section className="blk" id="work">
          <div className="wrap">
            <div className="pf-head reveal">
              <div className="sec-head" style={{ margin: 0 }}>
                <span className="eyebrow">Selected Work</span>
                <h2>Projects we're <span className="grad">proud of</span></h2>
                <p>A glimpse of what we build — from web platforms to mobile apps, brand systems, and intelligent tools.</p>
              </div>
            </div>

            <div className="pf-teaser reveal">
              <div className="pf-grid">
                {projects.slice(0, 2).map((p, i) => (
                  <Link to="/portfolio" key={p._id} className="pf-card" style={{ animationDelay: `${i * 0.05}s` }}>
                    <img src={p.images && p.images.length > 0 ? (p.images[0].startsWith('data:') ? p.images[0] : `${API}${p.images[0]}`) : '/placeholder.jpg'} alt={p.title} />
                    <span className="yr">{p.yr}</span>
                    <div className="ov">
                      <span className="cat">
                        {Array.isArray(p.cat)
                          ? p.cat.map(c => c === 'uiux' ? 'UI/UX' : c.charAt(0).toUpperCase() + c.slice(1)).join(' / ')
                          : (p.cat === 'uiux' ? 'UI/UX' : p.cat ? p.cat.charAt(0).toUpperCase() + p.cat.slice(1) : '')}
                      </span>
                      <h3>{p.title}</h3>
                    </div>
                  </Link>
                ))}
                {projects.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    No projects added yet.
                  </div>
                )}
              </div>
              <div className="pf-fade"></div>
              <div className="pf-cta">
                <span className="hint"><b>And much more.</b> Explore the full collection<span className="pf-count"><span className="d"></span>{projects.length}+ projects</span></span>
                <Link to="/portfolio" className="btn btn-primary">View All Work</Link>
              </div>
            </div>
          </div>
        </section>


        <section className="blk" id="follow">
          <div className="wrap">
            <div className="follow-card reveal">
              <div className="glow"></div>
              <div className="follow-grid">
                <div>
                  <span className="eyebrow">Join The Journey</span>
                  <h2>Follow our page and <span className="grad">grow with us</span></h2>
                  <p>We invite everyone to be part of this journey. Follow us for tech tips, business growth ideas, digital marketing insights, and exciting updates. Your support means a lot and motivates us to grow even further. <span className="heart">❤</span></p>
                </div>
                <div className="socials">
                  <a className="social" href="https://www.instagram.com/ceynova_digital" target="_blank" rel="noopener">
                    <span className="si ig"><svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 4.38a5.3 5.3 0 100 10.6 5.3 5.3 0 000-10.6zm0 1.62a3.68 3.68 0 110 7.36 3.68 3.68 0 010-7.36zm5.5-1.18a1.24 1.24 0 110 2.48 1.24 1.24 0 010-2.48z" /></svg></span>
                    <span className="sx"><b>Instagram</b><span>@ceynova_digital</span></span>
                    <span className="arrow"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8" /></svg></span>
                  </a>
                  <a className="social" href="https://www.facebook.com/share/1Ej6yHwqNx/?mibextid=wwXIfr" target="_blank" rel="noopener">
                    <span className="si fb"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" /></svg></span>
                    <span className="sx"><b>Facebook</b><span>Ceynova Digital Solutions</span></span>
                    <span className="arrow"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8" /></svg></span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section className="blk" id="contact">
          <div className="wrap">
            <div className="sec-head center reveal">
              <span className="eyebrow">Get In Touch</span>
              <h2>Let's start a <span className="grad">conversation</span></h2>
              <p>Have a project in mind? Reach out — full contact details are on the way.</p>
            </div>
            <div className="contact-grid">
              <div className="ccard reveal"><div className="ic"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.66A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg></div><h4>Phone</h4><p>+94 75 049 632</p><span className="pending"><span className="status-dot"></span>Active</span></div>
              <div className="ccard reveal"><div className="ic"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 6l8 6 8-6" /></svg></div><h4>Email</h4><p>[ceynovadigital@gmail.com]</p><span className="pending"><span className="status-dot"></span>Active</span></div>
              <div className="ccard reveal"><div className="ic"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg></div><h4>Address</h4><p>XXXX, XXXX</p><span className="pending">Coming soon</span></div>
            </div>
          </div>
        </section>
      </main>


      <footer className="site">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <img src="logo-white.png" alt="Ceynova Digital Solutions" />
              <p>Helping businesses grow through creative, modern, and reliable digital solutions. Innovative solutions, real results.</p>
            </div>
            <div className="foot-col">
              <h5>Explore</h5>
              <a href="#about">About</a><a href="#services">Services</a><a href="#follow">Connect</a><a href="#contact">Contact</a>
            </div>
            <div className="foot-col">
              <h5>Services</h5>
              <a href="#services">Web &amp; Mobile</a><a href="#services">UI/UX Design</a><a href="#services">Digital Marketing</a><a href="#services">AI &amp; Automation</a><a href="#services">E-commerce</a><a href="#services">IT Consulting</a>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© <span id="year">{year}</span> Ceynova Digital Solutions. All rights reserved.</span>
            <div className="fsoc">
              <a href="https://www.instagram.com/ceynova_digital" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 4.38a5.3 5.3 0 100 10.6 5.3 5.3 0 000-10.6zm0 1.62a3.68 3.68 0 110 7.36 3.68 3.68 0 010-7.36zm5.5-1.18a1.24 1.24 0 110 2.48 1.24 1.24 0 010-2.48z" /></svg></a>
              <a href="https://www.facebook.com/share/1Ej6yHwqNx/?mibextid=wwXIfr" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z" /></svg></a>
            </div>
          </div>
        </div>
      </footer>

      <button className={`totop ${showTop ? "show" : ""}`} id="toTop" aria-label="Back to top" onClick={scrollToTop}><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" /></svg></button>



    </>
  );
}
