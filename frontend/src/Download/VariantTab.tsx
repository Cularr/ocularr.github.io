import classNames from 'classnames';
import React, { useCallback } from 'react';
import styles from './VariantTab.module.css';

interface VariantTabProps {
  id: string;
  platformId: string;
  name: string;
  isSelected: boolean;
  onPress: (id: string) => void;
}

function VariantTab({
  id,
  platformId,
  name,
  isSelected,
  onPress,
}: VariantTabProps) {
  const handlePress = useCallback(() => {
    onPress(id);
  }, [id, onPress]);

  return (
    <button
      className={classNames(styles.tab, isSelected && styles.isSelected)}
      id={`variant-tab-${platformId}-${id}`}
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls="download-panel"
      tabIndex={isSelected ? 0 : -1}
      onClick={handlePress}
    >
      {name}
    </button>
  );
}

export default VariantTab;
