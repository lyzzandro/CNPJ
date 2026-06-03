export default async function handler(req, res) {
  const { cnpj } = req.query;

  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ erro: "Erro interno ao consultar a API." });
  }
}