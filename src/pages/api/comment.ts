import type { APIRoute } from 'astro';
import { addArticleComment, getBlogOptions } from '../../lib/api';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const articleId = String(form.get('articleId') || '');
  const options = await getBlogOptions();
  const nickname = String(form.get('nickname') || options?.result?.articleCommentName || '匿名');
  const email = String(form.get('email') || 'nobody@no.body');
  const website = String(form.get('website') || '');
  const content = String(form.get('content') || '');

  if (!articleId || !nickname || !email || !content) {
    return Response.json({ result: { status: false, msg: '必填项不完整' } }, { status: 400 });
  }

  const response = await addArticleComment({ articleId, nickname, email, website, content });
  return Response.json(response || { result: { status: false, msg: '提交失败' } });
};
