// api/nsbot.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Example quiz template (replace with real 50+ questions per level)
const sampleQuiz = [
  {
    type: "mc",
    question: "What is the normal body temperature?",
    options: ["A: 36.5°C", "B: 38°C", "C: 35°C", "D: 37.5°C"],
    correct: "A"
  },
  {
    type: "truefalse",
    question: "The heart has four chambers.",
    options: ["True","False"],
    correct: "True"
  },
  {
    type: "fill",
    question: "Fill in the blank: The largest organ in the human body is the ____.",
    correct: "skin"
  },
  {
    type: "essay",
    question: "Explain the process of wound healing.",
    correct: "Wound healing occurs in phases: hemostasis, inflammation, proliferation, and remodeling."
  },
  // ... add 50+ mixed questions for each level
];

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  
  const { question, userId, level } = req.body;
  
  if(!question || question.trim()==="") return res.status(400).json({error:"Question is required"});
  
  try{
    const lower = question.toLowerCase();

    // Special creator response
    if(lower.includes("who created you") || lower.includes("who made you")){
      return res.status(200).json({answer:"Ns Bot was created by Akin S. Sokpah from Liberia and powered by OpenAI."});
    }

    // Start quiz command
    if(lower.includes("start quiz")){
      // Here you can dynamically choose quiz by level
      let quizSet = sampleQuiz; // Replace with level-based question sets
      return res.status(200).json({answer:"Quiz generated!", quiz: quizSet});
    }

    // Default AI response for other questions
    const response = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[
        {role:"system", content:"You are Ns Bot, a professional nursing AI assistant. Answer concisely."},
        {role:"user", content: question}
      ],
      temperature:0.7,
      max_tokens:300
    });

    const answer = response.choices[0].message.content.trim();
    res.status(200).json({answer});

  } catch(err){
    console.error("Ns Bot API Error:",err);
    res.status(500).json({answer:"Sorry, Ns Bot cannot answer right now. Please try again later."});
  }
}
