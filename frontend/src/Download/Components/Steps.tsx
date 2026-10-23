import React from 'react';
import styles from './Steps.module.css';

interface StepsProps {
  children: React.ReactNode;
}

function Steps({ children }: StepsProps) {
  return <ol className={styles.steps}>{children}</ol>;
}

export default Steps;
