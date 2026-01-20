import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory user sessions (for demo; production should use DB)
let userSessions = {};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, userId, level } = req.body;

  if (!question || !userId) {
    return res.status(400).json({ error: "Question and userId are required" });
  }

  try {
    // Initialize session
    if (!userSessions[userId]) {
      userSessions[userId] = {
        score: 0,
        questionIndex: 0,
        quizActive: false,
        currentQuiz: [],
      };
    }

    const session = userSessions[userId];

    // Start quiz command
    if (question.toLowerCase().includes("start quiz") || question.toLowerCase().includes("take test")) {
      // Ask AI to generate 50+ mixed questions
      const quizResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Ns Bot, a nursing assistant AI. Generate 50 nursing questions for the user. Mix types: multiple choice, essay/short answer, true/false, fill-in-the-blank. Provide the correct answer for scoring. Respond in JSON: [{question:'', type:'mc/essay/truefalse/fill', options:[], correct:''}]"
          },
          {
            role: "user",
            content: `Generate 50 nursing questions for level ${level || "Freshman"} with mixed types.`
          }
        ],
        temperature: 0.7,
        max_tokens: 6000
      });

      let quiz = [];
      try {
        quiz = JSON.parse(quizResponse.choices[0].message.content);
      } catch (err) {
        return res.status(500).json({ answer: "Error generating quiz. Please try again." });
      }

      session.currentQuiz = quiz;
      session.quizActive = true;
      session.questionIndex = 0;
      session.score = 0;

      const firstQ = quiz[0];
      let msg = `Quiz started! First question:\n${firstQ.question}`;
      if (firstQ.type === "mc") msg += `\nOptions:\n${firstQ.options.join("\n")}`;
      if (firstQ.type === "truefalse") msg += `\nType: True or False`;

      return res.status(200).json({ answer: msg });
    }

    // If quiz is active
    if (session.quizActive) {
      const currentQ = session.currentQuiz[session.questionIndex];
      const userAnswer = question.trim();

      let feedback = "";
      let isCorrect = false;

      // Evaluate based on question type
      if (currentQ.type === "mc" || currentQ.type === "truefalse" || currentQ.type === "fill") {
        if (userAnswer.toLowerCase() === currentQ.correct.toLowerCase()) {
          session.score += 1;
          feedback = "✅ Correct!";
          isCorrect = true;
        } else {
          feedback = `❌ Wrong! Correct answer: ${currentQ.correct}`;
        }
      } else if (currentQ.type === "essay") {
        feedback = `📝 Answer recorded. Correct answer example: ${currentQ.correct}`;
      }

      session.questionIndex += 1;

      if (session.questionIndex >= session.currentQuiz.length) {
        session.quizActive = false;
        return res.status(200).json({
          answer: `${feedback}\n🎉 Quiz finished! Your score: ${session.score}/${session.currentQuiz.length}`
        });
      } else {
        const nextQ = session.currentQuiz[session.questionIndex];
        let msg = `${feedback}\nNext question:\n${nextQ.question}`;
        if (nextQ.type === "mc") msg += `\nOptions:\n${nextQ.options.join("\n")}`;
        if (nextQ.type === "truefalse") msg += `\nType: True or False`;
        return res.status(200).json({ answer: msg });
      }
    }

    // Handle creator query
    const lower = question.toLowerCase();
    if (lower.includes("who created you") || lower.includes("who made you")) {
      return res.status(200).json({
        answer: "Ns Bot was created by Akin S. Sokpah from Liberia and powered by OpenAI."
      });
    }

    // Default AI answer
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Ns Bot, a helpful nursing AI assistant." },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const answer = response.choices[0].message.content.trim();
    res.status(200).json({ answer });

  } catch (err) {
    console.error("Ns Bot Error:", err);
    res.status(500).json({ answer: "Sorry, Ns Bot cannot answer now. Try again later." });
  }
}
