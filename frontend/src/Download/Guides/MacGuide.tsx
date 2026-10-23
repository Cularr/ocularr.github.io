import React from 'react';
import CodeBlock from 'Components/CodeBlock';
import DockerAlternative from 'Download/Components/DockerAlternative';
import DownloadLinks from 'Download/Components/DownloadLinks';
import Guide from 'Download/Components/Guide';
import Note from 'Download/Components/Note';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewSonarr from 'Download/Components/ViewSonarr';
import downloadUrl from 'Download/downloadUrl';

function MacGuide() {
  return (
    <Guide
      maintainers={[{ name: 'Team Sonarr' }]}
      intro={<p>The easiest way to run Sonarr on macOS is the app archive.</p>}
      upgrade={
        <Note title="Upgrading from v3">
          Sonarr converts an existing v3 database on startup. Back it up first.
        </Note>
      }
      alternatives={
        <>
          <h5>Manual install</h5>
          <p>
            You can install Sonarr from a .tar.gz archive, but then you handle
            dependencies, installation and permissions yourself.
          </p>
          <DownloadLinks
            links={[
              {
                label: 'macOS Apple silicon',
                detail: 'arm64 .tar.gz',
                href: downloadUrl({ os: 'macos', arch: 'arm64' }),
              },
              {
                label: 'macOS Intel',
                detail: 'x64 .tar.gz',
                href: downloadUrl({ os: 'macos', arch: 'x64' }),
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
                label: 'Sonarr for Apple silicon',
                detail: 'M1 and newer',
                href: downloadUrl({
                  os: 'macos',
                  arch: 'arm64',
                  installer: true,
                }),
              },
              {
                label: 'Sonarr for Intel',
                detail: 'x64',
                href: downloadUrl({
                  os: 'macos',
                  arch: 'x64',
                  installer: true,
                }),
              },
            ]}
          />
        </Step>
        <Step number={2} title="Move it to Applications">
          <p>Open the archive and drag Sonarr into your Applications folder.</p>
          <Note kind="warning">
            On macOS 10.12 and later, Gatekeeper App Translocation stops Sonarr
            from updating itself if it runs from the download location. It must
            live in Applications.
          </Note>
        </Step>
        <Step number={3} title="Self-sign Sonarr">
          <p>Open Terminal and run:</p>
          <CodeBlock
            variants={[
              {
                label: 'zsh',
                code: 'codesign --force --deep -s - /Applications/Sonarr.app && xattr -rd com.apple.quarantine /Applications/Sonarr.app',
              },
            ]}
          />
        </Step>
        <Step number={4} title="Start Sonarr">
          <p>Open Sonarr from your Applications folder.</p>
        </Step>
        <ViewSonarr number={5} isRemote={false} />
      </Steps>
    </Guide>
  );
}

export default MacGuide;
