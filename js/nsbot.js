const nsBtn = document.getElementById('nsbot-btn');
const nsChat = document.getElementById('nsbot-chat');
const nsSend = document.getElementById('nsbot-send');
const nsInput = document.getElementById('nsbot-input');
const nsMessages = document.getElementById('nsbot-messages');

let userId = "user_" + Math.floor(Math.random() * 100000);

nsBtn.addEventListener('click', () => {
  nsChat.style.display = nsChat.style.display === 'block' ? 'none' : 'block';
});

async function sendMessage() {
  let userText = nsInput.value.trim();
  if(!userText) return;
  appendMessage("You", userText);
  nsInput.value = '';

  try {
    const response = await fetch('/api/nsbot', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({question: userText, userId, level:"Freshman"})
    });
    const data = await response.json();

    if(data.answer.includes("Options:")) {
      let parts = data.answer.split("Options:");
      appendMessage("Ns Bot", parts[0].trim());
      let options = parts[1].trim().split("\n");
      showOptions(options);
    } else {
      appendMessage("Ns Bot", data.answer);
    }

  } catch(err) {
    appendMessage("Ns Bot","Error contacting Ns Bot.");
  }
}

function appendMessage(sender,text){
  const msg = document.createElement('div');
  msg.style.marginBottom='10px';
  msg.innerHTML=`<b>${sender}:</b> ${text}`;
  nsMessages.appendChild(msg);
  nsMessages.scrollTop = nsMessages.scrollHeight;
}

function showOptions(options){
  const container = document.createElement('div');
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.style.margin = "5px";
    btn.style.padding = "5px 10px";
    btn.style.cursor = "pointer";
    btn.onclick = () => {
      nsInput.value = opt.split(":")[0];
      sendMessage();
      container.remove();
    };
    container.appendChild(btn);
  });
  nsMessages.appendChild(container);
  nsMessages.scrollTop = nsMessages.scrollHeight;
}

nsSend.addEventListener('click', sendMessage);
nsInput.addEventListener('keyup', function(e){
  if(e.key === "Enter") sendMessage();
});
