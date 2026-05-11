import type { APIRoute } from 'astro';

const UPLOAD_URL = 'https://api.feroad.com/upload';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ result: { status: false, msg: '请选择要上传的图片' } }, { status: 400 });
  }

  const proxyForm = new FormData();
  proxyForm.append('file', file, file.name);

  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: proxyForm,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.imgUrl) {
      return Response.json(
        { result: { status: false, msg: data?.message || '图片上传失败' } },
        { status: response.ok ? 502 : response.status },
      );
    }

    return Response.json({
      result: {
        status: true,
        data: data.imgUrl,
        msg: data.message || '上传成功',
      },
    });
  } catch (error) {
    console.error('Image upload proxy failed', error);
    return Response.json({ result: { status: false, msg: '图片上传服务不可用' } }, { status: 502 });
  }
};
