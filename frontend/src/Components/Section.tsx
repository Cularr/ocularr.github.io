import React from 'react';
import styles from './Section.module.css';

interface SectionProps {
  id?: string;
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ id, title, lede, children }: SectionProps) {
  return (
    <section id={id} className={styles.section}>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {lede ? <p className={styles.lede}>{lede}</p> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}

export default Section;
