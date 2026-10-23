import classNames from 'classnames';
import { Check, Copy } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './CodeBlock.module.css';

export interface CodeVariant {
  label: string;
  code: string;
}

interface CodeBlockProps {
  variants: CodeVariant[];
  prompt?: string;
}

function CodeBlock({ variants, prompt = '$' }: CodeBlockProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const selected = variants[selectedIndex] ?? variants[0];
  const variantKey = variants.map((variant) => variant.label).join('|');

  useEffect(() => {
    setSelectedIndex(0);
  }, [variantKey]);

  useEffect(() => {
    if (!isCopied) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setIsCopied(false), 1600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isCopied]);

  const handleCopyPress = useCallback(() => {
    navigator.clipboard
      ?.writeText(selected.code)
      .then(() => setIsCopied(true))
      .catch(() => setIsCopied(false));
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
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
        <span className={styles.status} role="status">
          {isCopied ? 'Copied to clipboard' : ''}
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
