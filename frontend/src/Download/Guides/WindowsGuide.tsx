import React from 'react';
import DownloadLinks from 'Download/Components/DownloadLinks';
import Guide from 'Download/Components/Guide';
import Note from 'Download/Components/Note';
import Step from 'Download/Components/Step';
import Steps from 'Download/Components/Steps';
import ViewSonarr from 'Download/Components/ViewSonarr';
import downloadUrl from 'Download/downloadUrl';

function WindowsGuide() {
  return (
    <Guide
      maintainers={[{ name: 'Team Sonarr' }]}
      intro={
        <>
          <p>
            Sonarr runs natively on Windows 8.1 and Server 2012 or later. It can
            be installed as a Windows Service or as a System Tray Application.
          </p>
          <Note title="Service or tray app?">
            <p>
              A Windows Service keeps running when nobody is logged in, but it
              cannot reach mapped drives (X:\) or UNC paths (\\server\share)
              without extra configuration. It also runs as the Local Service
              account, which has no access to your user folder unless you grant
              it.
            </p>
            <p>
              If the user can stay logged in, pick the System Tray Application
              in the installer.
            </p>
          </Note>
        </>
      }
      upgrade={
        <Note title="Upgrading from v3">
          The installer converts an existing Sonarr v3 installation. Back up
          your v3 data first.
        </Note>
      }
      alternatives={
        <>
          <h5>Manual install</h5>
          <p>
            You can install Sonarr from a .zip archive, but then you handle
            dependencies, installation and permissions yourself.
          </p>
          <DownloadLinks
            links={[
              {
                label: 'Windows x64',
                detail: '.zip',
                href: downloadUrl({ os: 'windows', arch: 'x64' }),
              },
              {
                label: 'Windows x86',
                detail: '.zip',
                href: downloadUrl({ os: 'windows', arch: 'x86' }),
              },
            ]}
          />
        </>
      }
    >
      <Steps>
        <Step number={1} title="Download and run the installer">
          <DownloadLinks
            links={[
              {
                label: 'Windows installer',
                detail: 'x64 · 64-bit',
                href: downloadUrl({
                  os: 'windows',
                  arch: 'x64',
                  installer: true,
                }),
              },
              {
                label: 'Windows installer',
                detail: 'x86 · 32-bit',
                href: downloadUrl({
                  os: 'windows',
                  arch: 'x86',
                  installer: true,
                }),
              },
            ]}
          />
        </Step>
        <ViewSonarr number={2} isRemote={false} />
      </Steps>
    </Guide>
  );
}

export default WindowsGuide;
