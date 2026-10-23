import {
  Box,
  Container,
  Laptop,
  Monitor,
  Server,
  Terminal,
} from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import Section from 'Components/Section';
import ArchLinuxGuide from './Guides/ArchLinuxGuide';
import DebianGuide from './Guides/DebianGuide';
import DockerGuide from './Guides/DockerGuide';
import FreeBsdGuide from './Guides/FreeBsdGuide';
import GentooGuide from './Guides/GentooGuide';
import LinuxOtherGuide from './Guides/LinuxOtherGuide';
import MacGuide from './Guides/MacGuide';
import NasGuide from './Guides/NasGuide';
import OtherGuide from './Guides/OtherGuide';
import WindowsGuide from './Guides/WindowsGuide';
import {
  parseHash,
  PlatformId,
  platforms,
  Selection,
  selectPlatform,
  toHash,
  wantsAlternatives,
} from './platforms';
import PlatformTab from './PlatformTab';
import VariantTab from './VariantTab';
import styles from './Download.module.css';

const ICONS = {
  windows: Monitor,
  macos: Laptop,
  linux: Terminal,
  docker: Container,
  nas: Server,
  other: Box,
};

interface DownloadProps {
  selection: Selection;
  onSelectionChange: (selection: Selection) => void;
}

function renderGuide({ platform, variant }: Selection) {
  switch (platform) {
    case 'macos':
      return <MacGuide />;

    case 'linux':
      switch (variant) {
        case 'archlinux':
          return <ArchLinuxGuide />;
        case 'gentoo':
          return <GentooGuide />;
        case 'freebsd':
          return <FreeBsdGuide />;
        case 'other':
          return <LinuxOtherGuide />;
        default:
          return <DebianGuide />;
      }

    case 'docker':
      return <DockerGuide />;
    case 'nas':
      return (
        <NasGuide
          nas={variant === 'synology' || variant === 'qnap' ? variant : 'other'}
        />
      );
    case 'other':
      return <OtherGuide />;
    default:
      return <WindowsGuide />;
  }
}

function revealDownload(hash: string) {
  const section = document.getElementById('download');

  if (!wantsAlternatives(hash)) {
    section?.scrollIntoView();

    return;
  }

  window.requestAnimationFrame(() => {
    const details = document.querySelector<HTMLDetailsElement>(
      '#download-panel details'
    );

    if (details) {
      details.open = true;
      details.scrollIntoView();
    } else {
      section?.scrollIntoView();
    }
  });
}

function Download({ selection, onSelectionChange }: DownloadProps) {
  const platform = platforms.find((p) => p.id === selection.platform);

  const changeSelection = useCallback(
    (next: Selection) => {
      onSelectionChange(next);
      window.history.replaceState(null, '', toHash(next));
    },
    [onSelectionChange]
  );

  useEffect(() => {
    if (parseHash(window.location.hash)) {
      revealDownload(window.location.hash);
    }
  }, []);

  useEffect(() => {
    function handleHashChange() {
      const next = parseHash(window.location.hash);

      if (next) {
        onSelectionChange(next);
        revealDownload(window.location.hash);
      }
    }

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [onSelectionChange]);

  const handlePlatformPress = useCallback(
    (platformId: PlatformId) => {
      changeSelection(selectPlatform(platformId));
    },
    [changeSelection]
  );

  const handlePlatformKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const index = platforms.findIndex((p) => p.id === selection.platform);
      let nextIndex = index;

      if (event.key === 'ArrowRight') {
        nextIndex = (index + 1) % platforms.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (index - 1 + platforms.length) % platforms.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = platforms.length - 1;
      } else {
        return;
      }

      event.preventDefault();

      const next = platforms[nextIndex];

      changeSelection(selectPlatform(next.id));
      document.getElementById(`platform-tab-${next.id}`)?.focus();
    },
    [selection.platform, changeSelection]
  );

  const handleVariantPress = useCallback(
    (variant: string) => {
      changeSelection({ platform: selection.platform, variant });
    },
    [selection.platform, changeSelection]
  );

  const handleVariantKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const variants = platform?.variants ?? [];
      const index = variants.findIndex((v) => v.id === selection.variant);
      let nextIndex = index;

      if (event.key === 'ArrowRight') {
        nextIndex = (index + 1) % variants.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (index - 1 + variants.length) % variants.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = variants.length - 1;
      } else {
        return;
      }

      event.preventDefault();

      const next = variants[nextIndex];

      if (!next) {
        return;
      }

      changeSelection({ platform: selection.platform, variant: next.id });
      document
        .getElementById(`variant-tab-${selection.platform}-${next.id}`)
        ?.focus();
    },
    [platform, selection.platform, selection.variant, changeSelection]
  );

  return (
    <Section
      id="download"
      title="Download"
      lede="Pick your platform and follow the steps."
    >
      <div className={styles.panel}>
        <div
          className={styles.platforms}
          role="tablist"
          aria-label="Platform"
          onKeyDown={handlePlatformKeyDown}
        >
          {platforms.map((p) => (
            <PlatformTab
              key={p.id}
              id={p.id}
              name={p.name}
              icon={ICONS[p.id]}
              isSelected={p.id === selection.platform}
              onPress={handlePlatformPress}
            />
          ))}
        </div>

        {platform && platform.variants.length > 0 ? (
          <div className={styles.variants}>
            <div
              className={styles.segmented}
              role="tablist"
              aria-label={platform.name}
              onKeyDown={handleVariantKeyDown}
            >
              {platform.variants.map((v) => (
                <VariantTab
                  key={v.id}
                  id={v.id}
                  platformId={platform.id}
                  name={v.name}
                  isSelected={v.id === selection.variant}
                  onPress={handleVariantPress}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div
          id="download-panel"
          className={styles.guide}
          role="tabpanel"
          aria-labelledby={`platform-tab-${selection.platform}`}
        >
          {renderGuide(selection)}
        </div>
      </div>
    </Section>
  );
}

export default Download;
