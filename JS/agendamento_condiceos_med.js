document.addEventListener("DOMContentLoaded", () => {
  const chips = document.querySelectorAll(".chips label");
  chips.forEach(chip => {
    const input = chip.querySelector("input");
    const span = chip.querySelector("span");

    chip.addEventListener("click", () => {
      if (input.checked) {
        span.style.backgroundColor = "#9DB668";
        span.style.color = "#fff";
      } else {
        span.style.backgroundColor = "#e6edd7";
        span.style.color = "#222";
      }
    });
  });

  document.getElementById("confirmarBtn").addEventListener("click", () => {
    const selecionados = Array.from(document.querySelectorAll(".chips input:checked"))
      .map(input => input.value);
    alert("Condições selecionadas:\n" + (selecionados.join(", ") || "Nenhuma"));
  });
});
