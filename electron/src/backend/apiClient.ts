import { WEB_BASE } from '../buildConfig';
import { getHwid } from './hwid';
import { captureFromJson } from './release';
import { getAppVersion } from './appVersion';

export interface ApiFetchInit extends Omit<RequestInit, 'headers'> {
  token?: string | null;
  headers?: Record<string, string>;
}

function captureReleaseFromResponse(resp: Response): void {
  const ct = resp.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('application/json')) return;
  resp
    .clone()
    .json()
    .then((payload) => captureFromJson(payload))
    .catch(() => {
      /* malformed JSON — nothing to capture */
    });
}

export async function apiFetch(pathOrUrl: string, init: ApiFetchInit = {}): Promise<Response> {
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `${WEB_BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

  const headers: Record<string, string> = {
    'X-Bisbi-Device': getHwid(),
    'X-Bisbi-Version': getAppVersion(),
    'X-Bisbi-Platform': `${process.platform}-${process.arch}`,
    ...(init.headers ?? {}),
  };

  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  const { token: _token, headers: _h, ...rest } = init;
  const resp = await fetch(url, { ...rest, headers });
  captureReleaseFromResponse(resp);
  return resp;
}
