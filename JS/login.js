document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const usuarioInput = document.getElementById('usuario');
  const senhaInput = document.getElementById('senha');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = usuarioInput.value.trim();
    const password = senhaInput.value;

    if (!user || !password) {
      alert('Preencha usuário e senha.');
      return;
    }

    if (!user.toLowerCase().endsWith('@rokuzen.com')) {
        alert('Use apenas e-mails @rokuzen.com para fazer login.');
        return;
    }   

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.error || 'Erro no login.');
        return;
      }

      const data = await resp.json();

      // redireciona conforme tipo_id
      switch (Number(data.tipo_id)) {
        case 4: // master
          window.location.href = '/HTML/master.html';
          break;
        case 3: // gerente
          window.location.href = '/HTML/gerente.html';
          break;
        case 2: // recepcao
          window.location.href = '/HTML/recepcao.html';
          break;
        case 1: // terapeuta
          window.location.href = '/HTML/fisio.html';
          break;
        default:
          alert('Tipo de usuário desconhecido. Contate o administrador.');
      }
    } catch (err) {
      console.error('Erro fetch login:', err);
      alert('Erro ao conectar com o servidor.');
    }
  });
});