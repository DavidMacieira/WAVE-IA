const WHATSAPP_NUMBER = '351936018970'; // Formato internacional, sem + nem espaços.
const storeKey = 'wave-ai-draft-v2';
const state = { services: [], answers: {}, current: 0 };
const questions = [
  { id: 'goal', text: 'Qual é o principal objetivo deste projeto?', placeholder: 'Ex.: atrair mais clientes, lançar uma marca…', options: ['Atrair mais clientes', 'Dar mais força à marca', 'Lançar algo novo'] },
  { id: 'context', text: 'Conte-me um pouco sobre o seu projeto ou negócio.', placeholder: 'Ex.: tenho um restaurante, uma marca de roupa…', options: [] },
  { id: 'scope', text: '', placeholder: 'Partilhe os detalhes que já tiver em mente…', options: [] },
  { id: 'timing', text: 'Há alguma data ou prazo importante?', placeholder: 'Ex.: até ao final do mês, ainda estou a definir…', options: ['O mais depressa possível', 'Nas próximas semanas', 'Ainda estou a definir'] }
];
const screens = ['services','chat','summary','whatsapp'];
const $ = selector => document.querySelector(selector);
const escapeHtml = (value='') => value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
function persist(){ localStorage.setItem(storeKey, JSON.stringify(state)); }
function restore(){ try { Object.assign(state, JSON.parse(localStorage.getItem(storeKey)) || {}); } catch {} }
function show(name){ screens.forEach(id => { const screen=$('#'+id); screen.hidden=id!==name; }); }
function selectedServices(){ return state.services.join(', ') || 'uma solução à medida'; }
function scopeQuestion(){ const services=state.services; if(services.includes('Website')) return 'O que gostaria que o website fizesse por si? Pode referir páginas, funcionalidades ou referências.'; if(services.includes('Redes sociais')) return 'Em que redes quer estar presente e o que gostaria de comunicar?'; if(services.includes('Fotografia') || services.includes('Vídeo')) return 'Que tipo de imagens ou vídeo imagina? Há local, data ou referências a considerar?'; return 'O que imagina para dar mais força à sua presença e comunicação?'; }
function answerLabel(id){ return state.answers[id] || 'A definir'; }
function renderServices(){ document.querySelectorAll('.service-card').forEach(card => card.classList.toggle('selected', state.services.includes(card.dataset.service))); $('#service-next').disabled=!state.services.length; }
function addMessage(text, who){ const box=$('#chat-messages'); const item=document.createElement('div'); item.className='message '+who; item.innerHTML=who==='bot'?`<div class="bot-label">WAVE AI</div>${escapeHtml(text)}`:escapeHtml(text); box.appendChild(item); box.scrollTop=box.scrollHeight; }
function showTyping(){ const box=$('#chat-messages'); const item=document.createElement('div'); item.className='typing'; item.setAttribute('aria-label','A Wave Studio está a escrever'); item.innerHTML='<i></i><i></i><i></i>'; box.appendChild(item); box.scrollTop=box.scrollHeight; }
function renderQuestion(){
  const question=questions[state.current]; if(!question) return finishChat(); if(question.id==='scope') question.text=scopeQuestion();
  $('#chat-messages').innerHTML=''; addMessage('Olá! Vamos preparar um briefing simples para a Wave Studio.','bot');
  questions.slice(0,state.current).forEach((previous,index)=>{ if(previous.id==='scope') previous.text=scopeQuestion(); addMessage(previous.text,'bot'); addMessage(state.answers[previous.id] || 'A definir','user'); if(index===state.current-1) addMessage('Perfeito, obrigado.','bot'); });
  addMessage(question.text,'bot'); $('#answer-input').value=''; $('#answer-input').placeholder=question.placeholder; $('#chat-progress-label').textContent=`Pergunta ${state.current+1} de ${questions.length}`; $('#chat-progress').style.width=`${((state.current+1)/questions.length)*100}%`;
  const options=$('#quick-options'); options.innerHTML=''; question.options.forEach(value=>{ const button=document.createElement('button'); button.className='quick-option'; button.type='button'; button.textContent=value; button.onclick=()=>submitAnswer(value); options.appendChild(button); });
}
function submitAnswer(value){ const answer=value.trim(); if(!answer) return; state.answers[questions[state.current].id]=answer; persist(); addMessage(answer,'user'); showTyping(); $('#answer-input').disabled=true; setTimeout(()=>{state.current++;$('#answer-input').disabled=false;renderQuestion();},520); }
function finishChat(){ persist(); renderSummary(); show('summary'); }
function renderSummary(){
  const rows=[['Serviços',selectedServices(),'services'],['Objetivo',answerLabel('goal'),'goal'],['Projeto ou negócio',answerLabel('context'),'context'],['Necessidades e detalhes',answerLabel('scope'),'scope'],['Prazo',answerLabel('timing'),'timing']];
  $('#brief-card').innerHTML=rows.map(([label,value,id])=>`<div class="brief-row"><span class="brief-label">${label}</span><span class="brief-value" data-value="${id}">${escapeHtml(value)}</span><button class="brief-edit" type="button" data-edit="${id}" aria-label="Editar ${label}">⌕</button></div>`).join('');
  document.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>editBrief(button.dataset.edit));
}
function editBrief(id){ if(id==='services'){show('services');return;} const element=document.querySelector(`[data-value="${id}"]`); const old=state.answers[id]||''; element.innerHTML=`<input class="brief-edit-input" value="${escapeHtml(old)}" aria-label="Editar">`; const input=element.firstElementChild; input.focus(); input.select(); const commit=()=>{state.answers[id]=input.value.trim()||'A definir';persist();renderSummary();}; input.onblur=commit;input.onkeydown=event=>{if(event.key==='Enter')input.blur();}; }
function createMessage(){ return `Olá,\n\nGostava de falar com a Wave Studio sobre ${selectedServices()}.\n\nObjetivo: ${answerLabel('goal')}\nProjeto/negócio: ${answerLabel('context')}\nDetalhes: ${answerLabel('scope')}\nPrazo: ${answerLabel('timing')}\n\nPodem ajudar-me a perceber os próximos passos?`; }
function renderWhatsapp(){ $('#message-preview').textContent=createMessage(); $('#whatsapp-note').textContent=WHATSAPP_NUMBER?'A mensagem só será enviada quando carregar em enviar no WhatsApp.':'A demo está pronta. Antes de publicar, configure o número oficial de WhatsApp.'; }
function toast(message){ const element=$('#toast');element.textContent=message;element.classList.add('visible');setTimeout(()=>element.classList.remove('visible'),2400); }

restore(); renderServices();
$('#service-grid').onclick=event=>{const card=event.target.closest('.service-card');if(!card)return;const service=card.dataset.service;if(service==='Ainda estou a explorar'){state.services=[service];}else{state.services=state.services.filter(item=>item!=='Ainda estou a explorar');state.services.includes(service)?state.services=state.services.filter(item=>item!==service):state.services.push(service);}persist();renderServices();};
$('#service-next').onclick=()=>{persist();window.location.assign('chat.html');};
$('#composer').onsubmit=event=>{event.preventDefault();submitAnswer($('#answer-input').value);}; $('#skip-button').onclick=()=>submitAnswer('A definir');
$('#prepare-button').onclick=()=>{renderWhatsapp();show('whatsapp');};
document.querySelectorAll('[data-back]').forEach(button=>button.onclick=()=>{const target=button.dataset.back;if(target==='chat')renderQuestion();if(target==='services')renderServices();show(target);});
$('#whatsapp-button').onclick=()=>{const text=createMessage();if(!WHATSAPP_NUMBER){navigator.clipboard?.writeText(text);toast('Mensagem copiada. Configure o número oficial para abrir o WhatsApp.');return;}window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,'_blank','noopener');};
$('#copy-button').onclick=async()=>{try{await navigator.clipboard.writeText(createMessage());toast('Mensagem copiada.');}catch{toast('Não foi possível copiar automaticamente.');}};
$('#restart-button').onclick=()=>{if(confirm('Quer apagar este briefing e recomeçar?')){state.services=[];state.answers={};state.current=0;localStorage.removeItem(storeKey);renderServices();show('services');}};
$('#privacy-button').onclick=()=>$('#privacy-dialog').showModal(); $('.dialog-close').onclick=()=>$('#privacy-dialog').close();
