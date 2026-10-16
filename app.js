const WHATSAPP_NUMBER = ''; // Configurar antes de publicar: formato internacional, sem + nem espaços.
const storeKey = 'wave-ai-draft-v1';
const state = { services: [], answers: {}, current: 0, started: false };
const questions = [
  { id: 'goal', text: 'Qual é o principal objetivo deste projeto?', placeholder: 'Ex.: atrair mais clientes, lançar uma marca…', options: ['Atrair mais clientes', 'Dar mais força à marca', 'Lançar algo novo'] },
  { id: 'context', text: 'Conte-me um pouco sobre o seu projeto ou negócio.', placeholder: 'Ex.: tenho um restaurante, uma marca de roupa…', options: [] },
  { id: 'scope', text: '', placeholder: 'Partilhe os detalhes que já tiver em mente…', options: [] },
  { id: 'timing', text: 'Há alguma data ou prazo importante?', placeholder: 'Ex.: até ao final do mês, ainda estou a definir…', options: ['O mais depressa possível', 'Nas próximas semanas', 'Ainda estou a definir'] }
];
const screens = ['landing','services','chat','summary','whatsapp'];
const $ = (s) => document.querySelector(s);
const escapeHtml = (value='') => value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

function persist(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
function restore(){ try { Object.assign(state, JSON.parse(localStorage.getItem(storeKey)) || {}); } catch {} }
function show(name){
  screens.forEach(id => { const el=$('#'+id); const active=id===name; el.hidden=!active; el.classList.toggle('is-active',active); });
  $('#restart-button').hidden=name==='landing';
  window.scrollTo({top:0,behavior:'smooth'});
}
function selectedServices(){ return state.services.join(', ') || 'uma solução à medida'; }
function scopeQuestion(){
  const s=state.services;
  if(s.includes('Website')) return 'O que gostaria que o website fizesse por si? Pode referir páginas, funcionalidades ou referências.';
  if(s.includes('Redes sociais')) return 'Em que redes quer estar presente e o que gostaria de comunicar?';
  if(s.includes('Fotografia') || s.includes('Vídeo')) return 'Que tipo de imagens ou vídeo imagina? Há local, data ou referências a considerar?';
  return 'O que imagina para dar mais força à sua presença e comunicação?';
}
function answerLabel(id){ return state.answers[id] || 'A definir'; }
function renderServices(){
  document.querySelectorAll('.service-card').forEach(card=>card.classList.toggle('selected',state.services.includes(card.dataset.service)));
  $('#service-next').disabled=!state.services.length;
}
function addMessage(text, who){
  const box=$('#chat-messages'); const item=document.createElement('div'); item.className='message '+who;
  item.innerHTML=who==='bot'?`<div class="bot-label">WAVE AI</div>${escapeHtml(text)}`:escapeHtml(text); box.appendChild(item); box.scrollTop=box.scrollHeight;
}
function showTyping(){
  const box=$('#chat-messages'); const item=document.createElement('div'); item.className='typing'; item.setAttribute('aria-label','Wave AI está a escrever');
  item.innerHTML='<i></i><i></i><i></i>'; box.appendChild(item); box.scrollTop=box.scrollHeight;
}
function renderQuestion(){
  const question=questions[state.current];
  if(!question) return finishChat();
  if(question.id==='scope') question.text=scopeQuestion();
  $('#chat-messages').innerHTML='';
  addMessage('Olá! Vamos preparar um briefing simples para a Wave Studio.', 'bot');
  questions.slice(0,state.current).forEach((previous, index)=>{
    if(previous.id==='scope') previous.text=scopeQuestion();
    addMessage(previous.text,'bot');
    addMessage(state.answers[previous.id] || 'A definir','user');
    if(index === state.current - 1) addMessage('Perfeito, obrigado.', 'bot');
  });
  addMessage(question.text,'bot');
  $('#answer-input').value=''; $('#answer-input').placeholder=question.placeholder;
  $('#chat-progress-label').textContent=`Pergunta ${state.current+1} de ${questions.length}`;
  $('#chat-progress').style.width=`${((state.current+1)/questions.length)*100}%`;
  const opt=$('#quick-options'); opt.innerHTML=''; question.options.forEach(v=>{const b=document.createElement('button');b.className='quick-option';b.type='button';b.textContent=v;b.onclick=()=>submitAnswer(v);opt.appendChild(b)});
}
function submitAnswer(value){
  const answer=value.trim(); if(!answer) return;
  const question=questions[state.current]; state.answers[question.id]=answer; persist();
  addMessage(answer,'user'); showTyping(); $('#answer-input').disabled=true;
  setTimeout(()=>{ state.current++; $('#answer-input').disabled=false; renderQuestion(); },520);
}
function finishChat(){ persist(); renderSummary(); show('summary'); }
function renderSummary(){
  const rows=[['Serviços',selectedServices(),'services'],['Objetivo',answerLabel('goal'),'goal'],['Projeto ou negócio',answerLabel('context'),'context'],['Necessidades e detalhes',answerLabel('scope'),'scope'],['Prazo',answerLabel('timing'),'timing']];
  $('#brief-card').innerHTML=rows.map(([label,value,id])=>`<div class="brief-row"><span class="brief-label">${label}</span><span class="brief-value" data-value="${id}">${escapeHtml(value)}</span><button class="brief-edit" type="button" data-edit="${id}" aria-label="Editar ${label}">⌕</button></div>`).join('');
  document.querySelectorAll('[data-edit]').forEach(btn=>btn.onclick=()=>editBrief(btn.dataset.edit));
}
function editBrief(id){
  if(id==='services'){ show('services'); return; }
  const el=document.querySelector(`[data-value="${id}"]`); const old=state.answers[id]||''; el.innerHTML=`<input class="brief-edit-input" value="${escapeHtml(old)}" aria-label="Editar">`;
  const input=el.firstElementChild; input.focus(); input.select();
  const commit=()=>{state.answers[id]=input.value.trim()||'A definir'; persist(); renderSummary();}; input.onblur=commit; input.onkeydown=e=>{if(e.key==='Enter') input.blur();};
}
function createMessage(){
  const name=state.answers.name ? `, sou ${state.answers.name}` : '';
  return `Olá${name}.\n\nGostava de falar com a Wave Studio sobre ${selectedServices()}.\n\nObjetivo: ${answerLabel('goal')}\nProjeto/negócio: ${answerLabel('context')}\nDetalhes: ${answerLabel('scope')}\nPrazo: ${answerLabel('timing')}\n\nPodem ajudar-me a perceber os próximos passos?`;
}
function renderWhatsapp(){ $('#message-preview').textContent=createMessage(); $('#whatsapp-note').textContent=WHATSAPP_NUMBER?'A mensagem só será enviada quando carregar em enviar no WhatsApp.':'A demo está pronta. Antes de publicar, configure o número oficial de WhatsApp no ficheiro da aplicação.'; }
function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('visible'); setTimeout(()=>el.classList.remove('visible'),2400); }

restore(); renderServices();
$('#start-button').onclick=()=>{state.started=true;persist();show('services')};
$('#service-grid').onclick=e=>{const card=e.target.closest('.service-card');if(!card)return;const service=card.dataset.service; if(service==='Ainda estou a explorar'){state.services=[service]}else{state.services=state.services.filter(s=>s!=='Ainda estou a explorar'); state.services.includes(service)?state.services=state.services.filter(s=>s!==service):state.services.push(service)}persist();renderServices();};
$('#service-next').onclick=()=>{state.current=0;persist();renderQuestion();show('chat')};
$('#composer').onsubmit=e=>{e.preventDefault();submitAnswer($('#answer-input').value)};
$('#skip-button').onclick=()=>submitAnswer('A definir');
$('#prepare-button').onclick=()=>{renderWhatsapp();show('whatsapp')};
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{const target=b.dataset.back;if(target==='chat'){renderQuestion()}if(target==='services')renderServices();show(target)});
$('#whatsapp-button').onclick=()=>{const text=createMessage();if(!WHATSAPP_NUMBER){navigator.clipboard?.writeText(text);toast('Mensagem copiada. Configure o número oficial para abrir o WhatsApp.');return}window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,'_blank','noopener');};
$('#copy-button').onclick=async()=>{try{await navigator.clipboard.writeText(createMessage());toast('Mensagem copiada.')}catch{toast('Não foi possível copiar automaticamente.')}};
$('#restart-button').onclick=()=>{if(confirm('Quer apagar este briefing e recomeçar?')){state.services=[];state.answers={};state.current=0;localStorage.removeItem(storeKey);renderServices();show('landing')}};
$('#privacy-button').onclick=()=>$('#privacy-dialog').showModal();$('.dialog-close').onclick=()=>$('#privacy-dialog').close();
