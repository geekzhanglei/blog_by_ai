import type { APIRoute } from 'astro';
import { addMsg } from '../../lib/api';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const username = String(form.get('username') || '');
  const content = String(form.get('content') || '');

  if (!content || content.length > 400 || username.length > 10) {
    return Response.json({ result: { status: false, msg: '动态内容不合法' } }, { status: 400 });
  }

  const response = await addMsg({ username: username || undefined, content });
  return Response.json(response || { result: { status: false, msg: '提交失败' } });
};
