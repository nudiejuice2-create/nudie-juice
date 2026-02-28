// src/pages/Users.jsx
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import Modal, { useModal } from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Table, { Tr, Td, TdAction } from '../components/ui/Table';
import { uid } from '../utils/formatters';

const emptyForm = { username: '', password: '', role: 'admin', active: true };

export default function Users() {
  const toast       = useToast();
  const users       = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const tambahUser  = useStore((s) => s.tambahUser);
  const updateUser  = useStore((s) => s.updateUser);
  const hapusUser   = useStore((s) => s.hapusUser);
  const toggleUserActive = useStore((s) => s.toggleUserActive);

  const modal  = useModal();
  const [editId, setEditId] = useState(null);
  const [form, setForm]     = useState(emptyForm);
  const [showPass, setShowPass] = useState(false);

  function openBuat() {
    setEditId(null);
    setForm(emptyForm);
    setShowPass(false);
    modal.onOpen();
  }

  function openEdit(u) {
    setEditId(u.id);
    setForm({ username: u.username, password: '', role: u.role, active: u.active });
    setShowPass(false);
    modal.onOpen();
  }

  function handleSimpan() {
    if (!form.username.trim()) return toast('Username wajib diisi!', 'red');
    if (!editId && !form.password.trim()) return toast('Password wajib diisi!', 'red');
    if (form.password && form.password.length < 6) return toast('Password minimal 6 karakter!', 'red');

    // Cek duplikat username
    const duplikat = users.find((u) => u.username === form.username.trim() && u.id !== editId);
    if (duplikat) return toast('Username sudah dipakai!', 'red');

    if (editId) {
      const upd = { username: form.username.trim(), role: form.role, active: form.active };
      if (form.password.trim()) upd.password = form.password.trim();
      updateUser(editId, upd);
      toast('User diperbarui ✅', 'green');
    } else {
      tambahUser({
        id: uid(),
        username: form.username.trim(),
        password: form.password.trim(),
        role: form.role,
        active: true,
      });
      toast(`User ${form.username} ditambah ✅`, 'green');
    }
    modal.onClose();
  }

  function handleHapus(u) {
    if (u.id === currentUser.id) return toast('Tidak bisa hapus akun sendiri!', 'red');
    if (!window.confirm(`Hapus user ${u.username}?`)) return;
    hapusUser(u.id);
    toast('User dihapus', 'red');
  }

  function handleToggle(u) {
    if (u.id === currentUser.id) return toast('Tidak bisa nonaktifkan akun sendiri!', 'red');
    toggleUserActive(u.id);
    toast(`User ${u.username} ${u.active ? 'dinonaktifkan' : 'diaktifkan'}`, u.active ? 'yellow' : 'green');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[15px] font-700 text-gray-800">Manajemen User</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Hanya Super Admin yang bisa mengakses halaman ini</p>
        </div>
        <Button onClick={openBuat}>+ Tambah User</Button>
      </div>

      <Table
        headers={['Username', 'Role', 'Status', 'Aksi']}
        empty={{ icon: '👥', title: 'Belum ada user', desc: 'Tambah user admin' }}
      >
        {users.map((u) => (
          <Tr key={u.id}>
            <Td>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[12px] font-700 flex-shrink-0">
                  {u.username[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-700 text-gray-800 text-[13px]">{u.username}</p>
                  {u.id === currentUser.id && (
                    <p className="text-[10px] text-blue-500 font-600">Akun Anda</p>
                  )}
                </div>
              </div>
            </Td>
            <Td>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-700 ${
                u.role === 'superadmin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {u.role === 'superadmin' ? '👑 Super Admin' : '🔧 Admin'}
              </span>
            </Td>
            <Td>
              <span className={`text-[11px] px-2.5 py-1 rounded-full font-700 ${
                u.active !== false
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {u.active !== false ? '● Aktif' : '○ Nonaktif'}
              </span>
            </Td>
            <TdAction>
              <Button size="xs" variant="ghost" onClick={() => openEdit(u)}>Edit</Button>
              {u.id !== currentUser.id && (
                <>
                  <Button
                    size="xs"
                    variant={u.active !== false ? 'warning' : 'success'}
                    onClick={() => handleToggle(u)}
                  >
                    {u.active !== false ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button size="xs" variant="danger" onClick={() => handleHapus(u)}>Hapus</Button>
                </>
              )}
            </TdAction>
          </Tr>
        ))}
      </Table>

      {/* Info */}
      <div className="mt-4 px-4 py-3 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-[12px] text-amber-700 font-600">ℹ️ Informasi Role:</p>
        <p className="text-[11.5px] text-amber-600 mt-1">
          <strong>Super Admin</strong> — akses semua fitur termasuk manajemen user dan reset data.
        </p>
        <p className="text-[11.5px] text-amber-600 mt-0.5">
          <strong>Admin</strong> — akses semua fitur operasional, tidak bisa kelola user atau reset data.
        </p>
      </div>

      {/* Modal */}
      <Modal
        open={modal.open}
        onClose={modal.onClose}
        title={editId ? 'Edit User' : 'Tambah User Baru'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={modal.onClose}>Batal</Button>
            <Button onClick={handleSimpan}>{editId ? 'Simpan' : 'Tambah User'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-form">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="input-form"
              placeholder="Contoh: admin2"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="label-form">
              Password {editId && <span className="text-gray-400 font-400 normal-case">(kosongkan jika tidak diubah)</span>}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="input-form pr-10"
                placeholder={editId ? 'Isi untuk ganti password' : 'Min. 6 karakter'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[12px]"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="label-form">Role</label>
            <div className="flex gap-2">
              {[
                { val: 'admin',      label: '🔧 Admin' },
                { val: 'superadmin', label: '👑 Super Admin' },
              ].map((r) => (
                <button
                  key={r.val}
                  onClick={() => setForm((f) => ({ ...f, role: r.val }))}
                  className={`flex-1 py-2.5 rounded-lg text-[12px] font-700 border-2 transition-all ${
                    form.role === r.val
                      ? r.val === 'superadmin'
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
