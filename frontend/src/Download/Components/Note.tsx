import { Info, TriangleAlert } from 'lucide-react';
import React from 'react';
import styles from './Note.module.css';

interface NoteProps {
  title?: string;
  kind?: 'info' | 'warning';
  children: React.ReactNode;
}

function Note({ title, kind = 'info', children }: NoteProps) {
  const Icon = kind === 'warning' ? TriangleAlert : Info;

  return (
    <div className={kind === 'warning' ? styles.warning : styles.info}>
      <Icon className={styles.icon} size={16} strokeWidth={2} />
      <div className={styles.body}>
        {title ? <strong className={styles.title}>{title}</strong> : null}
        {children}
      </div>
    </div>
  );
}

export default Note;
