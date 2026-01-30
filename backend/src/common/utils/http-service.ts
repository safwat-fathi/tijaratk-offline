import { RequestTimeoutException } from '@nestjs/common';

export interface HttpServiceOptions extends RequestInit {
  baseUrl?: string;
  timeout?: number; // in milliseconds
}

enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

type HttpResponse<T> = [T | null, Error | null];

export class HttpService {
  private baseUrl: string;
  private timeout: number;

  constructor(options?: { baseUrl?: string; timeout?: number }) {
    this.baseUrl = options?.baseUrl || '';
    this.timeout = options?.timeout || 5000; // default timeout 5 seconds
  }

  /**
   * Builds the full URL with query parameters.
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = this.baseUrl ? `${this.baseUrl}${endpoint}` : endpoint;
    if (params) {
      const query = new URLSearchParams();
      for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
          query.append(key, params[key]);
        }
      }
      url += `?${query.toString()}`;
    }
    return url;
  }

  /**
   * General request method handling timeout and baseUrl.
   */
  private async request<T>(
    url: string,
    options: HttpServiceOptions,
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const id = setTimeout(
      () => controller.abort(),
      options.timeout || this.timeout,
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `HTTP error status: ${response.status}, body: ${errorBody}`,
        );
      }

      if (response.status === 204) {
        return [{} as T, null];
      }

      // Assuming JSON response
      const data = await response.json();
      return [data as T, null];
    } catch (error) {
      if (error.name === 'AbortError') {
        return [
          null,
          new RequestTimeoutException(
            `Request to ${url} timed out after ${this.timeout}ms`,
          ),
        ];
      }

      return [null, error];
    } finally {
      clearTimeout(id);
    }
  }

  /**
   * Makes a GET request.
   */
  public get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestInit,
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, { ...options, method: HttpMethod.GET });
  }

  /**
   * Makes a POST request.
   */
  public post<T>(
    endpoint: string,
    body: any,
    params?: Record<string, any>,
    options?: RequestInit,
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, {
      ...options,
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Makes a PUT request.
   */
  public put<T>(
    endpoint: string,
    body: any,
    params?: Record<string, any>,
    options?: RequestInit,
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, {
      ...options,
      method: HttpMethod.PUT,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      body: JSON.stringify(body),
    });
  }

  /**
   * Makes a DELETE request.
   */
  public delete<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: RequestInit,
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, { ...options, method: HttpMethod.DELETE });
  }
}
