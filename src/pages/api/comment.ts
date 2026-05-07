import type { APIRoute } from 'astro';
import { addArticleComment } from '../../lib/api';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const articleId = String(form.get('articleId') || '');
  const nickname = String(form.get('nickname') || '');
  const email = String(form.get('email') || '');
  const website = String(form.get('website') || '');
  const content = String(form.get('content') || '');

  if (!articleId || !nickname || !email || !content) {
    return Response.json({ result: { status: false, msg: '必填项不完整' } }, { status: 400 });
  }

  const response = await addArticleComment({ articleId, nickname, email, website, content });
  return Response.json(response || { result: { status: false, msg: '提交失败' } });
};
