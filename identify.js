const formidable = require("formidable");
const fs = require("fs");

module.exports.config = {
  api: { bodyParser: false }
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "A chave do Pl@ntNet ainda não foi configurada na Vercel." });
  }

  try {
    const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!file || !file.filepath) {
      return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
    }

    const formData = new FormData();
    const buffer = fs.readFileSync(file.filepath);
    const blob = new Blob([buffer], { type: file.mimetype || "image/jpeg" });

    formData.append("images", blob, file.originalFilename || "plant.jpg");
    formData.append("organs", "auto");

    const project = "all";
    const url = `https://my-api.plantnet.org/v2/identify/${project}?api-key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || data?.error || "O Pl@ntNet recusou a solicitação."
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao processar a imagem." });
  }
};
