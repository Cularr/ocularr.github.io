import { ArrowUp } from 'lucide-react';
import React, { useCallback } from 'react';
import { Feature } from './Features';
import styles from './FeatureItem.module.css';

interface FeatureItemProps {
  feature: Feature;
  onShowPress: (route: string) => void;
}

function FeatureItem({ feature, onShowPress }: FeatureItemProps) {
  const { icon: Icon } = feature;

  const handleShowPress = useCallback(() => {
    onShowPress(feature.route);
  }, [feature.route, onShowPress]);

  return (
    <li className={styles.feature}>
      <Icon className={styles.icon} size={20} strokeWidth={1.75} />
      <div className={styles.body}>
        <h3 className={styles.title}>{feature.title}</h3>
        <p className={styles.text}>{feature.text}</p>
      </div>
      <button
        className={styles.show}
        type="button"
        title={`Open ${feature.route} in the demo`}
        onClick={handleShowPress}
      >
        Show in demo
        <ArrowUp size={14} />
      </button>
    </li>
  );
}

export default FeatureItem;
