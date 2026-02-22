const server = Bun.serve({
  routes: {
    "/_health": new Response("OK"),
  },
  // fallback for unmatched routes:
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
