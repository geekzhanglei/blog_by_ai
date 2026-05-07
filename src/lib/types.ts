export interface ApiEnvelope<T = unknown> {
  result?: T;
  message?: string;
}

export interface PaginationResult<T> {
  status: boolean;
  data: T[];
  isPagination?: boolean;
  perpage?: number | string;
  rows?: number;
  msg?: string;
}

export interface ArticleSummary {
  id: number | string;
  title: string;
  introduction: string;
  created_at: number;
}

export interface ArticleDetail extends ArticleSummary {
  username?: string;
  content?: string;
  cont?: string;
  comments?: ArticleComment[];
  marks?: ArticleComment[];
}

export interface ArticleComment {
  id?: number | string;
  nickname: string;
  email?: string;
  website?: string;
  content: string;
  create_time: string | number;
}

export interface BlogMessageReply {
  rId?: number | string;
  replyUserName?: string;
  username?: string;
  content: string;
  createTime?: number;
}

export interface BlogMessage {
  id: number | string;
  username: string;
  content: string;
  created_at: number;
  reply?: BlogMessageReply[];
}
