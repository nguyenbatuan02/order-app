const bcrypt = require('bcryptjs');

const RAW_USERS = [
  { ma: 'LUANTRAN', mat_khau: '123456', ten: 'Quản trị', quyen: 'admin' },
  { ma: 'HANGNGUYEN', mat_khau: '123456', ten: 'Nguyễn Thúy Hằng', quyen: 'user' },
  { ma: 'HUYDANG', mat_khau: '123456', ten: 'Đặng Quốc Huy', quyen: 'user' },
  { ma: 'HUYENNGUYEN', mat_khau: '123456', ten: 'Nguyễn Ngọc Huyền', quyen: 'user' },
  { ma: 'KIENNGUYEN', mat_khau: '123456', ten: 'Nguyễn Trung Kiên', quyen: 'user' },
  { ma: 'NGADANG', mat_khau: '123456', ten: 'Đặng Quỳnh Nga', quyen: 'user' },
  { ma: 'PHUONGVU', mat_khau: '123456', ten: 'Vũ Thị Phượng', quyen: 'user' },
  { ma: 'THANHPHAM', mat_khau: '123456', ten: 'Phạm Minh Thành', quyen: 'user' },
  { ma: 'THUYNGUYEN', mat_khau: '123456', ten: 'Nguyễn Minh Thúy', quyen: 'user' },
  { ma: 'phuongnguyen', mat_khau: '123456', ten: 'Phương Nguyễn', quyen: 'user' },
];

const USERS = RAW_USERS.map((u) => ({
  ma: u.ma,
  maLower: u.ma.toLowerCase(),
  passwordHash: bcrypt.hashSync(u.mat_khau, 10),
  ten: u.ten,
  quyen: u.quyen,
}));

function findUser(ma) {
  const lower = String(ma || '').toLowerCase();
  return USERS.find((u) => u.maLower === lower);
}

function verifyPassword(ma, password) {
  const user = findUser(ma);
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.passwordHash)) return null;
  return { ma: user.ma, ten: user.ten, quyen: user.quyen };
}

module.exports = { findUser, verifyPassword };
