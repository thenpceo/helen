// Vercel Serverless Function — proxy ThePrintSpace order creation
// Keeps API key server-side

const API_BASE = "https://api.creativehub.io";
const API_KEY = process.env.PRINTSPACE_API_KEY || "production-NClQ0TwMl4dRdkKF0DXfYmYw2qbKgSld";

export default async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const { action, ...body } = req.body || {};

	const endpoint = action === "confirm"
		? "/api/v1/orders/confirmed"
		: "/api/v1/orders/embryonic";

	try {
		const response = await fetch(`${API_BASE}${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `ApiKey ${API_KEY}`,
			},
			body: JSON.stringify(body),
		});

		const data = await response.json();
		return res.status(response.status).json(data);
	} catch (error) {
		return res.status(500).json({ error: "Failed to process order" });
	}
}
