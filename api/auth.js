export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const { password } = req.body
  const correctPassword = process.env.SITE_PASSWORD || 'hernandez2026'

  if (password === correctPassword) {
    res.setHeader('Set-Cookie', `hfb-auth=${correctPassword}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`)
    res.redirect(302, '/')
  } else {
    res.redirect(302, '/?error=1')
  }
}
