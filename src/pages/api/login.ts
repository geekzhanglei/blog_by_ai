import type { APIRoute } from 'astro';
import { adminLogin } from '../../lib/api';

export const POST: APIRoute = async ({ cookies, request }) => {
  const form = await request.formData();
  const username = String(form.get('username') || '');
  const password = String(form.get('password') || '');

  if (!username || !password) {
    return Response.json({ result: { status: false, msg: '帐号或密码不能为空' } }, { status: 400 });
  }

  const response = await adminLogin({ username, password });
  const token = response?.result?.token;
  if (response?.result?.status && token) {
    cookies.set('blog_admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: new URL(request.url).protocol === 'https:',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return Response.json(response || { result: { status: false, msg: '登录失败' } });
};
