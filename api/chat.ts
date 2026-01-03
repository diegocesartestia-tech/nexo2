import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'nodejs',
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { history, message, aiName, userName, systemInstruction } = req.body;

    const personalizedInstruction = `
${systemInstruction}

Atualmente, você é "${aiName}" e conversa com "${userName}".
Não deixe o papo morrer. Faça perguntas curtas e empáticas.
`;

    const contents = [
      ...history.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: personalizedInstruction,
        temperature: 0.9,
        topP: 0.9,
      },
    });

    return res.status(200).json({
      text: result.text,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao falar com a Gemini' });
  }
}
