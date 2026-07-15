export async function onRequestGet(context) {
  try {
    const { env } = context;
    const { results } = await env.DB.prepare("SELECT * FROM signatures ORDER BY created_at ASC").all();
    return Response.json(results);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}

export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const data = await request.json();
    
    if (!data.name || data.x == null || data.y == null) {
      return new Response("Missing required fields", { status: 400 });
    }

    const { success } = await env.DB.prepare(
      "INSERT INTO signatures (name, color, x, y, rotation) VALUES (?, ?, ?, ?, ?)"
    ).bind(
      data.name,
      data.color || "#C5A059",
      data.x,
      data.y,
      data.rotation || 0
    ).run();

    if (success) {
      return Response.json({ success: true });
    } else {
      return new Response("Database error", { status: 500 });
    }
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
