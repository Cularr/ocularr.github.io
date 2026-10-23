import React from 'react';
import styles from './Guide.module.css';

export interface Maintainer {
  name: string;
  href?: string;
}

interface GuideProps {
  maintainers?: Maintainer[];
  intro: React.ReactNode;
  upgrade?: React.ReactNode;
  alternatives?: React.ReactNode;
  children?: React.ReactNode;
}

function Guide({
  maintainers,
  intro,
  upgrade,
  alternatives,
  children,
}: GuideProps) {
  return (
    <div className={styles.guide}>
      <div className={styles.intro}>
        {maintainers ? (
          <p className={styles.maintainers}>
            Package maintained by{' '}
            {maintainers.map((maintainer, index) => (
              <React.Fragment key={maintainer.name}>
                {index > 0 ? ', ' : null}
                {maintainer.href ? (
                  <a href={maintainer.href}>{maintainer.name}</a>
                ) : (
                  maintainer.name
                )}
              </React.Fragment>
            ))}
          </p>
        ) : null}
        {intro}
      </div>

      {upgrade ? <div className={styles.upgrade}>{upgrade}</div> : null}

      {children}

      {alternatives ? (
        <details className={styles.alternatives}>
          <summary className={styles.summary}>
            Alternatives for advanced users
          </summary>
          <div className={styles.alternativesBody}>{alternatives}</div>
        </details>
      ) : null}
    </div>
  );
}

export default Guide;
