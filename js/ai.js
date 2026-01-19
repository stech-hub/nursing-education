const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

async function sendMessage() {
  const userText = userInput.value.trim();
  if (!userText) return;

  appendMessage(userText, "user");
  userInput.value = "";

  // Ns Bot special response
  if (userText.toLowerCase().includes("who created you")) {
    appendMessage("I was created by Akin S. Sokpah and powered by OpenAI.", "bot");
    return;
  }

  // OpenAI API call
  const response = await fetch("/api/openai", {   // Endpoint on your Vercel deployment
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: userText })
  });

  const data = await response.json();
  appendMessage(data.response || "Sorry, I cannot answer that.", "bot");
}

function appendMessage(message, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.innerText = message;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMessage();
});
