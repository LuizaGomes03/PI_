document.addEventListener("DOMContentLoaded", () => {
  try {
    const chips = document.querySelectorAll(".chips label");
    const confirmarBtn = document.getElementById("confirmarBtn");
    if (!confirmarBtn) throw new Error("Botão #confirmarBtn não encontrado");
    let nenhumaOpcao = document.querySelector('.chips input[value="Nenhuma das opções acima"]');
    if (!nenhumaOpcao) {
      nenhumaOpcao = Array.from(document.querySelectorAll('.chips input')).find(i => i.value && i.value.toLowerCase().includes('nenhuma'));
    }

    chips.forEach(chip => {
      const input = chip.querySelector("input");
      const span = chip.querySelector("span");
      if (!input || !span) return;
      if (input.checked) {
        span.style.backgroundColor = "#9DB668";
        span.style.color = "#fff";
      } else {
        span.style.backgroundColor = "#e6edd7";
        span.style.color = "#222";
      }
      input.addEventListener("change", () => {
        if (nenhumaOpcao && input === nenhumaOpcao && input.checked) {
          document.querySelectorAll('.chips input').forEach(outro => {
            if (outro === nenhumaOpcao) return;
            outro.checked = false;
            const s = outro.closest('label') ? outro.closest('label').querySelector('span') : outro.nextElementSibling;
            if (s) { s.style.backgroundColor = "#e6edd7"; s.style.color = "#222"; }
          });
        }
        if (nenhumaOpcao && input !== nenhumaOpcao && input.checked) {
          nenhumaOpcao.checked = false;
          const sNenhuma = nenhumaOpcao.closest('label') ? nenhumaOpcao.closest('label').querySelector('span') : nenhumaOpcao.nextElementSibling;
          if (sNenhuma) { sNenhuma.style.backgroundColor = "#e6edd7"; sNenhuma.style.color = "#222"; }
        }
        if (input.checked) { span.style.backgroundColor = "#9DB668"; span.style.color = "#fff"; }
        else { span.style.backgroundColor = "#e6edd7"; span.style.color = "#222"; }
      });
    });

    confirmarBtn.addEventListener("click", () => {
      const selecionados = Array.from(document.querySelectorAll(".chips input:checked"))
        .map(input => input.value.trim())
        .filter(v => v.length > 0);
      if (selecionados.length === 0) {
        alert("Por favor, selecione ao menos uma condição ou marque 'Nenhuma das opções acima'.");
        return;
      }
      localStorage.setItem("condicoesSelecionadas", JSON.stringify(selecionados));
      confirmarBtn.disabled = true;
      confirmarBtn.textContent = "Aguarde...";
      setTimeout(() => { window.location.href = "selecionar_data.html"; }, 400);
    });

  } catch (err) {
    console.error("Erro em agendamento_condicoes_med.js:", err);
  }
});
