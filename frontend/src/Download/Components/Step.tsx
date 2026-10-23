import React from 'react';
import styles from './Step.module.css';

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <li className={styles.step}>
      <span className={styles.number} aria-hidden="true">
        {number}
      </span>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        {children}
      </div>
    </li>
  );
}

export default Step;
