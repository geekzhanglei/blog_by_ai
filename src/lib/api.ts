import type {
  ApiEnvelope,
  ArticleDetail,
  ArticleSummary,
  BlogMessage,
  PaginationResult
} from './types';

const DEFAULT_API_BASE_URL = 'https://blog.feroad.com';

export const apiBaseUrl = (
  import.meta.env.API_BASE_URL ||
  import.meta.env.PUBLIC_API_BASE_URL ||
  DEFAULT_API_BASE_URL
).replace(/\/$/, '');

function makeUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(path, `${apiBaseUrl}/`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url;
}

async function request<T>(path: string, init?: RequestInit, params?: Record<string, string | number | undefined>): Promise<T | null> {
  const url = makeUrl(path, params);
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {})
      }
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.error(`API request failed: ${url.toString()}`, error);
    return null;
  }
}

export async function postForm<T>(path: string, data: Record<string, string | number | undefined>): Promise<T | null> {
  const body = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) body.set(key, String(value));
  });

  return request<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body
  });
}

export function getArticleList(curpage = 1) {
  return request<ApiEnvelope<PaginationResult<ArticleSummary>>>('/blogapi/article', undefined, { curpage });
}

export function getArticle(id: string | number) {
  return request<ApiEnvelope<ArticleDetail | (ArticleDetail & { data?: ArticleDetail })>>('/blogapi/article/detail', undefined, { id });
}

export function getMsgList(curpage = 1) {
  return request<ApiEnvelope<PaginationResult<BlogMessage>>>('/blogapi/msg', undefined, { curpage });
}

export function addArticleComment(data: {
  articleId: string | number;
  nickname: string;
  email: string;
  website?: string;
  content: string;
}) {
  return postForm<ApiEnvelope<{ status: boolean; msg?: string }>>('/blogapi/article/marks/add', data);
}

export function addMsg(data: { username: string; content: string }) {
  return postForm<ApiEnvelope<{ status: boolean; msg?: string }>>('/blogapi/msg/add', data);
}

export function addReplyMsg(data: { comment_id: string | number; username: string; content: string }) {
  return postForm<ApiEnvelope<{ status: boolean; msg?: string }>>('/blogapi/msg/replyadd', data);
}

export function adminLogin(data: { username: string; password: string }) {
  return postForm<ApiEnvelope<{ status: boolean; token?: string; msg?: string }>>('/blogapi/admin/login', data);
}
