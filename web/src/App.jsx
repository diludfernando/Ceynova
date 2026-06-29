import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { MorphTransitionProvider } from './context/MorphTransitionContext';
import Home from './components/Home';
import Portfolio from './components/Portfolio';
import ProjectDetail from './components/ProjectDetail';
import './components/MorphTransition.css';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function GlobalSpotlight() {
  const spotRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const spot = spotRef.current;
    if (!spot) return;

    const handlePointerMove = (e) => {
      spot.style.setProperty('--sx', e.clientX + 'px');
      spot.style.setProperty('--sy', e.clientY + 'px');
    };

    window.addEventListener('pointermove', handlePointerMove);
    // Make it visible once mouse moves
    window.addEventListener('pointermove', () => {
      spot.style.opacity = '1';
    }, { once: true });

    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return <div className="global-spotlight" ref={spotRef}></div>;
}

function App() {
  return (
    <BrowserRouter>
      <MorphTransitionProvider>
        <ScrollToTop />
        <GlobalSpotlight />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:id" element={<ProjectDetail />} />
        </Routes>
      </MorphTransitionProvider>
    </BrowserRouter>
  );
}

export default App;
