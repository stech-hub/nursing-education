// File: /api/nsbot.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Add your OpenAI API key in Vercel env variables
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body;

  if (!question || question.trim() === "") {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    let prompt = question;

    // Special response for creator query
    const lower = question.toLowerCase();
    if (lower.includes("who created you") || lower.includes("who made you")) {
      return res.status(200).json({
        answer: "Ns Bot was created by Akin S. Sokpah from Liberia and powered by OpenAI."
      });
    }

    // AI response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Ns Bot, a helpful, professional, and friendly nursing assistant AI for students. Answer clearly and concisely, give examples if relevant."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const answer = response.choices[0].message.content.trim();

    res.status(200).json({ answer });

  } catch (error) {
    console.error("Ns Bot Error:", error);
    res.status(500).json({ answer: "Sorry, Ns Bot cannot answer now. Please try again later." });
  }
}
