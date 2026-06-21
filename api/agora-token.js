import { RtcTokenBuilder, RtcRole } from 'agora-token'

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const channelName = req.query.channel
  const uid = req.query.uid || 0

  if (!channelName) {
    res.status(400).json({ error: 'Paramètre "channel" manquant.' })
    return
  }

  const appId = process.env.AGORA_APP_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE

  if (!appId || !appCertificate) {
    res.status(500).json({ error: 'Configuration Agora manquante côté serveur.' })
    return
  }

  const expirationTimeInSeconds = 3600
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    Number(uid),
    RtcRole.PUBLISHER,
    privilegeExpiredTs,
    privilegeExpiredTs
  )

  res.status(200).json({ token, appId })
}
