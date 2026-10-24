const BASE_URL = 'https://system.ocularr.ink/v1/update/master/updatefile';

interface DownloadUrlOptions {
  os: 'windows' | 'linux' | 'osx';
  arch?: 'x64' | 'x86' | 'arm' | 'arm64';
  installer?: boolean;
}

function downloadUrl({ os, arch, installer = false }: DownloadUrlOptions) {
  const params = new URLSearchParams({ os });

  if (arch) {
    params.set('arch', arch);
  }

  if (installer) {
    params.set('installer', 'true');
  }

  return `${BASE_URL}?${params.toString()}`;
}

export default downloadUrl;
