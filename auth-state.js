// ============================================
// إدارة حالة تسجيل الدخول للمستخدم (Authentication State)
// ============================================

// التحقق مما إذا كان المستخدم مسجل الدخول أم لا
function isLoggedIn() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser !== null;
}
// ============================================
// جلب بيانات المستخدم الحالي من Local Storage
function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}
// ============================================
// تحديد لوحة التحكم المناسبة حسب نوع المستخدم
function getDashboardTargetPage(user) {
    if (!user) return 'login.html';          // في حال عدم تسجيل الدخول
    if (user.role === 'admin') return 'adminpage.html';     // مدير النظام
    if (user.role === 'provider') return 'provider.html';   // مقدم الخدمة
    return 'dashboard.html';                 // العميل
}
// ============================================
// تحديث روابط "حجوزاتي" لتوجيه المستخدم إلى لوحة التحكم المناسبة
function updateBookingLinks() {
    const user = getCurrentUser();
    const targetPage = getDashboardTargetPage(user);

    document.querySelectorAll('a').forEach(link => {

        // البحث عن جميع الروابط التي تحمل اسم "حجوزاتي"
        const text = (link.textContent || '').trim();
        if (!text.includes('حجوزاتي')) return;

        // تحديث الرابط حسب نوع المستخدم
        link.href = targetPage;

        // عند الضغط على الرابط يتم التحقق من حالة تسجيل الدخول
        link.onclick = function (event) {

            const currentUser = getCurrentUser();

            // إذا لم يكن المستخدم مسجلاً يتم تحويله إلى صفحة تسجيل الدخول
            if (!currentUser) {
                event.preventDefault();
                window.location.href = 'login.html';
                return;
            }

            // توجيه المستخدم إلى لوحة التحكم الخاصة به
            event.preventDefault();
            window.location.href = getDashboardTargetPage(currentUser);
        };
    });
}
// ============================================
// تحديث أزرار تسجيل الدخول والخروج تلقائياً
function updateAuthButtons() {

    const authButtons = document.querySelectorAll(
        '.auth-login-btn, .mobile-auth-login-btn, a[href="login.html"]'
    );

    const user = getCurrentUser();

    authButtons.forEach(btn => {

        // إذا كان المستخدم مسجلاً يتم تحويل الزر إلى "تسجيل الخروج"
        if (user) {

            btn.innerHTML =
                '<i class="fas fa-sign-out-alt"></i> تسجيل الخروج';

            btn.href = '#';

            btn.onclick = handleLogout;

        }

        // إذا لم يكن المستخدم مسجلاً يبقى زر "تسجيل الدخول"
        else {

            btn.innerHTML =
                '<i class="fas fa-user-circle"></i> تسجيل الدخول';

            btn.href = 'login.html';

            btn.onclick = null;
        }
    });

    // تحديث روابط الحجوزات بعد تحديث حالة الدخول
    updateBookingLinks();
}
// ============================================
// تنفيذ عملية تسجيل الخروج
function handleLogout(e) {

    if (e) {
        e.preventDefault();
    }

    // طلب تأكيد من المستخدم قبل تسجيل الخروج
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {

        // حذف بيانات المستخدم من Local Storage
        localStorage.removeItem('currentUser');

        // عرض رسالة نجاح
        alert('تم تسجيل الخروج بنجاح');

        // العودة إلى الصفحة الرئيسية
        window.location.href = 'index.html';
    }
}
// ============================================
// دالة عامة يمكن استدعاؤها من أي صفحة
function logout(e) {
    return handleLogout(e);
}
// ============================================
// جعل الدوال متاحة على مستوى الصفحة بالكامل
window.logout = logout;
window.handleLogout = handleLogout;
// ============================================
// تنفيذ تحديث حالة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function () {
    updateAuthButtons();
});
