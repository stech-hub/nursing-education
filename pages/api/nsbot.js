import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Make sure this is set in Vercel
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ answer: "Method not allowed" });

  const { question, level } = req.body;
  if (!question || question.trim() === "") return res.status(400).json({ answer: "Question is required" });

  try {
    // AI generates answer or quiz
    let prompt = "";
    const lower = question.toLowerCase();

    if (lower.includes("start quiz")) {
      const lvl = level || "Freshman I";
      prompt = `
        You are Ns Bot, a professional nursing assistant AI.
        Generate 50 nursing questions for level: ${lvl}.
        Include multiple choice, true/false, fill-in-the-blank, essay.
        Return as JSON array:
        [
          { "type": "mc", "question": "...", "options": ["A: ...","B: ...","C: ...","D: ..."], "correct": "A" },
          { "type": "truefalse", "question": "...", "options": ["True","False"], "correct": "True" },
          { "type": "fill", "question": "...", "correct": "..." },
          { "type": "essay", "question": "...", "correct": "..." }
        ]
      `;
    } else if (lower.includes("who created you")) {
      return res.status(200).json({ answer: "Ns Bot was created by Akin S. Sokpah from Liberia and powered by OpenAI." });
    } else {
      prompt = `You are Ns Bot, a professional nursing AI. Answer this question concisely: ${question}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You are Ns Bot, nursing AI assistant." }, { role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    });

    let answer = response.choices[0].message.content.trim();
    
    // If quiz request, parse JSON
    if (lower.includes("start quiz")) {
      try {
        answer = JSON.parse(answer);
      } catch (e) {
        return res.status(500).json({ answer: "Error generating quiz. AI returned invalid JSON.", quiz: [] });
      }
      return res.status(200).json({ answer: `Quiz generated for ${level}`, quiz: answer });
    }

    res.status(200).json({ answer });
  } catch (err) {
    console.error("Ns Bot API Error:", err);
    res.status(500).json({ answer: "Ns Bot cannot answer right now." });
  }
}
