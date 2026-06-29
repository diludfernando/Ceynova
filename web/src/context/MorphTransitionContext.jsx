import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';

const MorphTransitionContext = createContext(null);

export function useMorphTransition() {
  return useContext(MorphTransitionContext);
}

export function MorphTransitionProvider({ children }) {
  const [transitionData, setTransitionData] = useState(null);
  const isTransitioningRef = useRef(false);

  const navigateWithTransition = useCallback((navigate, to, cardData) => {
    // Prevent double-clicks
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // Store card data for the destination page
    setTransitionData(cardData);

    // Check for View Transitions API support
    if (document.startViewTransition) {
      const transition = document.startViewTransition(() => {
        // Use flushSync to synchronously commit the React navigation
        // This ensures the DOM is updated before the transition snapshot is taken
        flushSync(() => {
          navigate(to);
        });
      });

      transition.finished.then(() => {
        isTransitioningRef.current = false;
      }).catch(() => {
        isTransitioningRef.current = false;
      });
    } else {
      // Fallback: just navigate normally
      navigate(to);
      isTransitioningRef.current = false;
    }
  }, []);

  const clearTransition = useCallback(() => {
    setTransitionData(null);
  }, []);

  return (
    <MorphTransitionContext.Provider value={{ transitionData, navigateWithTransition, clearTransition }}>
      {children}
    </MorphTransitionContext.Provider>
  );
}

