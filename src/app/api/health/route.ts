// Health check para uptime monitoring (UptimeRobot/BetterStack)
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
}
