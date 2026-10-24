import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import DownloadLinks from 'Download/Components/DownloadLinks';
import Guide from 'Download/Components/Guide';
import Note from 'Download/Components/Note';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewOcularr from 'Download/Components/ViewOcularr';
import downloadUrl from 'Download/downloadUrl';

function MacGuide() {
  return (
    <Guide
      intro={<p>The easiest way to run Ocularr on macOS is the app archive.</p>}
      alternatives={
        <>
          <h5>Manual install</h5>
          <p>
            You can install Ocularr from a .tar.gz archive, but then you handle
            dependencies, installation and permissions yourself.
          </p>
          <DownloadLinks
            links={[
              {
                label: 'macOS Apple silicon',
                detail: 'arm64 .tar.gz',
                href: downloadUrl({ os: 'osx', arch: 'arm64' }),
              },
              {
                label: 'macOS Intel',
                detail: 'x64 .tar.gz',
                href: downloadUrl({ os: 'osx', arch: 'x64' }),
              },
            ]}
          />
          <DockerAlternative />
        </>
      }
    >
      <Steps>
        <Step number={1} title="Download the app">
          <DownloadLinks
            links={[
              {
                label: 'Ocularr for Apple silicon',
                detail: 'M1 and newer',
                href: downloadUrl({
                  os: 'osx',
                  arch: 'arm64',
                  installer: true,
                }),
              },
              {
                label: 'Ocularr for Intel',
                detail: 'x64',
                href: downloadUrl({
                  os: 'osx',
                  arch: 'x64',
                  installer: true,
                }),
              },
            ]}
          />
        </Step>
        <Step number={2} title="Move it to Applications">
          <p>
            Open the archive and drag Ocularr into your Applications folder.
          </p>
          <Note kind="warning">
            On macOS 10.12 and later, Gatekeeper App Translocation stops Ocularr
            from updating itself if it runs from the download location. It must
            live in Applications.
          </Note>
        </Step>
        <Step number={3} title="Self-sign Ocularr">
          <p>Open Terminal and run:</p>
          <CodeBlock
            variants={[
              {
                label: 'zsh',
                code: 'codesign --force --deep -s - /Applications/Ocularr.app && xattr -rd com.apple.quarantine /Applications/Ocularr.app',
              },
            ]}
          />
        </Step>
        <Step number={4} title="Start Ocularr">
          <p>Open Ocularr from your Applications folder.</p>
        </Step>
        <ViewOcularr number={5} isRemote={false} />
      </Steps>
    </Guide>
  );
}

export default MacGuide;
