export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    service: "Ndev Bot & Mini App Serverless API",
    timestamp: new Date().toISOString()
  });
}
