export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const body = await req.json();
    const { prompt, model = "grok-imagine-1.0-fast", n = 1 } = body;

    const GROK_COOKIE = process.env.GROK_COOKIE;

    const res = await fetch(
      "https://grok.com/rest/app-chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cookie": GROK_COOKIE
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false
        })
      }
    );

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";

    // 提取图片 URL
    const urls = content.match(/https?:\/\/\S+/g) || [];

    return new Response(
      JSON.stringify({
        created: Date.now(),
        data: urls.slice(0, n).map(url => ({ url }))
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
