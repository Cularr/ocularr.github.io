const BASE_URL = 'https://services.sonarr.tv/v1/download/main/latest';

interface DownloadUrlOptions {
  os: 'windows' | 'linux' | 'macos';
  arch?: 'x64' | 'x86' | 'arm' | 'arm64';
  installer?: boolean;
}

function downloadUrl({ os, arch, installer = false }: DownloadUrlOptions) {
  const params = new URLSearchParams({ version: '4', os });

  if (arch) {
    params.set('arch', arch);
  }

  if (installer) {
    params.set('installer', 'true');
  }

  return `${BASE_URL}?${params.toString()}`;
}

export default downloadUrl;
