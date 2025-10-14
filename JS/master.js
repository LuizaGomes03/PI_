// ===================================================
// 1) GARANTIR ESTRUTURA (accounts) AO CARREGAR
// ===================================================
function load() { 
  const d = JSON.parse(localStorage.getItem(KEY) || 'null') || seed(); 
  if (!d.accounts) d.accounts = [];        // garante existe
  return d;
}
function seed() { 
  const seeded = { ...db, accounts: [] };  // adiciona accounts no seed
  localStorage.setItem(KEY, JSON.stringify(seeded)); 
  return JSON.parse(localStorage.getItem(KEY)); 
}

// ===================================================
// 2) HELPERS NOVOS
// ===================================================
const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/[^a-z0-9]+/g,'').slice(0,16);
const genPass = () => Math.random().toString(36).slice(2,10);

// cria modal dinamicamente se não existir
function ensureEmpModal() {
  if (document.querySelector('#empModal')) return;
  const modal = document.createElement('div');
  modal.id = 'empModal';
  modal.style.cssText = `
    position:fixed; inset:0; display:none; place-items:center; background:#0007; z-index:9999;
    font-family: Inter, system-ui, sans-serif;`;
  modal.innerHTML = `
    <div style="background:#fff; padding:20px; width:min(560px,92vw); border-radius:14px; box-shadow:var(--shadow,0 10px 30px rgba(0,0,0,.2))">
      <h3 style="margin-bottom:12px;font-size:18px">Criar conta do funcionário</h3>
      <div style="display:grid; gap:10px;">
        <label>Nome<br><input id="mEmpName" class="inp" disabled></label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
          <label>Papel<br>
            <select id="mEmpRole" class="inp">
              <option value="massagista">massagista</option>
              <option value="recepcao">recepcao</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>Unidade<br>
            <select id="mEmpUnit" class="inp"></select>
          </label>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
          <label>Usuário<br><input id="mEmpUser" class="inp" placeholder="usuario"></label>
          <label>Senha provisória<br><input id="mEmpPass" class="inp" placeholder="senha"></label>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px">
          <button id="mEmpCancel" class="btn ghost">Cancelar</button>
          <button id="mEmpSave" class="btn">Salvar</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function openEmpModal(empId) {
  ensureEmpModal();
  const data = load();
  const emp = data.employees.find(x => x.id === empId);
  const modal = document.querySelector('#empModal');

  // preencher unidades
  const selUnit = document.querySelector('#mEmpUnit');
  selUnit.innerHTML = '';
  data.units.forEach(u => {
    const o = document.createElement('option');
    o.value = u.id; o.textContent = u.name;
    if (u.id === emp.unit) o.selected = true;
    selUnit.appendChild(o);
  });

  // preencher campos
  document.querySelector('#mEmpName').value = emp.name;
  document.querySelector('#mEmpRole').value = emp.role;
  document.querySelector('#mEmpUser').value = slugify(emp.name);
  document.querySelector('#mEmpPass').value = genPass();

  // abrir
  modal.style.display = 'grid';

  // eventos
  document.querySelector('#mEmpCancel').onclick = () => modal.style.display = 'none';
  document.querySelector('#mEmpSave').onclick = () => {
    const username = document.querySelector('#mEmpUser').value.trim() || slugify(emp.name);
    const password = document.querySelector('#mEmpPass').value.trim() || genPass();
    const role = document.querySelector('#mEmpRole').value;
    const unit = document.querySelector('#mEmpUnit').value;

    const existing = (data.accounts || []).find(a => a.empId === emp.id);
    if (existing) {
      existing.username = username;
      existing.password = password;
      existing.lastResetISO = new Date().toISOString();
    } else {
      (data.accounts ||= []).push({
        id: 'A' + Math.random().toString(36).slice(2,8),
        empId: emp.id,
        username,
        password,
        createdISO: new Date().toISOString(),
        lastResetISO: null
      });
    }

    // se mudaram papel/unidade aqui, sincroniza no funcionário
    emp.role = role;
    emp.unit = unit;

    save(data);
    modal.style.display = 'none';
    renderEmployees(load());
  };
}

// ===================================================
// 3) RENDER EMPLOYEES (UNIFICADO + CONTAS)
// ===================================================
function renderEmployees(data) {
  const tbody = document.querySelector('#tblEmployees tbody'); 
  tbody.innerHTML = '';
  const roleFilter = document.querySelector('#roleFilter');

  const rows = data.employees
    .filter(e => e.unit === state.unit && (!roleFilter.value || e.role === roleFilter.value));

  rows.forEach(e => {
    const acc = (data.accounts || []).find(a => a.empId === e.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        ${e.name}
        <div style="font-size:12px;opacity:.8">${acc ? ('user: ' + acc.username) : '<em>sem conta</em>'}</div>
      </td>
      <td>${e.role}</td>
      <td>${data.units.find(u => u.id === e.unit)?.name || e.unit}</td>
      <td>${e.phone || ''}</td>
      <td>${e.active ? 'Ativo' : 'Inativo'}</td>
      <td class="row" style="gap:6px; flex-wrap:wrap">
        ${acc 
          ? `<button class="btn ghost" data-reset="${e.id}"><i class="fa-solid fa-key"></i> Reset senha</button>`
          : `<button class="btn ghost" data-create="${e.id}"><i class="fa-solid fa-user-plus"></i> Criar conta</button>`}
        <button class="btn ghost" data-toggle="${e.id}">${e.active ? 'Desativar' : 'Ativar'}</button>
        <button class="btn warn" data-remove="${e.id}" title="Remover funcionário"><i class="fa-solid fa-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });

  // toggle ativo/inativo
  tbody.querySelectorAll('button[data-toggle]').forEach(b => {
    b.onclick = () => { 
      const id = b.dataset.toggle; 
      const emp = data.employees.find(x => x.id === id); 
      emp.active = !emp.active; 
      save(data); 
      renderEmployees(load()); 
    };
  });

  // remover (apaga conta junto, se houver)
  tbody.querySelectorAll('button[data-remove]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.remove;
      if (!confirm('Remover funcionário e conta (se houver)?')) return;
      data.employees = data.employees.filter(x => x.id !== id);
      if (data.accounts) data.accounts = data.accounts.filter(a => a.empId !== id);
      save(data); 
      renderEmployees(load());
    };
  });

  // reset de senha
  tbody.querySelectorAll('button[data-reset]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.reset; 
      const acc = (data.accounts || []).find(a => a.empId === id);
      if (!acc) return; 
      acc.password = prompt('Nova senha provisória:', genPass()) || acc.password;
      acc.lastResetISO = new Date().toISOString(); 
      save(data); 
      alert('Senha atualizada.');
    };
  });

  // criar conta (abre modal preenchido)
  tbody.querySelectorAll('button[data-create]').forEach(b => {
    b.onclick = () => openEmpModal(b.dataset.create);
  });

  // filtros
  roleFilter.onchange = () => renderEmployees(load());
}


// 4) BOTÃO "ADICIONAR FUNCIONÁRIO" 

const btnAddEmp = document.querySelector('#btnAddEmp');
if (btnAddEmp) {
  btnAddEmp.onclick = () => {
    const data = load();
    const name = prompt('Nome do funcionário:'); if (!name) return;
    const role = prompt('Papel (massagista/recepcao/admin):', 'massagista') || 'massagista';
    const phone = prompt('Telefone:', '(11) 9xxxx-xxxx') || '';
    data.employees.push({ 
      id: 'E' + (Math.random().toString(36).slice(2, 6)), 
      name, role, unit: state.unit, phone, active: true 
    });
    save(data); 
    renderEmployees(load());
  };
}
