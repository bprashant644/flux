const isHRAdmin   = (u) => u.role === 'admin' || u.hr_role === 'hr_admin';
const isHRManager = (u) => isHRAdmin(u) || u.hr_role === 'manager';
module.exports = { isHRAdmin, isHRManager };
