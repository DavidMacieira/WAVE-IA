const WHATSAPP_NUMBER = '351936018970';
const storeKey = 'wave-ai-draft-v2';
const state = { services: [], answers: {}, current: 0 };
const questions = [
  { id:'brand', text:'Como se chama a sua marca ou projeto?', placeholder:'Ex.: Maré Café, Atelier Inês…', options:[] },
  { id:'goal', text:'Qual é o principal objetivo deste projeto?', placeholder:'Ex.: atrair mais clientes, lançar uma marca…', options:['Atrair mais clientes','Dar mais força à marca','Lançar algo novo'] },
  { id:'context', text:'Conte-me um pouco sobre o seu projeto ou negócio.', placeholder:'Ex.: tenho um restaurante, uma marca de roupa…', options:[] },
  { id:'scope', text:'', placeholder:'Partilhe os detalhes que já tiver em mente…', options:[] },
  { id:'timing', text:'Há alguma data ou prazo importante?', placeholder:'Ex.: até ao final do mês, ainda estou a definir…', options:['O mais depressa possível','Nas próximas semanas','Ainda estou a definir'] }
];
const $ = selector => document.querySelector(selector);
const esc = text => String(text || '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
try { Object.assign(state, JSON.parse(localStorage.getItem(storeKey)) || {}); } catch {}
if (!Array.isArray(state.services)) state.services=[];
if (!state.answers || typeof state.answers !== 'object') state.answers={};
function save(){localStorage.setItem(storeKey,JSON.stringify(state));}
function serviceText(){return state.services.join(', ') || 'uma solução à medida';}
function scopeText(){if(state.services.includes('Website')) return 'O que gostaria que o website fizesse por si? Pode referir páginas, funcionalidades ou referências.';if(state.services.includes('Redes sociais')) return 'Em que redes quer estar presente e o que gostaria de comunicar?';if(state.services.includes('Fotografia')||state.services.includes('Vídeo')) return 'Que tipo de imagens ou vídeo imagina? Há local, data ou referências a considerar?';return 'O que imagina para dar mais força à sua presença e comunicação?';}
function display(id){return state.answers[id] || 'A definir';}
function bubble(text,kind){const el=document.createElement('div');el.className='message '+kind;el.innerHTML=kind==='bot'?esc(text):esc(text);$('#chat-messages').appendChild(el);}
function typing(){const el=document.createElement('div');el.className='typing';el.innerHTML='<i></i><i></i><i></i>';$('#chat-messages').appendChild(el);}
function show(name){['chat','summary','whatsapp'].forEach(id=>$('#'+id).hidden=id!==name);}
function question(){
  const current=questions[state.current];if(!current){showSummary();return;}if(current.id==='scope')current.text=scopeText();
  const messages=$('#chat-messages');messages.innerHTML='';bubble('Olá! Vamos preparar um briefing simples para a Wave Studio.','bot');
  questions.slice(0,state.current).forEach(previous=>{if(previous.id==='scope')previous.text=scopeText();bubble(previous.text,'bot');bubble(display(previous.id),'user');});
  bubble(current.text,'bot');$('#answer-input').value='';$('#answer-input').placeholder=current.placeholder;$('#chat-progress-label').textContent=`Pergunta ${state.current+1} de ${questions.length}`;$('#chat-progress').style.width=`${(state.current+1)/questions.length*100}%`;
  const choices=$('#quick-options');choices.innerHTML='';current.options.forEach(text=>{const button=document.createElement('button');button.className='quick-option';button.type='button';button.textContent=text;button.addEventListener('click',()=>answer(text));choices.appendChild(button);});messages.scrollTop=messages.scrollHeight;
}
function answer(value){const text=value.trim();if(!text)return;state.answers[questions[state.current].id]=text;save();bubble(text,'user');typing();$('#answer-input').disabled=true;setTimeout(()=>{state.current++;$('#answer-input').disabled=false;question();},450);}
function showSummary(){
  const fields=[['Marca ou projeto',display('brand')],['Objetivo',display('goal')],['Projeto ou negócio',display('context')],['Necessidades e detalhes',display('scope')],['Prazo',display('timing')]];
  const services=state.services.length ? state.services : ['Solução à medida'];
  $('#brief-card').innerHTML=`<div class="brief-services"><span class="brief-label">A WAVE STUDIO VAI AJUDAR COM</span><div class="service-tags">${services.map(service=>`<span>${esc(service)}</span>`).join('')}</div></div>${fields.map(([key,value])=>`<div class="brief-row"><span class="brief-label">${key}</span><span class="brief-value">${esc(value)}</span></div>`).join('')}`;show('summary');
}
function message(){return `Olá, sou da ${display('brand')}.\n\nGostava de falar com a Wave Studio sobre ${serviceText()}.\n\nObjetivo: ${display('goal')}\nProjeto/negócio: ${display('context')}\nDetalhes: ${display('scope')}\nPrazo: ${display('timing')}\n\nPodem ajudar-me a perceber os próximos passos?`;}
function showWhatsapp(){$('#message-preview').textContent=message();$('#whatsapp-note').textContent=WHATSAPP_NUMBER?'A mensagem só será enviada quando carregar em enviar no WhatsApp.':'Configure o número oficial de WhatsApp antes de publicar.';show('whatsapp');}
function notice(text){const el=$('#toast');el.textContent=text;el.classList.add('visible');setTimeout(()=>el.classList.remove('visible'),2200);}
$('#composer').addEventListener('submit',event=>{event.preventDefault();answer($('#answer-input').value);});$('#skip-button').addEventListener('click',()=>answer('A definir'));$('#back-to-chat').addEventListener('click',()=>{state.current=Math.max(0,state.current-1);question();show('chat');});$('#prepare-button').addEventListener('click',showWhatsapp);$('#back-to-summary').addEventListener('click',showSummary);$('#copy-button').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(message());notice('Mensagem copiada.');}catch{notice('Não foi possível copiar automaticamente.');}});$('#whatsapp-button').addEventListener('click',()=>{if(!WHATSAPP_NUMBER){notice('Configure o número oficial antes de abrir o WhatsApp.');return;}window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message())}`,'_blank','noopener');});
question();
