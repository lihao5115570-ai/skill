const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=86400",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function readMetaImage(html) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /"avatarLarger"[^[]+\["([^"]+)"/i,
    /"avatarMedium"[^[]+\["([^"]+)"/i,
    /"avatarThumb"[^[]+\["([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].replace(/\\u002F/g, "/").replace(/&amp;/g, "&");
  }
  return "";
}

export async function onRequestGet(context) {
  const target = new URL(context.request.url).searchParams.get("url");
  if (!target) return jsonResponse({ ok: false, message: "缺少抖音主页链接" }, 400);

  let url;
  try {
    url = new URL(target);
  } catch {
    return jsonResponse({ ok: false, message: "抖音主页链接格式异常" }, 400);
  }

  const allowedHosts = new Set(["www.douyin.com", "douyin.com", "v.douyin.com", "jingxuan.douyin.com"]);
  if (!allowedHosts.has(url.hostname)) {
    return jsonResponse({ ok: false, message: "只允许解析抖音链接" }, 400);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!response.ok) return jsonResponse({ ok: false, message: "抖音头像请求失败" }, 502);

    const html = await response.text();
    const avatar = readMetaImage(html);
    if (!avatar) return jsonResponse({ ok: false, message: "未找到抖音头像" }, 404);
    return jsonResponse({ ok: true, avatar });
  } catch {
    return jsonResponse({ ok: false, message: "抖音头像解析超时或失败" }, 504);
  }
}
