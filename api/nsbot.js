// api/nsbot.js
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req,res){
  if(req.method !== "POST") return res.status(405).json({error:"Method not allowed"});

  const { question, userId, level } = req.body;
  if(!question || question.trim() === "") return res.status(400).json({error:"Question is required"});

  const lower = question.toLowerCase();

  try{
    // Creator response
    if(lower.includes("who created you") || lower.includes("who made you")){
      return res.status(200).json({answer:"Ns Bot was created by Akin S. Sokpah from Liberia and powered by OpenAI."});
    }

    // Start Quiz
    if(lower.includes("start quiz")){
      const lvl = level || "Freshman I";

      // Ask AI to generate quiz
      const prompt = `
      You are Ns Bot, a nursing AI assistant. Generate 50 questions for nursing students level: ${lvl}.
      Include mixed types: Multiple Choice (with 4 options, mark correct answer), True/False, Fill-in-the-blank, Essay.
      Return as JSON array like this:
      [
        { "type": "mc", "question": "...", "options": ["A: ...","B: ...","C: ...","D: ..."], "correct": "A" },
        { "type": "truefalse", "question": "...", "options": ["True","False"], "correct": "True" },
        { "type": "fill", "question": "...", "correct": "..." },
        { "type": "essay", "question": "...", "correct": "..." }
      ]
      Only return JSON array.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages:[
          {role:"system", content:"You are Ns Bot, a professional nursing AI assistant."},
          {role:"user", content: prompt}
        ],
        temperature:0.8,
        max_tokens:4000
      });

      const text = response.choices[0].message.content.trim();

      // Parse JSON safely
      let quiz = [];
      try{ quiz = JSON.parse(text); } catch(e){ return res.status(500).json({answer:"Error generating quiz. AI response invalid JSON.", quiz: []}); }

      return res.status(200).json({answer:`Quiz for ${lvl} generated!`, quiz});
    }

    // Default AI response
    const chatResponse = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[
        {role:"system", content:"You are Ns Bot, a professional nursing AI assistant."},
        {role:"user", content: question}
      ],
      temperature:0.7,
      max_tokens:300
    });

    const answer = chatResponse.choices[0].message.content.trim();
    res.status(200).json({answer});

  } catch(err){
    console.error("Ns Bot API Error:",err);
    res.status(500).json({answer:"Sorry, Ns Bot cannot answer right now."});
  }
}
