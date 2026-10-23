import React, { useCallback, useState } from 'react';
import Download from 'Download/Download';
import { detectSelection, parseHash, Selection } from 'Download/platforms';
import { DemoRequest } from 'Site/DemoFrame';
import Features from 'Site/Features';
import Hero from 'Site/Hero';
import SiteFooter from 'Site/SiteFooter';
import SiteHeader from 'Site/SiteHeader';
import Support from 'Site/Support';
import styles from './App.module.css';

function getInitialSelection() {
  return parseHash(window.location.hash) ?? detectSelection();
}

function App() {
  const [selection, setSelection] = useState<Selection>(getInitialSelection);
  const [demoRequest, setDemoRequest] = useState<DemoRequest | null>(null);

  const handleShowFeature = useCallback((route: string) => {
    setDemoRequest((current) => ({
      route,
      nonce: (current?.nonce ?? 0) + 1,
    }));

    document.getElementById('demo')?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero selection={selection} demoRequest={demoRequest} />
        <div className={styles.content}>
          <Features onShowFeature={handleShowFeature} />
          <Download selection={selection} onSelectionChange={setSelection} />
          <Support />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default App;
