import type { APIRoute } from 'astro';
import { addReplyMsg } from '../../lib/api';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const comment_id = String(form.get('comment_id') || '');
  const username = String(form.get('username') || '');
  const content = String(form.get('content') || '');

  if (!comment_id || !content || content.length > 200 || username.length > 10) {
    return Response.json({ result: { status: false, msg: '回复内容不合法' } }, { status: 400 });
  }

  const response = await addReplyMsg({ comment_id, username: username || undefined, content });
  return Response.json(response || { result: { status: false, msg: '提交失败' } });
};
