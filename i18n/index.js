const en = {
  appName: 'My Chat App',
  toggleThemeGlass: 'Glass',
  toggleThemeClassic: 'Classic',
  createGroup: 'Buat Grup Baru',
  search: 'Cari',
  logout: 'Logout',
  save: 'Simpan',
  create: 'Buat Grup',
  leaveGroup: 'Tinggalkan Grup',
  confirmKick: 'Keluarkan anggota ini?',
  adminOnly: 'Hanya admin yang dapat mengubah pengaturan grup.'
};

const id = {
  appName: 'Aplikasi Obrolan Saya',
  toggleThemeGlass: 'Glass',
  toggleThemeClassic: 'Classic',
  createGroup: 'Buat Grup Baru',
  search: 'Cari',
  logout: 'Keluar',
  save: 'Simpan',
  create: 'Buat Grup',
  leaveGroup: 'Tinggalkan Grup',
  confirmKick: 'Keluarkan anggota ini?',
  adminOnly: 'Hanya admin yang dapat mengubah pengaturan grup.'
};

const locales = { en, id };

export function t(key, lang = (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en')) ? 'en' : 'id') {
  return (locales[lang] && locales[lang][key]) || (locales['id'][key]) || key;
}

export default { t };
