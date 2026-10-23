import classNames from 'classnames';
import { LucideIcon } from 'lucide-react';
import React, { useCallback } from 'react';
import { PlatformId } from './platforms';
import styles from './PlatformTab.module.css';

interface PlatformTabProps {
  id: PlatformId;
  name: string;
  icon: LucideIcon;
  isSelected: boolean;
  onPress: (id: PlatformId) => void;
}

function PlatformTab({
  id,
  name,
  icon: Icon,
  isSelected,
  onPress,
}: PlatformTabProps) {
  const handlePress = useCallback(() => {
    onPress(id);
  }, [id, onPress]);

  return (
    <button
      className={classNames(styles.tab, isSelected && styles.isSelected)}
      id={`platform-tab-${id}`}
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls="download-panel"
      tabIndex={isSelected ? 0 : -1}
      onClick={handlePress}
    >
      <Icon size={18} strokeWidth={1.75} />
      <span>{name}</span>
    </button>
  );
}

export default PlatformTab;
