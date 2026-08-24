import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Rota de proxy para o Qwen via OpenRouter
  app.post("/api/gemini", async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { prompt, customApiKey } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "O prompt é obrigatório." });
        return;
      }

      const apiKey = customApiKey || process.env.QWEN_API_KEY;

      if (!apiKey) {
        res.status(400).json({ 
          error: "Chave de API não fornecida. Insira sua chave do OpenRouter/Qwen na barra lateral." 
        });
        return;
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen-2.5-72b-instruct",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Erro retornado pela API do Qwen.");
      }

      const generatedText = data.choices[0].message.content;
      res.json({ text: generatedText });

    } catch (error: any) {
      console.error("Erro na chamada do Qwen:", error);
      res.status(500).json({ 
        error: error.message || "Erro interno ao processar a requisição com o Qwen." 
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SUS-Digital Server] Servidor executando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Falha ao iniciar o servidor:", err);
});