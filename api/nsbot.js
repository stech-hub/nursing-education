// api/nsbot.js
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sample question sets per level (replace/add 50+ questions for each)
const quizzes = {
  "Freshman I": [
    { type: "mc", question: "What is the normal body temperature?", options: ["A: 36.5°C","B: 38°C","C: 35°C","D: 37.5°C"], correct:"A" },
    { type: "truefalse", question: "The heart has four chambers.", options:["True","False"], correct:"True" },
    { type: "fill", question: "The largest organ in the human body is the ____.", correct:"skin" },
    { type: "essay", question: "Explain the process of wound healing.", correct:"Wound healing occurs in phases: hemostasis, inflammation, proliferation, remodeling." },
    // ...add more 50+ questions
  ],
  "Freshman II": [
    { type: "mc", question: "Which vitamin is essential for blood clotting?", options:["A: Vitamin C","B: Vitamin K","C: Vitamin D","D: Vitamin B12"], correct:"B" },
    { type: "truefalse", question: "Red blood cells are produced in the liver.", options:["True","False"], correct:"False" },
    { type: "fill", question: "The functional unit of the kidney is called the ____.", correct:"nephron" },
    { type: "essay", question: "Describe the steps of administering an intramuscular injection.", correct:"Steps include hand hygiene, selecting site, cleaning, inserting needle at 90°, aspirate, inject medication slowly, withdraw needle, dispose safely." },
    // ...add more 50+ questions
  ],
  "Sophomore": [
    // Add 50+ mixed questions for Sophomore
  ],
  "Junior": [
    // Add 50+ mixed questions for Junior
  ],
  "Senior": [
    // Add 50+ mixed questions for Senior
  ]
};

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});

  const { question, userId, level } = req.body;
  if(!question || question.trim()==="") return res.status(400).json({error:"Question is required"});

  const lower = question.toLowerCase();

  try{
    // Creator query
    if(lower.includes("who created you") || lower.includes("who made you")){
      return res.status(200).json({answer:"Ns Bot was created by Akin S. Sokpah from Liberia and powered by OpenAI."});
    }

    // Start Quiz
    if(lower.includes("start quiz")){
      const lvl = level || "Freshman I";
      const quizSet = quizzes[lvl];
      if(!quizSet || quizSet.length===0) return res.status(200).json({answer:`No quiz available for ${lvl}.`, quiz:[]});
      return res.status(200).json({answer:`Quiz for ${lvl} generated!`, quiz: quizSet});
    }

    // Default AI response
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
