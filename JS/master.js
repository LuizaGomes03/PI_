function renderEmployees(data) {
    const tbody = $('#tblEmployees tbody'); tbody.innerHTML = '';
    const roleFilter = $('#roleFilter');

    const rows = data.employees
        .filter(e => e.unit === state.unit && (!roleFilter.value || e.role === roleFilter.value));

    rows.forEach(e => {
        const acc = (data.accounts || []).find(a => a.empId === e.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${e.name}<div style="font-size:12px;opacity:.8">${acc ? ('user: ' + acc.username) : '<em>sem conta</em>'}</div></td>
      <td>${e.role}</td>
      <td>${data.units.find(u => u.id === e.unit)?.name || e.unit}</td>
      <td>${e.phone || ''}</td>
      <td>${e.active ? 'Ativo' : 'Inativo'}</td>
      <td class="row">
        ${acc ? `<button class="btn ghost" data-reset="${e.id}"><i class="fa-solid fa-key"></i> Reset senha</button>` :
                `<button class="btn ghost" data-create="${e.id}"><i class="fa-solid fa-user-plus"></i> Criar conta</button>`}
        <button class="btn ghost" data-toggle="${e.id}">${e.active ? 'Desativar' : 'Ativar'}</button>
        <button class="btn warn"  data-remove="${e.id}"><i class="fa-solid fa-trash"></i></button>
      </td>`;
        tbody.appendChild(tr);
    });

    // actions
    tbody.querySelectorAll('button[data-toggle]').forEach(b => {
        b.onclick = () => { const id = b.dataset.toggle; const emp = data.employees.find(x => x.id === id); emp.active = !emp.active; save(data); renderEmployees(load()); };
    });
    tbody.querySelectorAll('button[data-remove]').forEach(b => {
        b.onclick = () => {
            const id = b.dataset.remove;
            if (!confirm('Remover funcionário e conta (se houver)?')) return;
            data.employees = data.employees.filter(x => x.id !== id);
            if (data.accounts) data.accounts = data.accounts.filter(a => a.empId !== id);
            save(data); renderEmployees(load());
        };
    });
    tbody.querySelectorAll('button[data-reset]').forEach(b => {
        b.onclick = () => {
            const id = b.dataset.reset; const acc = (data.accounts || []).find(a => a.empId === id);
            if (!acc) return; acc.password = prompt('Nova senha provisória:', genPass()) || acc.password;
            acc.lastResetISO = new Date().toISOString(); save(data); alert('Senha atualizada.');
        };
    });
    tbody.querySelectorAll('button[data-create]').forEach(b => {
        b.onclick = () => {
            // abre modal com dados do funcionário preenchidos
            const e = data.employees.find(x => x.id === b.dataset.create);
            openEmpModal();
            $('#mEmpName').value = e.name;
            $('#mEmpRole').value = e.role;
            $('#mEmpUnit').value = e.unit;
            $('#mEmpActive').value = e.active ? 'true' : 'false';
        };
    });

    // filtros
    roleFilter.onchange = () => renderEmployees(load());
}
