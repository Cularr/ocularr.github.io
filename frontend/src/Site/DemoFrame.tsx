import classNames from 'classnames';
import { Maximize2, Play } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  currentTheme,
  DEMO_BASE,
  DEMO_HEIGHT,
  DEMO_WIDTH,
  framePath,
  isPhoneDevice,
  PHONE_HEIGHT,
  PHONE_WIDTH,
  PORTRAIT_SCREEN,
  routeUrl,
  SMALL_SCREEN,
  Theme,
  useMediaQuery,
  whenIdle,
} from './demoWindow';
import styles from './DemoFrame.module.css';

export interface DemoRequest {
  route: string;
  nonce: number;
}

interface DemoFrameProps {
  request: DemoRequest | null;
}

function DemoFrame({ request }: DemoFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState('/');
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const isPhone = useMemo(isPhoneDevice, []);
  const isSmallScreen = useMediaQuery(SMALL_SCREEN);
  const isPortraitScreen = useMediaQuery(PORTRAIT_SCREEN);
  const [scale, setScale] = useState(1);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const handledNonce = useRef(0);
  const isLive = !isPhone && !isSmallScreen;
  const isPhoneLayout = isPhone && isPortraitScreen;

  useEffect(() => {
    setIsLoaded(false);
  }, [isLive]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (isPhoneLayout || !viewport) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / DEMO_WIDTH);
    });

    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, [isPhoneLayout]);

  useEffect(() => {
    if (!isLive || frameSrc) {
      return undefined;
    }

    return whenIdle(() => setFrameSrc(routeUrl('/')));
  }, [isLive, frameSrc]);

  useEffect(() => {
    if (!request || request.nonce === handledNonce.current) {
      return;
    }

    handledNonce.current = request.nonce;

    if (!isLive) {
      window.location.assign(routeUrl(request.route));

      return;
    }

    const frameWindow = frameRef.current?.contentWindow;

    if (!frameWindow || !isLoaded) {
      setFrameSrc(routeUrl(request.route));

      return;
    }

    try {
      frameWindow.history.pushState(null, '', `${DEMO_BASE}${request.route}`);
      frameWindow.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      setFrameSrc(`${routeUrl(request.route)}#${request.nonce}`);
    }
  }, [request, isLive, isLoaded]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const nextTheme = currentTheme();

      setTheme(nextTheme);

      if (frameRef.current && isLoaded) {
        setIsLoaded(false);
        frameRef.current.contentWindow?.location.reload();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
    };
  }, [isLoaded]);

  const handleFrameLoad = useCallback(() => {
    const frame = frameRef.current;
    const frameWindow = frame?.contentWindow;
    const startedAt = Date.now();

    const reveal = () => {
      try {
        const document = frameWindow?.document;
        const isReady =
          !!document?.querySelector('[class*="PageContent-module"]') &&
          !document.querySelector('[class*="LoadingPage-module"]');

        if (isReady || Date.now() - startedAt > 10000) {
          setIsLoaded(true);

          return;
        }
      } catch {
        setIsLoaded(true);

        return;
      }

      window.setTimeout(reveal, 150);
    };

    reveal();
    setPath(framePath(frame));

    if (!frameWindow) {
      return;
    }

    try {
      const update = () => setPath(framePath(frame));
      const { history } = frameWindow;
      const pushState = history.pushState.bind(history);
      const replaceState = history.replaceState.bind(history);

      history.pushState = (...args: Parameters<History['pushState']>) => {
        pushState(...args);
        update();
      };

      history.replaceState = (...args: Parameters<History['replaceState']>) => {
        replaceState(...args);
        update();
      };

      frameWindow.addEventListener('popstate', update);
    } catch {
      setPath('/');
    }
  }, []);

  return (
    <div className={styles.window}>
      <div className={styles.addressBar}>
        <span className={styles.address}>ocularr.local{path}</span>
        <span className={styles.sample}>sample data</span>
        <a
          className={styles.open}
          href={routeUrl(path)}
          target="_blank"
          rel="noreferrer"
          aria-label="Open the demo in a new tab"
          title="Open the demo in a new tab"
        >
          <Maximize2 size={14} />
        </a>
      </div>

      {isPhoneLayout ? (
        <div className={classNames(styles.viewport, styles.isPhone)}>
          <img
            className={styles.poster}
            src={`/img/demo-${theme}-mobile.webp`}
            alt=""
            width={PHONE_WIDTH}
            height={PHONE_HEIGHT}
          />
          <a className={styles.launch} href={routeUrl('/')}>
            <Play size={16} />
            Open the live demo
          </a>
        </div>
      ) : (
        <div ref={viewportRef} className={styles.viewport}>
          {isLive ? (
            <a className={styles.skip} href="#features">
              Skip the demo
            </a>
          ) : null}
          <div
            className={styles.stage}
            style={{ transform: `scale(${scale})` }}
          >
            <img
              className={classNames(
                styles.poster,
                isLive && isLoaded && styles.isHidden
              )}
              src={`/img/demo-${theme}.webp`}
              alt=""
              width={DEMO_WIDTH}
              height={DEMO_HEIGHT}
            />
            {isLive && frameSrc ? (
              <iframe
                ref={frameRef}
                className={classNames(
                  styles.frame,
                  isLoaded && styles.isVisible
                )}
                src={frameSrc}
                title="Ocularr demo"
                onLoad={handleFrameLoad}
              />
            ) : null}
          </div>
          {isLive ? null : (
            <a className={styles.launch} href={routeUrl('/')}>
              <Play size={16} />
              Open the live demo
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default DemoFrame;
