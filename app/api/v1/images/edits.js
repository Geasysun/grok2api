export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const formData = await req.formData();

    const prompt = formData.get("prompt") || "";
    const model = "grok-imagine-1.0-fast";

    const GROK_COOKIE = process.env.GROK_COOKIE;

    const finalPrompt = `Edit image: ${prompt}`;

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
          messages: [{ role: "user", content: finalPrompt }],
          stream: false
        })
      }
    );

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";

    const match = content.match(/https?:\/\/\S+/);

    return new Response(
      JSON.stringify({
        created: Date.now(),
        data: [{ url: match ? match[0] : "" }]
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
