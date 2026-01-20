document.addEventListener("DOMContentLoaded", ()=>{
  const nsBtn = document.getElementById('nsbot-btn');
  const nsChat = document.getElementById('nsbot-chat');
  const nsSend = document.getElementById('nsbot-send');
  const nsInput = document.getElementById('nsbot-input');
  const nsMessages = document.getElementById('nsbot-messages');

  let userId = "user_"+Math.floor(Math.random()*100000);
  let quizActive=false;
  let currentQuiz=[];
  let questionIndex=0;
  let score=0;
  let currentLevel="Freshman I";

  nsBtn.addEventListener('click', ()=>{ nsChat.style.display = nsChat.style.display==='block'?'none':'block'; });

  function appendMessage(sender,text){
    const msg = document.createElement('div');
    msg.style.marginBottom='10px';
    msg.innerHTML=`<b>${sender}:</b> ${text}`;
    nsMessages.appendChild(msg);
    nsMessages.scrollTop=nsMessages.scrollHeight;
    const utter = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utter);
  }

  function showOptions(options){
    const container = document.createElement('div');
    options.forEach(opt=>{
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.margin="5px"; btn.style.padding="5px 10px"; btn.style.cursor="pointer";
      btn.onclick = ()=>{
        nsInput.value = opt.split(":")[0];
        sendMessage();
        container.remove();
      };
      container.appendChild(btn);
    });
    nsMessages.appendChild(container);
    nsMessages.scrollTop=nsMessages.scrollHeight;
  }

  function showNextQuestion(){
    const q = currentQuiz[questionIndex];
    if(!q) return;
    let text = `Question ${questionIndex+1}/${currentQuiz.length}:\n${q.question}`;
    if(q.type==="mc") text+="\nOptions:\n"+q.options.join("\n");
    if(q.type==="truefalse") text+="\nType: True or False";
    appendMessage("Ns Bot",text);
    if(q.type==="mc"||q.type==="truefalse") showOptions(q.options);
  }

  async function sendMessage(){
    const question = nsInput.value.trim();
    if(!question) return;
    appendMessage("You",question);
    nsInput.value='';

    const lower = question.toLowerCase();

    if(lower.includes("who created you") || lower.includes("who made you")){
      appendMessage("Ns Bot","Ns Bot was created by Akin S. Sokpah from Liberia and powered by OpenAI.");
      return;
    }

    if(lower.startsWith("set level ")){
      currentLevel = question.slice(10).trim();
      appendMessage("Ns Bot",`Level set to ${currentLevel}. You can now start quiz.`);
      return;
    }

    if(lower.includes("start quiz")){
      appendMessage("Ns Bot",`Generating quiz for ${currentLevel}...`);
      try{
        const res = await fetch('/api/nsbot',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({question,userId,level:currentLevel})
        });
        const data = await res.json();
        if(!data.quiz || !data.quiz.length) return appendMessage("Ns Bot","Error generating quiz.");
        currentQuiz=data.quiz;
        quizActive=true; questionIndex=0; score=0;
        showNextQuestion();
      } catch(err){ appendMessage("Ns Bot","Error generating quiz."); }
      return;
    }

    if(quizActive){
      const currentQ=currentQuiz[questionIndex];
      let feedback="";
      if(currentQ.type==="mc"||currentQ.type==="truefalse"||currentQ.type==="fill"){
        if(question.toLowerCase()===currentQ.correct.toLowerCase()) feedback="✅ Correct!";
        else feedback=`❌ Wrong! Correct: ${currentQ.correct}`;
      } else if(currentQ.type==="essay"){
        feedback=`📝 Answer recorded. Sample: ${currentQ.correct}`;
      }

      questionIndex++;
      if(questionIndex>=currentQuiz.length){
        quizActive=false;
        appendMessage("Ns Bot",`${feedback}\n🎉 Quiz finished! Score: ${score}/${currentQuiz.length}`);
        return;
      } else{
        appendMessage("Ns Bot",feedback);
        showNextQuestion();
        return;
      }
    }

    // Default AI
    try{
      const res=await fetch('/api/nsbot',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({question,userId})
      });
      const data=await res.json();
      appendMessage("Ns Bot",data.answer);
    }catch(err){ appendMessage("Ns Bot","Ns Bot cannot answer now."); }
  }

  nsSend.addEventListener('click',sendMessage);
  nsInput.addEventListener('keyup',e=>{ if(e.key==="Enter") sendMessage(); });
});
