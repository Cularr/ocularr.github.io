import classNames from 'classnames';
import { Check, Copy } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './CodeBlock.module.css';

export interface CodeVariant {
  label: string;
  code: string;
}

interface CodeBlockProps {
  variants: readonly [CodeVariant, ...CodeVariant[]];
  prompt?: string;
}

const copyMessages = {
  idle: { label: 'Copy', status: '' },
  success: { label: 'Copied', status: 'Copied to clipboard' },
  error: { label: 'Copy failed', status: 'Could not copy to clipboard' },
};

function CodeBlock({ variants, prompt = '$' }: CodeBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copyStatus, setCopyStatus] = useState<'success' | 'error' | null>(
    null
  );
  const isCopied = copyStatus === 'success';
  const copyMessage = copyMessages[copyStatus ?? 'idle'];
  const selected = variants[selectedIndex] ?? variants[0];
  const variantKey = variants.map((variant) => variant.label).join('|');

  useEffect(() => {
    setSelectedIndex(0);
  }, [variantKey]);

  useEffect(() => {
    if (!copyStatus) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopyStatus(null), 1600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copyStatus]);

  const handleCopyPress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(selected.code);
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }
  }, [selected.code]);

  const handleVariantPress = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setSelectedIndex(Number(event.currentTarget.value));
    },
    []
  );

  return (
    <div className={styles.block}>
      <div className={styles.bar}>
        <div className={styles.variants} role="group" aria-label="Variant">
          {variants.map((variant, index) => (
            <button
              key={variant.label}
              className={classNames(
                styles.variant,
                index === selectedIndex && styles.isSelected
              )}
              type="button"
              aria-pressed={index === selectedIndex}
              value={index}
              onClick={handleVariantPress}
            >
              {variant.label}
            </button>
          ))}
        </div>
        <button
          className={styles.copy}
          type="button"
          aria-label="Copy to clipboard"
          onClick={handleCopyPress}
        >
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copyMessage.label}</span>
        </button>
        <span className={styles.status} role="status">
          {copyMessage.status}
        </span>
      </div>
      <pre className={styles.code}>
        {selected.code.split('\n').map((line, index) => (
          <span key={`${index}-${line}`} className={styles.line}>
            <span className={styles.prompt} aria-hidden="true">
              {prompt}
            </span>
            {line}
          </span>
        ))}
      </pre>
    </div>
  );
}

export default CodeBlock;
