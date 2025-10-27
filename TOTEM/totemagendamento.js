   ;(()=>{
      const $ = (s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)]
      // Relógio
      const timeEl=$('#time'), dateEl=$('#date')
      const fmtTime=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'})
      const fmtDate=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'})
      function tick(){const n=new Date(); timeEl.textContent=fmtTime.format(n); dateEl.textContent=fmtDate.format(n)}
      tick(); setInterval(tick,1000)

      // Tela cheia
      const btnFull=$('#btnFull'); btnFull&&btnFull.addEventListener('click',async()=>{try{if(!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen()}catch(e){}})

      // Modais
      $$('[data-open]').forEach(b=> b.addEventListener('click',()=> $('#'+b.dataset.open).showModal()))
      $$('dialog [data-close]').forEach(b=> b.addEventListener('click',()=> b.closest('dialog').close()))
      $$('dialog').forEach(d=> d.addEventListener('keydown',e=>{ if(e.key==='Escape') d.close() }))
    })()