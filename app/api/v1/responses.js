export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const body = await req.json();
    const { model = "grok-4", input, stream = false } = body;

    const GROK_COOKIE = process.env.GROK_COOKIE;

    const messages = [
      {
        role: "user",
        content: input
      }
    ];

    const res = await fetch(
      "https://grok.com/rest/app-chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "cookie": GROK_COOKIE,
          "accept": "text/event-stream"
        },
        body: JSON.stringify({
          model,
          messages,
          stream
        })
      }
    );

    // 非流式
    if (!stream) {
      const data = await res.json();

      return new Response(
        JSON.stringify({
          id: "resp_" + Date.now(),
          object: "response",
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: data?.choices?.[0]?.message?.content || ""
                }
              ]
            }
          ]
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 流式
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const streamRes = new ReadableStream({
      async start(controller) {
        const reader = res.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          controller.enqueue(encoder.encode(decoder.decode(value)));
        }

        controller.close();
      }
    });

    return new Response(streamRes, {
      headers: {
        "Content-Type": "text/event-stream"
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
