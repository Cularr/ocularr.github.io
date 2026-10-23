import { InterceptedResponse, json, Resolver } from './http';

export function installXhr(resolve: Resolver) {
  const OriginalXhr = window.XMLHttpRequest;

  class DemoXhr extends OriginalXhr {
    private demoMethod = 'GET';

    private demoUrl: URL | null = null;

    private demoResult: InterceptedResponse | null = null;

    public open(method: string, url: string | URL, ...rest: unknown[]) {
      this.demoMethod = method.toUpperCase();
      this.demoUrl = new URL(String(url), window.location.href);

      return (super.open as (...args: unknown[]) => void)(method, url, ...rest);
    }

    public get status() {
      return this.demoResult ? this.demoResult.status : super.status;
    }

    public get readyState() {
      return this.demoResult ? 4 : super.readyState;
    }

    public get responseText() {
      return this.demoResult ? this.demoResult.body : super.responseText;
    }

    public get response() {
      return this.demoResult ? this.demoResult.body : super.response;
    }

    public getResponseHeader(name: string) {
      if (this.demoResult) {
        return name.toLowerCase() === 'content-type'
          ? this.demoResult.contentType
          : null;
      }

      return super.getResponseHeader(name);
    }

    public getAllResponseHeaders() {
      return this.demoResult
        ? `content-type: ${this.demoResult.contentType}\r\n`
        : super.getAllResponseHeaders();
    }

    public send(body?: Document | XMLHttpRequestBodyInit | null) {
      const url = this.demoUrl;

      if (!url) {
        super.send(body);

        return;
      }

      resolve(this.demoMethod, url, body)
        .catch(() => json(500, { message: 'Demo error', description: '' }))
        .then((result) => {
          if (result === 'passthrough') {
            super.send(body);

            return;
          }

          if (result === 'blocked') {
            this.dispatchEvent(new ProgressEvent('error'));
            this.dispatchEvent(new ProgressEvent('loadend'));

            return;
          }

          this.demoResult = result;
          this.dispatchEvent(new Event('readystatechange'));
          this.dispatchEvent(new ProgressEvent('load'));
          this.dispatchEvent(new ProgressEvent('loadend'));
        });
    }
  }

  window.XMLHttpRequest = DemoXhr;
}
