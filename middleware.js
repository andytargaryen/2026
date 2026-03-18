import { NextResponse } from 'next/server'

const PASSWORD = process.env.SITE_PASSWORD || 'hernandez2026'

export function middleware(request) {
  const url = request.nextUrl
  const cookie = request.cookies.get('hfb-auth')

  // Already authenticated
  if (cookie?.value === PASSWORD) return NextResponse.next()

  // Login form submission
  if (request.method === 'POST' && url.pathname === '/login') {
    return NextResponse.next()
  }

  // Show login page
  if (url.pathname !== '/login') {
    const loginHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hernandez Budget — Login</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Georgia,serif;background:#FAF7F2;display:flex;align-items:center;justify-content:center;min-height:100vh;color:#2C2416}
    .card{background:#fff;border:1px solid #DDD5C8;border-radius:16px;padding:36px 32px;width:100%;max-width:360px;text-align:center}
    h1{font-size:1.4rem;margin-bottom:6px}
    p{font-size:0.78rem;color:#7A6E60;margin-bottom:24px}
    input{width:100%;padding:12px 14px;border:1px solid #DDD5C8;border-radius:10px;font-size:0.9rem;font-family:Georgia,serif;outline:none;margin-bottom:12px}
    button{width:100%;padding:13px;background:#2C2416;color:#FAF7F2;border:none;border-radius:10px;font-size:0.9rem;font-family:Georgia,serif;font-weight:bold;cursor:pointer}
    .err{color:#C0522A;font-size:0.75rem;margin-bottom:10px}
  </style>
</head>
<body>
  <div class="card">
    <h1>Hernandez Budget</h1>
    <p>Family · 2026</p>
    <form method="POST" action="/__auth">
      <input type="password" name="password" placeholder="Enter password" autofocus/>
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`

    return new NextResponse(loginHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon).*)'],
}
