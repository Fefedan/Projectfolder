// ============================================
// MAIN JAVASCRIPT FILE - HAZZI PLATFORM
// ============================================

// ===== CONTACT FORM =====
const form = document.getElementById("contactForm");
const popup = document.getElementById("popup");

if (form && popup) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        popup.style.display = "flex";
        form.reset();
    });
}

function closePopup() {
    if (popup) {
        popup.style.display = "none";
    }
}

// ===== DASHBOARD PAGE =====
if (document.body && document.body.classList.contains("dashboard-page")) {
    const menuItems = document.querySelectorAll(".menu li");
    const sections = document.querySelectorAll(".section");

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(li => li.classList.remove("active"));
            item.classList.add("active");

            sections.forEach(section => {
                section.classList.remove("active");
            });

            const target = document.getElementById(item.dataset.target);
            if (target) {
                target.classList.add("active");
            }
        });
    });

    const token = localStorage.getItem("token");
    const title = document.getElementById("title");
    
    if (token) {
        fetch("/api/profile", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById("name").textContent = "الاسم: " + data.name;
            document.getElementById("email").textContent = "البريد: " + data.email;
            document.getElementById("phone").textContent = "رقم الهاتف: " + data.phone;

            if (title && data.username) {
                title.textContent = `مرحباً بعودتك، ${data.username}`;
            }
        })
        .catch(err => console.log(err));
    } else {
        console.log("No token - dashboard not accessed");
    }
}

if (typeof token !== 'undefined') {
    fetch("/api/dashboard-stats", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("bookingsCount").textContent = data.bookings;
        document.getElementById("notificationsCount").textContent = data.notifications;
        document.getElementById("notificationsproviderCount").textContent = data.notificationsprovider;
        document.getElementById("servicesCount").textContent = data.services;
    })
    .catch(err => console.log(err));
}

function logout() {
    fetch("/api/logout", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    }).finally(() => {
        localStorage.removeItem("token");
        window.location.href = "home.html";
    });
}

function initGlobalUI() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const updateNavbar = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        };
        updateNavbar();
        window.addEventListener('scroll', updateNavbar);
    }

    const hamburger = document.getElementById('hamburger');
    let mobileMenu = document.getElementById('mobileMenu');

    if (!mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.id = 'mobileMenu';
        mobileMenu.className = 'mobile-menu';
        document.body.appendChild(mobileMenu);
    }

    if (!hamburger) {
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            const newHamburger = document.createElement('div');
            newHamburger.id = 'hamburger';
            newHamburger.className = 'hamburger';
            newHamburger.innerHTML = '<span></span><span></span><span></span>';
            navContainer.appendChild(newHamburger);
        }
    }

    const activeHamburger = document.getElementById('hamburger');
    if (activeHamburger && mobileMenu) {
        if (!mobileMenu.querySelector('.mobile-menu-header')) {
            mobileMenu.innerHTML = `
                <div class="mobile-menu-header">
                    <div class="mobile-menu-title">القائمة</div>
                    <button type="button" class="mobile-menu-close" aria-label="إغلاق القائمة">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mobile-menu-links"></div>
                <div class="mobile-menu-actions"></div>
            `;
        }

        const closeBtn = mobileMenu.querySelector('.mobile-menu-close');
        const linksContainer = mobileMenu.querySelector('.mobile-menu-links');
        const actionsContainer = mobileMenu.querySelector('.mobile-menu-actions');

        const navLinks = Array.from(document.querySelectorAll('.nav-links a'));
        const navActions = Array.from(document.querySelectorAll('.nav-actions a, .nav-actions button'));

        linksContainer.innerHTML = '';
        actionsContainer.innerHTML = '';

        const closeMobileMenu = () => {
            activeHamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        };

        const toggleMobileMenu = () => {
            activeHamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        };

        navLinks.forEach(link => {
            const mobileLink = document.createElement('a');
            mobileLink.href = link.href;
            mobileLink.className = 'mobile-menu-link';
            mobileLink.innerHTML = `${link.innerHTML}`;
            mobileLink.addEventListener('click', closeMobileMenu);
            linksContainer.appendChild(mobileLink);
        });

        navActions.forEach(action => {
            const mobileAction = document.createElement('a');
            mobileAction.href = action.href || '#';
            mobileAction.className = `mobile-menu-action ${action.classList.contains('nav-btn-primary') ? 'primary' : 'secondary'}`;
            mobileAction.innerHTML = action.innerHTML;
            mobileAction.addEventListener('click', closeMobileMenu);
            actionsContainer.appendChild(mobileAction);
        });

        activeHamburger.removeEventListener('click', toggleMobileMenu);
        activeHamburger.addEventListener('click', toggleMobileMenu);

        if (closeBtn) {
            closeBtn.removeEventListener('click', closeMobileMenu);
            closeBtn.addEventListener('click', closeMobileMenu);
        }

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initGlobalUI();
    initChatbotWidget();
});

async function initChatbotWidget() {
    if (typeof window.getCurrentUser !== 'function') return;
    const currentUser = window.getCurrentUser();
    if (!currentUser || currentUser.role === 'admin') return;

    const faqFile = 'faq-chatbot.json';
    let faqs = [];

    try {
        const response = await fetch(faqFile);
        if (response.ok) {
            faqs = await response.json();
        }
    } catch (error) {
        console.warn('Failed to load chatbot FAQ file:', error);
    }

    if (!Array.isArray(faqs) || faqs.length === 0) {
        faqs = [
            { question: 'كيف أحجز خدمة؟', answer: 'اختر الخدمة التي تناسبك من الصفحة ثم اضغط زر الحجز واتبع التعليمات لإكمال طلبك.' },
            { question: 'كيف أضيف عرضاً جديداً؟', answer: 'كمقدم خدمة، انتقل إلى صفحة إدارة الخدمات واضغط على إضافة عرض جديد ثم قم بملء التفاصيل.' },
            { question: 'ما هي شروط التسجيل كمقدم خدمة؟', answer: 'يجب أن يكون لديك حساب مفعل وبيانات صحيحة عن نشاطك التجاري حتى يتم قبولك كمقدم خدمة.' },
            { question: 'أين أجد حجوزاتي الشخصية؟', answer: 'اذهب إلى لوحة التحكم ثم قسم الحجوزات لرؤية طلباتك الحالية والتأكيدات.' },
            { question: 'كيف أغير كلمة المرور؟', answer: 'انتقل إلى إعدادات الحساب ثم اختر تغيير كلمة المرور وأدخل القديمة والجديدة.' },
            { question: 'كيف أتابع الطلبات الواردة كمقدم خدمة؟', answer: 'في صفحة مقدم الخدمة يمكنك رؤية الحجوزات الواردة ضمن قسم الحجوزات الواردة.' },
            { question: 'هل يمكنني حجز أكثر من خدمة في نفس الوقت؟', answer: 'نعم، يمكنك فتح عدة طلبات حجز منفصلة لكل خدمة، ثم متابعة كل منها من لوحة التحكم.' },
            { question: 'كيف ألغى حجزاً تم تأكيده؟', answer: 'انتقل إلى صفحة الحجوزات واختر الحجز المطلوب ثم اضغط على خيار إلغاء الطلب.' },
            { question: 'كيف أعرض تفاصيل الخدمة بالكامل؟', answer: 'اضغط على اسم الخدمة أو صورة العرض لفتح صفحة التفاصيل الخاصة بها.' },
            { question: 'كيف أضبط ساعات العمل المتاحة؟', answer: 'كمقدم خدمة، قم بتحرير الخدمة واختَر أيام وساعات التوفر المناسبة لك.' },
            { question: 'كيف أتحقق من حالة الدفع؟', answer: 'بعد إتمام الحجز ستجد حالة الدفع في تفاصيل الطلب على لوحة التحكم.' },
            { question: 'كيف أبحث عن خدمات محددة؟', answer: 'استخدم شريط البحث أو الفلاتر على صفحة الخدمات لتصفية النتائج بسرعة.' },
            { question: 'كيف أنشئ حساب جديد؟', answer: 'انتقل إلى صفحة التسجيل واملأ بياناتك ثم اختر نوع الحساب المناسب ثم اضغط إنشاء حساب.' },
            { question: 'كيف أضيف رقم الهاتف الصحيح؟', answer: 'اختر رمز الدولة ثم أدخل رقم الهاتف بدون مسافات في الحقل المخصص.' },
            { question: 'كيف أستخدم العروض الخاصة؟', answer: 'ابحث عن العروض المميزة في صفحة الخدمات ثم اضغط على التفاصيل والحجز.' },
            { question: 'ماذا أفعل إذا لم أتمكن من تسجيل الدخول؟', answer: 'تحقق من البريد الإلكتروني وكلمة المرور أو استخدم خاصية استعادة الحساب إذا كانت متاحة.' },
            { question: 'هل يمكنني التواصل مع مقدم الخدمة؟', answer: 'نعم، بعد تأكيد الحجز ستحصل على تفاصيل الاتصال إذا كانت متاحة ضمن معلومات الحجز.' },
            { question: 'كيف أعدل بيانات ملفي الشخصي؟', answer: 'قم بفتح صفحة الإعدادات أو الملف الشخصي من لوحة التحكم وقم بتحديث البيانات هناك.' },
            { question: 'هل يمكنني عرض الفواتير السابقة؟', answer: 'ستجد الفواتير أو السجلات المالية في قسم الحجوزات أو الحساب داخل لوحة التحكم.' },
            { question: 'كيف أخرج من الحساب؟', answer: 'استخدم زر تسجيل الخروج في القائمة العلوية أو لوحة التنقل لتسجيل الخروج من الحساب.' }
        ];
    }

    const widgetHtml = `
        <div id="chatbotWidget" class="chatbot-widget">
            <button id="chatbotToggle" class="chatbot-toggle" aria-label="فتح مساعد المنصة">
                <i class="fas fa-robot"></i>
                <span>مساعد المنصة</span>
            </button>
            <div id="chatbotPanel" class="chatbot-panel" aria-hidden="true">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <i class="fas fa-robot"></i>
                        <div>
                            <strong>مساعد حجزي</strong>
                            <p>اختر سؤالاً للحصول على الإجابة</p>
                        </div>
                    </div>
                    <button id="chatbotClose" class="chatbot-close" aria-label="إغلاق">×</button>
                </div>
                <div class="chatbot-body">
                    <div class="chatbot-history" id="chatbotHistory">
                        <div class="chatbot-message bot-message">
                            <div class="message-text">مرحباً! هذه أكثر الأسئلة شيوعاً. اضغط على أي سؤال لعرض الإجابة.</div>
                        </div>
                    </div>
                    <div class="chatbot-question-list" id="chatbotQuestions"></div>
                </div>
                <div class="chatbot-footer">
                    <button id="chatbotClear" class="chatbot-clear">مسح المحادثة</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHtml);

    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotPanel = document.getElementById('chatbotPanel');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotQuestions = document.getElementById('chatbotQuestions');
    const chatbotHistory = document.getElementById('chatbotHistory');
    const chatbotClear = document.getElementById('chatbotClear');

    const scrollHistory = () => {
        if (chatbotHistory) {
            chatbotHistory.scrollTop = chatbotHistory.scrollHeight;
        }
    };

    const addMessage = (text, sender) => {
        if (!chatbotHistory) return;
        const messageEl = document.createElement('div');
        messageEl.className = `chatbot-message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
        const bubble = document.createElement('div');
        bubble.className = 'message-text';
        bubble.textContent = text;
        messageEl.appendChild(bubble);
        chatbotHistory.appendChild(messageEl);
        scrollHistory();
    };

    const clearChat = () => {
        if (!chatbotHistory) return;
        chatbotHistory.innerHTML = `
            <div class="chatbot-message bot-message">
                <div class="message-text">تم مسح المحادثة. اختر سؤالاً جديداً للبدء.</div>
            </div>
        `;
    };

    faqs.slice(0, 20).forEach((faq, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chatbot-question-btn';
        button.textContent = faq.question;
        button.addEventListener('click', () => {
            addMessage(faq.question, 'user');
            setTimeout(() => addMessage(faq.answer, 'bot'), 200);
        });
        chatbotQuestions.appendChild(button);
    });

    if (chatbotToggle && chatbotPanel && chatbotClose) {
        const openPanel = () => {
            chatbotPanel.classList.add('open');
            chatbotPanel.setAttribute('aria-hidden', 'false');
        };
        const closePanel = () => {
            chatbotPanel.classList.remove('open');
            chatbotPanel.setAttribute('aria-hidden', 'true');
        };

        chatbotToggle.addEventListener('click', () => {
            chatbotPanel.classList.toggle('open');
            const isOpen = chatbotPanel.classList.contains('open');
            chatbotPanel.setAttribute('aria-hidden', String(!isOpen));
        });
        chatbotClose.addEventListener('click', closePanel);
        chatbotClear.addEventListener('click', clearChat);
    }
}

// ===== HOTEL BOOKING =====
const hotelData = {
    id: 101,
    name: "فندق الريان الفاخر",
    location: "الدمام - حي الشاطئ",
    rating: 4.8,
    basePrice: 350,
    description: "يقدم فندق الريان تجربة إقامة متكاملة تجمع بين الراحة والفخامة"
};

const mainHotelImage = document.getElementById("mainHotelImage");
const thumbnails = document.querySelectorAll(".thumbnail-list img");

if (mainHotelImage && thumbnails.length > 0) {
    thumbnails.forEach((thumb) => {
        thumb.addEventListener("click", () => {
            mainHotelImage.src = thumb.src;
        });
    });
}

const selectedRoomName = document.getElementById("selectedRoomName");
const selectedRoomPrice = document.getElementById("selectedRoomPrice");
const nightPrice = document.getElementById("nightPrice");
const nightsCount = document.getElementById("nightsCount");
const totalPrice = document.getElementById("totalPrice");
const checkInInput = document.getElementById("checkIn");
const checkOutInput = document.getElementById("checkOut");
const bookingForm = document.getElementById("bookingForm");
const bookNowBtn = document.getElementById("bookNowBtn");

let selectedRoom = {
    id: 2,
    name: "غرفة مزدوجة",
    price: 350
};

const SERVICE_FEE = 25;

const roomButtons = document.querySelectorAll(".select-room-btn");

if (roomButtons.length > 0) {
    roomButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            selectedRoom.id = btn.dataset.roomId;
            selectedRoom.name = btn.dataset.roomName;
            selectedRoom.price = Number(btn.dataset.roomPrice);

            updateSelectedRoomUI();
            calculateBookingTotal();

            document.querySelector(".booking-card").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
}

function updateSelectedRoomUI() {
    if (selectedRoomName && selectedRoomPrice && nightPrice) {
        selectedRoomName.textContent = selectedRoom.name;
        selectedRoomPrice.textContent = `${selectedRoom.price} ر.س / الليلة`;
        nightPrice.textContent = `${selectedRoom.price} ر.س`;
    }
}

function calculateNights() {
    if (!checkInInput || !checkOutInput) return 1;
    
    const checkIn = new Date(checkInInput.value);
    const checkOut = new Date(checkOutInput.value);

    if (!checkInInput.value || !checkOutInput.value) {
        return 1;
    }

    const diffTime = checkOut - checkIn;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 || isNaN(diffDays)) {
        return 1;
    }

    return diffDays;
}

function calculateBookingTotal() {
    const nights = calculateNights();
    const total = (selectedRoom.price * nights) + SERVICE_FEE;

    if (nightsCount && totalPrice) {
        nightsCount.textContent = nights;
        totalPrice.textContent = `${total} ر.س`;
    }
}

if (checkInInput) checkInInput.addEventListener("change", calculateBookingTotal);
if (checkOutInput) checkOutInput.addEventListener("change", calculateBookingTotal);

if (bookNowBtn) {
    bookNowBtn.addEventListener("click", () => {
        document.querySelector(".booking-card").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}





if (bookingForm) {
    bookingForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const checkIn = checkInInput.value;
        const checkOut = checkOutInput.value;
        const guests = document.getElementById("guests").value;

        if (!checkIn || !checkOut) {
            alert("يرجى تحديد تاريخ الوصول والمغادرة");
            return;
        }

        const nights = calculateNights();

        if (nights <= 0) {
            alert("تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول");
            return;
        }

        const booking = {
            bookingId: Date.now(),
            hotelId: hotelData.id,
            hotelName: hotelData.name,
            roomId: selectedRoom.id,
            roomName: selectedRoom.name,
            roomPrice: selectedRoom.price,
            checkIn,
            checkOut,
            guests,
            nights,
            serviceFee: SERVICE_FEE,
            totalPrice: (selectedRoom.price * nights) + SERVICE_FEE,
            bookingDate: new Date().toLocaleDateString("ar-EG"),
            status: "قيد التأكيد"
        };

        const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
        bookings.push(booking);
        localStorage.setItem("bookings", JSON.stringify(bookings));

        alert("تم إرسال الحجز بنجاح");
    });
}

function setMinDates() {
    if (!checkInInput || !checkOutInput) return;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const minDate = `${yyyy}-${mm}-${dd}`;
    checkInInput.min = minDate;
    checkOutInput.min = minDate;
}

function initPage() {
    updateSelectedRoomUI();
    calculateBookingTotal();
    setMinDates();
}

if (mainHotelImage) initPage();

// ===== DASHBOARD SPECIFIC =====
function showSection(eventOrSectionId, sectionId) {
    let event = null;
    if (typeof sectionId === 'undefined') {
        sectionId = eventOrSectionId;
        event = window.event || null;
    } else {
        event = eventOrSectionId;
    }

    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.remove('active');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });

    let activeLink = null;
    if (event && event.target) {
        activeLink = event.target.closest('a');
    }
    if (!activeLink) {
        activeLink = document.querySelector(`.sidebar-menu a[href*="#${sectionId}"]`);
    }
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Settings Form Validation
const settingsForm = document.getElementById('settingsForm');

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function validateField(field, errorElement, validationFn) {
    const error = validationFn(field.value);
    if (error) {
        field.style.borderColor = '#ef4444';
        errorElement.textContent = error;
        errorElement.style.display = 'block';
        return false;
    } else {
        field.style.borderColor = '#16a34a';
        errorElement.style.display = 'none';
        return true;
    }
}

function validateFullName(value) {
    if (!value.trim()) return 'الاسم الكامل مطلوب';
    if (value.length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
    if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(value)) return 'الاسم يجب أن يحتوي على أحرف فقط';
    return '';
}

function validatePhoneNumber(value) {
    if (!value.trim()) return 'رقم الهاتف مطلوب';
    if (!/^05\d{8}$/.test(value)) return 'رقم الهاتف يجب أن يبدأ بـ05 ويحتوي على 10 أرقام';
    return '';
}

function validateEmail(value) {
    if (!value.trim()) return 'البريد الإلكتروني مطلوب';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'البريد الإلكتروني غير صالح';
    return '';
}

function validateCity(value) {
    if (!value.trim()) return 'المدينة مطلوبة';
    if (value.length < 2) return 'المدينة يجب أن تكون 2 أحرف على الأقل';
    return '';
}

function validateAddress(value) {
    if (!value.trim()) return 'العنوان مطلوب';
    if (value.length < 5) return 'العنوان يجب أن يكون 5 أحرف على الأقل';
    return '';
}

function validateNewPassword(value) {
    if (!value.trim()) return 'كلمة المرور مطلوبة';
    if (value.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) return 'كلمة المرور يجب أن تحتوي على حروف وأرقام';
    return '';
}

function validateConfirmPassword(value) {
    const newPassword = document.getElementById('newPassword').value;
    if (!value.trim()) return 'تأكيد كلمة المرور مطلوب';
    if (value !== newPassword) return 'كلمات المرور غير متطابقة';
    return '';
}

if (document.getElementById('fullName')) {
    document.getElementById('fullName').addEventListener('input', function() {
        validateField(this, document.getElementById('fullNameError'), validateFullName);
    });

    document.getElementById('phoneNumber').addEventListener('input', function() {
        validateField(this, document.getElementById('phoneNumberError'), validatePhoneNumber);
    });

    document.getElementById('email').addEventListener('input', function() {
        validateField(this, document.getElementById('emailError'), validateEmail);
    });

    document.getElementById('city').addEventListener('input', function() {
        validateField(this, document.getElementById('cityError'), validateCity);
    });

    document.getElementById('address').addEventListener('input', function() {
        validateField(this, document.getElementById('addressError'), validateAddress);
    });

    document.getElementById('newPassword').addEventListener('input', function() {
        validateField(this, document.getElementById('newPasswordError'), validateNewPassword);
    });

    document.getElementById('confirmPassword').addEventListener('input', function() {
        validateField(this, document.getElementById('confirmPasswordError'), validateConfirmPassword);
    });

    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let isValid = true;
            
            isValid &= validateField(document.getElementById('fullName'), document.getElementById('fullNameError'), validateFullName);
            isValid &= validateField(document.getElementById('phoneNumber'), document.getElementById('phoneNumberError'), validatePhoneNumber);
            isValid &= validateField(document.getElementById('email'), document.getElementById('emailError'), validateEmail);
            isValid &= validateField(document.getElementById('city'), document.getElementById('cityError'), validateCity);
            isValid &= validateField(document.getElementById('address'), document.getElementById('addressError'), validateAddress);
            isValid &= validateField(document.getElementById('newPassword'), document.getElementById('newPasswordError'), validateNewPassword);
            isValid &= validateField(document.getElementById('confirmPassword'), document.getElementById('confirmPasswordError'), validateConfirmPassword);
            
            if (isValid) {
                const successMessage = document.getElementById('successMessage');
                successMessage.style.display = 'block';
                
                const userData = {
                    fullName: document.getElementById('fullName').value,
                    phoneNumber: document.getElementById('phoneNumber').value,
                    email: document.getElementById('email').value,
                    city: document.getElementById('city').value,
                    address: document.getElementById('address').value
                };
                localStorage.setItem('userData', JSON.stringify(userData));
                
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
                
                document.getElementById('name').textContent = userData.fullName;
                document.getElementById('email').textContent = userData.email;
                document.getElementById('phone').textContent = userData.phoneNumber;
            }
        });
    }
}

function resetForm() {
    if (settingsForm) {
        settingsForm.reset();
        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
        document.querySelectorAll('input, textarea').forEach(el => el.style.borderColor = '#e5e7eb');
        document.getElementById('successMessage').style.display = 'none';
    }
}

window.addEventListener('load', function() {
    const savedData = localStorage.getItem('userData');
    if (savedData) {
        const userData = JSON.parse(savedData);
        if (document.getElementById('fullName')) {
            document.getElementById('fullName').value = userData.fullName || '';
            document.getElementById('phoneNumber').value = userData.phoneNumber || '';
            document.getElementById('email').value = userData.email || '';
            document.getElementById('city').value = userData.city || '';
            document.getElementById('address').value = userData.address || '';
        }
    }
});

function toggleSidebar() {
    const sidebar = document.getElementById('dashboardSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.dashboard-main');
    
    if (sidebar && overlay && toggleBtn && mainContent) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        mainContent.classList.toggle('expanded');
        
        const icon = toggleBtn.querySelector('i');
        if (sidebar.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

window.toggleSidebar = toggleSidebar;

document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', function() {
        if (window.innerWidth <= 1024) {
            toggleSidebar();
        }
    });
});

window.addEventListener('resize', function() {
    const sidebar = document.getElementById('dashboardSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggle');
    const mainContent = document.querySelector('.dashboard-main');
    
    if (sidebar && overlay && toggleBtn && mainContent) {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            mainContent.classList.remove('expanded');
            const icon = toggleBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
});

// ===== NOTIFICATIONS PAGE =====
let currentNotificationsPageFilter = 'all';

function updateNotificationCounts(total, unread) {
    const unreadCountElement = document.getElementById('unreadNotifications');
    const totalCountElement = document.getElementById('totalNotifications');
    if (unreadCountElement) unreadCountElement.textContent = unread;
    if (totalCountElement) totalCountElement.textContent = total;
}

function formatNotificationTime(dateString) {
    const notificationDate = new Date(dateString || Date.now());
    const now = new Date();
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return notificationDate.toLocaleDateString('ar-SA');
}

function getNotificationIcon(type) {
    const icons = {
        booking: 'fa-calendar-check',
        service: 'fa-concierge-bell',
        system: 'fa-cog'
    };
    return icons[type] || 'fa-bell';
}

async function loadNotificationsPage() {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || !currentUser.id) {
        container.innerHTML = '<div class="empty-state">يرجى تسجيل الدخول أولاً.</div>';
        updateNotificationCounts(0, 0);
        return;
    }

    try {
        let notifications = await NotificationsDB.getByUser(currentUser.id);
        if (!Array.isArray(notifications)) notifications = [];

        const filtered = currentNotificationsPageFilter === 'all'
            ? notifications
            : notifications.filter(n => n.status === currentNotificationsPageFilter);

        updateNotificationCounts(notifications.length, notifications.filter(n => n.status === 'unread').length);

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>لا توجد إشعارات حالياً</p></div>';
            return;
        }

        container.innerHTML = filtered.map(notification => `
            <div class="notification-card ${notification.status === 'unread' ? 'unread' : 'read'}" data-status="${notification.status || 'read'}" data-id="${notification.id}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h3 class="notification-title">${notification.title || 'إشعار'}</h3>
                    <p class="notification-text">${notification.message || ''}</p>
                    <div class="notification-meta">
                        <span class="notification-time"><i class="fas fa-clock"></i> ${formatNotificationTime(notification.created_at)}</span>
                        <span class="notification-type">${notification.type === 'booking' ? 'حجز' : notification.type === 'service' ? 'خدمة' : 'نظام'}</span>
                    </div>
                </div>
                <div class="notification-actions">
                    ${notification.status === 'unread' ? `<button type="button" class="btn-secondary mark-read" data-id="${notification.id}"><i class="fas fa-check"></i> تم قراءته</button>` : ''}
                    <button type="button" class="btn-secondary delete" data-id="${notification.id}"><i class="fas fa-trash-alt"></i> حذف</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load notifications page:', error);
        container.innerHTML = '<div class="empty-state">تعذر تحميل الإشعارات.</div>';
        updateNotificationCounts(0, 0);
    }
}

function setNotificationsPageFilter(filter) {
    currentNotificationsPageFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
    loadNotificationsPage();
}

async function markNotificationAsRead(notificationId) {
    if (!notificationId) return;
    try {
        await NotificationsDB.markAsRead(notificationId);
        await loadNotificationsPage();
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function deleteNotification(notificationId) {
    if (!notificationId) return;
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;
    try {
        const supabase = getSupabase();
        const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
        if (error) throw error;
        await loadNotificationsPage();
    } catch (error) {
        console.error('Failed to delete notification:', error);
    }
}

async function markAllNotificationsAsRead() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || !currentUser.id) return;
    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'read' })
            .eq('user_id', currentUser.id)
            .eq('status', 'unread');
        if (error) throw error;
        await loadNotificationsPage();
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
    }
}

async function clearAllNotifications() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || !currentUser.id) return;
    if (!confirm('هل أنت متأكد من مسح جميع الإشعارات؟')) return;
    try {
        const supabase = getSupabase();
        const { error } = await supabase.from('notifications').delete().eq('user_id', currentUser.id);
        if (error) throw error;
        await loadNotificationsPage();
    } catch (error) {
        console.error('Failed to clear all notifications:', error);
    }
}

document.addEventListener('click', function (event) {
    const markReadBtn = event.target.closest('.mark-read');
    if (markReadBtn) {
        const id = markReadBtn.dataset.id;
        markNotificationAsRead(id);
        return;
    }

    const deleteBtn = event.target.closest('.delete');
    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        deleteNotification(id);
        return;
    }

    if (event.target.closest('.mark-all-read')) {
        markAllNotificationsAsRead();
        return;
    }

    if (event.target.closest('.clear-all')) {
        clearAllNotifications();
        return;
    }

    const filterBtn = event.target.closest('.filter-btn');
    if (filterBtn) {
        setNotificationsPageFilter(filterBtn.dataset.filter || 'all');
        return;
    }
});

// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ===== MOBILE MENU TOGGLE =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
}

// ===== USER MANAGEMENT FUNCTIONS =====

// View User Details
function viewUser(userId) {
    const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!userRow) return;

    const cells = userRow.querySelectorAll('td');
    const userName = cells[0].textContent;
    const userEmail = cells[1].textContent;
    const userPhone = cells[2].textContent;
    const userBookings = cells[3].textContent;
    const statusSpan = cells[4].querySelector('.status');
    const userStatus = statusSpan.textContent;

    const message = `
        تفاصيل المستخدم:
        ----------------
        الاسم: ${userName}
        البريد الإلكتروني: ${userEmail}
        رقم الهاتف: ${userPhone}
        عدد الحجوزات: ${userBookings}
    `;

    alert(message);
}

// Toggle User Status (Enable/Disable)
function toggleUserStatus(userId) {
    const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!userRow) return;

    const statusSpan = userRow.querySelector('.status');
    const disableBtn = userRow.querySelector('.btn-disable');

    if (statusSpan.classList.contains('active')) {
        // Disable user
        if (confirm('هل أنت متأكد من تعطيل حساب هذا المستخدم؟')) {
            statusSpan.classList.remove('active');
            statusSpan.classList.add('inactive');
            statusSpan.textContent = 'معطل';
            disableBtn.textContent = 'تفعيل';
            alert('تم تعطيل حساب المستخدم بنجاح');
        }
    } else {
        // Enable user
        if (confirm('هل أنت متأكد من تفعيل حساب هذا المستخدم؟')) {
            statusSpan.classList.remove('inactive');
            statusSpan.classList.add('active');
            statusSpan.textContent = 'نشط';
            disableBtn.textContent = 'تعطيل';
            alert('تم تفعيل حساب المستخدم بنجاح');
        }
    }
}

// Delete User
function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.')) {
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (userRow) {
            userRow.style.transition = 'all 0.3s ease';
            userRow.style.transform = 'translateX(100%)';
            userRow.style.opacity = '0';
            
            setTimeout(() => {
                userRow.remove();
                alert('تم حذف المستخدم بنجاح');
            }, 300);
        }
    }
}

// View Provider Details
function viewProvider(providerId) {
    const providerRow = document.querySelector(`tr[data-provider-id="${providerId}"]`);
    if (!providerRow) return;

    const cells = providerRow.querySelectorAll('td');
    const providerName = cells[0].textContent;
    const establishmentName = cells[1].textContent;
    const activityType = cells[2].textContent;
    const providerPhone = cells[3].textContent;
    const servicesCount = cells[4].textContent;
    const statusSpan = cells[5].querySelector('.status');
    const providerStatus = statusSpan.textContent;

    const message = `
        تفاصيل مقدم الخدمة:
        -------------------
        الاسم: ${providerName}
        اسم المنشأة: ${establishmentName}
        نوع النشاط: ${activityType}
        رقم الهاتف: ${providerPhone}
        عدد الخدمات: ${servicesCount}
    `;

    alert(message);
}

// Edit Provider
function editProvider(providerId) {
    const providerRow = document.querySelector(`tr[data-provider-id="${providerId}"]`);
    if (!providerRow) return;

    const cells = providerRow.querySelectorAll('td');
    const providerName = cells[0].textContent;
    const establishmentName = cells[1].textContent;

    alert(`سيتم فتح نموذج تعديل بيانات مقدم الخدمة: ${providerName} - ${establishmentName}`);
    // Here you would typically open a modal or navigate to an edit page
}

// Toggle Provider Status (Enable/Disable)
function toggleProviderStatus(providerId) {
    const providerRow = document.querySelector(`tr[data-provider-id="${providerId}"]`);
    if (!providerRow) return;

    const statusSpan = providerRow.querySelector('.status');
    const disableBtn = providerRow.querySelector('.btn-disable');

    if (statusSpan.classList.contains('active')) {
        // Disable provider
        if (confirm('هل أنت متأكد من تعطيل حساب مقدم الخدمة؟')) {
            statusSpan.classList.remove('active');
            statusSpan.classList.add('inactive');
            statusSpan.textContent = 'معطل';
            disableBtn.textContent = 'تفعيل';
            alert('تم تعطيل حساب مقدم الخدمة بنجاح');
        }
    } else {
        // Enable provider
        if (confirm('هل أنت متأكد من تفعيل حساب مقدم الخدمة؟')) {
            statusSpan.classList.remove('inactive');
            statusSpan.classList.add('active');
            statusSpan.textContent = 'نشط';
            disableBtn.textContent = 'تعطيل';
            alert('تم تفعيل حساب مقدم الخدمة بنجاح');
        }
    }
}

// Delete Provider
function deleteProvider(providerId) {
    if (confirm('هل أنت متأكد من حذف مقدم الخدمة؟ لا يمكن التراجع عن هذا الإجراء.')) {
        const providerRow = document.querySelector(`tr[data-provider-id="${providerId}"]`);
        if (providerRow) {
            providerRow.style.transition = 'all 0.3s ease';
            providerRow.style.transform = 'translateX(100%)';
            providerRow.style.opacity = '0';
            
            setTimeout(() => {
                providerRow.remove();
                alert('تم حذف مقدم الخدمة بنجاح');
            }, 300);
        }
    }
}

// ===== SERVICE FORM VALIDATION =====

// Reset Service Form
function resetServiceForm() {
    const form = document.getElementById('serviceForm');
    if (form) {
        form.reset();
    }
}

// Animated Alert Function
function showAnimatedAlert(message, type = 'success') {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.animated-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `animated-alert ${type}`;
    alert.innerHTML = `
        <div class="alert-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div class="alert-message">${message}</div>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to document
    document.body.appendChild(alert);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (alert && alert.parentElement) {
            alert.classList.add('fade-out');
            setTimeout(() => {
                alert.remove();
            }, 300);
        }
    }, 3000);
}

// ===== DISPLAY SERVICES FUNCTION =====

// Display Services Based on Status
function displayServices() {
    const statusFilter = document.getElementById('serviceStatusFilter');
    const displayArea = document.getElementById('servicesDisplayArea');
    const tableContainer = document.getElementById('servicesTableContainer');
    
    const selectedStatus = statusFilter.value;
    
    if (!selectedStatus) {
        showAnimatedAlert('يرجى اختيار حالة الخدمة', 'error');
        return;
    }
    
    // Get services from localStorage or use sample data
    let services = JSON.parse(localStorage.getItem('services')) || [];
    
    // If no services in localStorage, add sample data
    if (services.length === 0) {
        services = [
            {
                id: 1,
                type: 'confirmed',
                description: 'خدمة تصفيف شعر احترافية للنساء',
                location: 'الرياض - حي النخيل',
                price: 150,
                duration: 'ساعة',
                workingDays: 'saturday-thursday',
                workingTime: '09:00',
                dateAdded: '2026-06-20'
            },
            {
                id: 2,
                type: 'pending',
                description: 'خدمة عناية بالبشرة والوجه',
                location: 'جدة - حي الروضة',
                price: 200,
                duration: '45 دقيقة',
                workingDays: 'sunday-thursday',
                workingTime: '10:00',
                dateAdded: '2026-06-22'
            },
            {
                id: 3,
                type: 'confirmed',
                description: 'خدمة مكياج عرائس كامل',
                location: 'الدمام - حي الشاطئ',
                price: 500,
                duration: '3 ساعات',
                workingDays: 'all-days',
                workingTime: '08:00',
                dateAdded: '2026-06-25'
            },
            {
                id: 4,
                type: 'rejected',
                description: 'خدمة عناية بالأظافر',
                location: 'مكة - حي العزيزية',
                price: 80,
                duration: '30 دقيقة',
                workingDays: 'saturday-wednesday',
                workingTime: '14:00',
                dateAdded: '2026-06-26'
            },
            {
                id: 5,
                type: 'pending',
                description: 'خدمة حمام مغربي',
                location: 'المدينة - حي العنبرية',
                price: 250,
                duration: 'ساعة ونصف',
                workingDays: 'saturday-thursday',
                workingTime: '16:00',
                dateAdded: '2026-06-27'
            }
        ];
    }
    
    // Filter services by status
    const filteredServices = services.filter(service => service.type === selectedStatus);
    
    if (filteredServices.length === 0) {
        tableContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
            </div>
        `;
    } else {
        // Create services table
        let tableHTML = `
            <table class="services-display-table">
                <thead>
                    <tr>
                        <th>نوع الخدمة</th>
                        <th>الوصف</th>
                        <th>الموقع</th>
                        <th>السعر</th>
                        <th>المدة</th>
                        <th>أيام العمل</th>
                        <th>وقت العمل</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        filteredServices.forEach(service => {
            const statusText = getStatusText(service.type);
            const workingDaysText = getWorkingDaysText(service.workingDays);
            
            tableHTML += `
                <tr>
                    <td><span class="status ${service.type}">${statusText}</span></td>
                    <td>${service.description}</td>
                    <td>${service.location}</td>
                    <td>${service.price} ر.س</td>
                    <td>${service.duration}</td>
                    <td>${workingDaysText}</td>
                    <td>${service.workingTime}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        tableContainer.innerHTML = tableHTML;
    }
    
    // Show display area
    displayArea.style.display = 'block';
    displayArea.style.animation = 'fadeIn 0.5s ease';
}

// Helper function to get status text in Arabic
function getStatusText(status) {
    const statusMap = {
        'confirmed': 'مؤكدة',
        'rejected': 'مرفوضة',
        'pending': 'قيد الإجراء'
    };
    return statusMap[status] || status;
}

// Helper function to get working days text in Arabic
function getWorkingDaysText(days) {
    const daysMap = {
        'saturday-thursday': 'السبت - الخميس',
        'sunday-thursday': 'الأحد - الخميس',
        'saturday-wednesday': 'السبت - الأربعاء',
        'all-days': 'جميع الأيام'
    };
    return daysMap[days] || days;
}

// ===== OFFERS MANAGEMENT =====
/*
// Load offers on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('offers')) {
        loadOffers();
    }
});

// Open Offer Modal
function openOfferModal(offerId = null) {
    const modal = document.getElementById('offerModal');
    const modalTitle = document.getElementById('modalTitle');
    const offerForm = document.getElementById('offerForm');
    
    if (offerId) {
        // Edit mode
        modalTitle.textContent = 'تعديل العرض';
        const offers = JSON.parse(localStorage.getItem('offers')) || [];
        const offer = offers.find(o => o.id === offerId);
        
        if (offer) {
            document.getElementById('offerId').value = offer.id;
            document.getElementById('offerName').value = offer.name;
            document.getElementById('offerDiscount').value = offer.discount;
            document.getElementById('offerStatus').value = offer.status;
        }
    } else {
        // Add mode
        modalTitle.textContent = 'إضافة عرض جديد';
        offerForm.reset();
        document.getElementById('offerId').value = '';
    }
    
    modal.style.display = 'flex';
    modal.style.animation = 'fadeIn 0.3s ease';
}

// Close Offer Modal
function closeOfferModal() {
    const modal = document.getElementById('offerModal');
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Offer Form Submission
const offerForm = document.getElementById('offerForm');
if (offerForm) {
    offerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const offerId = document.getElementById('offerId').value;
        const offerName = document.getElementById('offerName').value;
        const offerDiscount = document.getElementById('offerDiscount').value;
        const offerStatus = document.getElementById('offerStatus').value;
        
        let offers = JSON.parse(localStorage.getItem('offers')) || [];
        
        if (offerId) {
            // Edit existing offer
            const index = offers.findIndex(o => o.id === parseInt(offerId));
            if (index !== -1) {
                offers[index].name = offerName;
                offers[index].discount = offerDiscount;
                offers[index].status = offerStatus;
                showAnimatedAlert('تم تعديل العرض بنجاح', 'success');
            }
        } else {
            // Add new offer
            const newOffer = {
                id: Date.now(),
                name: offerName,
                discount: offerDiscount,
                status: offerStatus,
                usage: 0,
                dateAdded: new Date().toISOString().split('T')[0]
            };
            offers.push(newOffer);
            showAnimatedAlert('تم إضافة العرض بنجاح', 'success');
        }
        
        localStorage.setItem('offers', JSON.stringify(offers));
        loadOffers();
        closeOfferModal();
    });
}

// Load Offers
function loadOffers() {
    const offersTableBody = document.getElementById('offersTableBody');
    const activeOffersCount = document.getElementById('activeOffersCount');
    const expiredOffersCount = document.getElementById('expiredOffersCount');
    const totalUsageCount = document.getElementById('totalUsageCount');
    const totalDiscountCount = document.getElementById('totalDiscountCount');
    
    let offers = JSON.parse(localStorage.getItem('offers')) || [];
    
    // If no offers, add sample data
    if (offers.length === 0) {
        offers = [
            {
                id: 1,
                name: 'عرض الصيف',
                discount: '20%',
                status: 'active',
                usage: 45,
                dateAdded: '2026-06-20'
            },
            {
                id: 2,
                name: 'عرض الشتاء',
                discount: '50 SAR',
                status: 'expired',
                usage: 75,
                dateAdded: '2026-01-15'
            }
        ];
        localStorage.setItem('offers', JSON.stringify(offers));
    }
    
    // Update stats
    const activeOffers = offers.filter(o => o.status === 'active');
    const expiredOffers = offers.filter(o => o.status === 'expired');
    const totalUsage = offers.reduce((sum, o) => sum + (o.usage || 0), 0);
    
    if (activeOffersCount) activeOffersCount.textContent = activeOffers.length;
    if (expiredOffersCount) expiredOffersCount.textContent = expiredOffers.length;
    if (totalUsageCount) totalUsageCount.textContent = totalUsage;
    
    // Calculate total discount (simplified calculation)
    let totalDiscount = 0;
    offers.forEach(offer => {
        if (offer.discount.includes('%')) {
            const percentage = parseFloat(offer.discount.replace('%', ''));
            totalDiscount += (percentage * offer.usage || 0);
        } else if (offer.discount.includes('SAR')) {
            totalDiscount += parseFloat(offer.discount.replace('SAR', '').trim()) * (offer.usage || 0);
        }
    });
    if (totalDiscountCount) totalDiscountCount.textContent = Math.round(totalDiscount);
    
    // Render offers table
    let tableHTML = '';
    offers.forEach(offer => {
        const statusText = offer.status === 'active' ? 'نشط' : 'منتهي';
        const statusClass = offer.status === 'active' ? 'active' : 'inactive';
        
        tableHTML += `
            <tr data-offer-id="${offer.id}">
                <td>${offer.name}</td>
                <td>${offer.discount}</td>
                <td>
                    <span class="status ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn btn-edit" onclick="openOfferModal(${offer.id})">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteOffer(${offer.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    if (offersTableBody) {
        offersTableBody.innerHTML = tableHTML;
    }
}

// Delete Offer
function deleteOffer(offerId) {
    if (confirm('هل أنت متأكد من حذف هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.')) {
        let offers = JSON.parse(localStorage.getItem('offers')) || [];
        offers = offers.filter(o => o.id !== offerId);
        localStorage.setItem('offers', JSON.stringify(offers));
        
        const row = document.querySelector(`tr[data-offer-id="${offerId}"]`);
        if (row) {
            row.style.transition = 'all 0.3s ease';
            row.style.transform = 'translateX(100%)';
            row.style.opacity = '0';
            
            setTimeout(() => {
                loadOffers();
                showAnimatedAlert('تم حذف العرض بنجاح', 'success');
            }, 300);
        }
    }
}
*/
// Format notification time
function formatNotificationTime(date, time) {
    const notificationDate = new Date(date + ' ' + time);
    const now = new Date();
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date;
}

// ===== SEND NOTIFICATIONS =====

// Toggle User Select
function toggleUserSelect() {
    const sendType = document.getElementById('notificationSendType').value;
    const userSelectContainer = document.getElementById('userSelectContainer');
    const userSelect = document.getElementById('userSelect');
    
    if (sendType === 'specific') {
        userSelectContainer.style.display = 'block';
        userSelect.required = true;
    } else {
        userSelectContainer.style.display = 'none';
        userSelect.required = false;
        userSelect.value = '';
    }
}

// Send Notification Form
const sendNotificationForm = document.getElementById('sendNotificationForm');
if (sendNotificationForm) {
    sendNotificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const sendType = document.getElementById('notificationSendType').value;
        const userId = document.getElementById('userSelect').value;
        const title = document.getElementById('notificationTitle').value;
        const message = document.getElementById('notificationMessage').value;
        
        // Validate
        if (sendType === 'specific' && !userId) {
            showAnimatedAlert('يرجى اختيار المستخدم', 'error');
            return;
        }
        
        // Create notification object
        const sentNotification = {
            id: Date.now(),
            sendType: sendType,
            userId: sendType === 'specific' ? userId : null,
            userName: sendType === 'specific' ? getUserName(userId) : 'جميع المستخدمين',
            title: title,
            message: message,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        };
        
        // Save to sent notifications
        let sentNotifications = JSON.parse(localStorage.getItem('sentNotifications')) || [];
        sentNotifications.push(sentNotification);
        localStorage.setItem('sentNotifications', JSON.stringify(sentNotifications));
        
        // Show success message
        const recipientText = sendType === 'all' ? 'جميع المستخدمين' : `المستخدم ${sentNotification.userName}`;
        showAnimatedAlert(`تم إرسال الإشعار إلى ${recipientText} بنجاح`, 'success');
        
        // Reset form
        sendNotificationForm.reset();
        toggleUserSelect();
    });
}

// Get User Name by ID
function getUserName(userId) {
    const users = {
        '1': 'سارة أحمد',
        '2': 'أحمد محمد',
        '3': 'فاطمة علي',
        '4': 'خالد عمر'
    };
    return users[userId] || 'مستخدم غير معروف';
}

// Toggle Sent Notifications
function toggleSentNotifications() {
    const container = document.getElementById('sentNotificationsContainer');
    if (!container) return;

    const isHidden = container.style.display === 'none' || container.style.display === '';
    container.style.display = isHidden ? 'block' : 'none';
}

// ===== DASHBOARD BOOKINGS MANAGEMENT =====

function parseBookingDetails(rawDetails) {
    if (!rawDetails) return {};
    if (typeof rawDetails === 'string') {
        try {
            return JSON.parse(rawDetails);
        } catch (error) {
            return {};
        }
    }
    return rawDetails;
}

function formatPaymentMethodLabel(value) {
    if (!value) return 'غير محدد';
    const normalized = String(value).toLowerCase();
    if (normalized === 'paypal') return 'PayPal';
    if (normalized === 'card' || normalized === 'visa') return 'بطاقة فيزا';
    return value;
}

async function viewBooking(bookingId) {
    try {
        const supabase = getSupabase();
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (error || !booking) {
            alert('تعذر تحميل تفاصيل الحجز.');
            return;
        }

        const details = parseBookingDetails(booking.details);
        const dateText = booking.booking_date || booking.date || 'غير محدد';
        const timeText = details.time || booking.time || 'غير محدد';
        const paymentText = formatPaymentMethodLabel(details.payment_method || booking.payment_method);
        const statusText = booking.status === 'accepted' || booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'pending' ? 'قيد الانتظار' : booking.status === 'rejected' ? 'مرفوض' : 'ملغي';

        let serviceTitle = 'حجز';
        if (booking.service_id) {
            try {
                const { data: service } = await supabase.from('services').select('*').eq('id', booking.service_id).single();
                if (service) {
                    serviceTitle = service.title || service.service_type || service.service_name || 'حجز';
                }
            } catch (e) {
                console.warn('Unable to fetch service title for view booking', e);
            }
        }

        alert(`تفاصيل الحجز:\n\nالخدمة: ${serviceTitle}\nالاسم: ${booking.booking_name || 'غير محدد'}\nالتاريخ: ${dateText}\nالوقت: ${timeText}\nطريقة الدفع: ${paymentText}\nالحالة: ${statusText}`);
    } catch (error) {
        console.error('Failed to view booking', error);
        alert('تعذر عرض تفاصيل الحجز.');
    }
}

async function editBooking(bookingId) {
    try {
        const supabase = getSupabase();
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (error || !booking) {
            alert('تعذر العثور على الحجز المطلوب.');
            return;
        }

        const details = parseBookingDetails(booking.details);
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        let serviceTitle = 'حجز';

        if (booking.service_id) {
            try {
                const { data: service } = await supabase.from('services').select('*').eq('id', booking.service_id).single();
                if (service) {
                    serviceTitle = service.title || service.service_type || service.service_name || 'حجز';
                }
            } catch (e) {
                console.warn('Unable to fetch service title for edit booking', e);
            }
        }

        const modal = document.getElementById('bookingEditModal');
        if (!modal) return;

        document.getElementById('editBookingId').value = booking.id;
        document.getElementById('editBookingServiceTitle').textContent = serviceTitle;
        document.getElementById('editBookingName').value = booking.booking_name || currentUser?.full_name || '';
        document.getElementById('editBookingEmail').value = currentUser?.email || '';
        document.getElementById('editBookingPhone').value = currentUser?.phone || '';
        document.getElementById('editBookingDate').value = booking.booking_date || '';
        document.getElementById('editBookingTime').value = details.time || booking.time || '';
        document.getElementById('editBookingPayment').value = details.payment_method || booking.payment_method || 'paypal';

        modal.style.display = 'flex';
    } catch (error) {
        console.error('Failed to open booking edit modal', error);
        alert('تعذر فتح نافذة تعديل الحجز.');
    }
}

function closeBookingModal() {
    const modal = document.getElementById('bookingEditModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('bookingEditForm');
    if (form) form.reset();
}

const bookingEditForm = document.getElementById('bookingEditForm');
if (bookingEditForm) {
    bookingEditForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const bookingId = document.getElementById('editBookingId').value;
        const bookingName = document.getElementById('editBookingName').value.trim();
        const bookingDate = document.getElementById('editBookingDate').value;
        const bookingTime = document.getElementById('editBookingTime').value;
        const paymentMethod = document.getElementById('editBookingPayment').value;

        if (!bookingId || !bookingName || !bookingDate || !bookingTime) {
            alert('يرجى تعبئة جميع الحقول المطلوبة.');
            return;
        }

        try {
            const supabase = getSupabase();
            const payload = {
                booking_name: bookingName,
                booking_date: bookingDate,
                details: JSON.stringify({
                    time: bookingTime,
                    payment_method: paymentMethod,
                    payment_meta: paymentMethod === 'card' ? { method: 'card' } : { method: 'paypal' }
                })
            };

            const { error } = await supabase
                .from('bookings')
                .update(payload)
                .eq('id', bookingId);

            if (error) throw error;

            closeBookingModal();
            alert('تم تحديث الحجز بنجاح.');
            if (typeof loadCustomerBookings === 'function') {
                await loadCustomerBookings();
            }
        } catch (error) {
            console.error('Failed to update booking', error);
            alert('تعذر تحديث الحجز. حاول مرة أخرى.');
        }
    });
}

// Cancel Booking
async function cancelBooking(bookingId) {
    const bookingCard = document.querySelector(`.modern-card[data-booking-id="${bookingId}"]`);
    const bookingName = bookingCard ? bookingCard.querySelector('.card-title')?.textContent || 'الحجز' : 'الحجز';
    if (!confirm(`هل أنت متأكد من إلغاء ${bookingName}؟\n\nلا يمكن التراجع عن هذا الإجراء.`)) {
        return;
    }

    try {
        const supabase = getSupabase();
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);
        if (error) throw error;

        alert(`تم إلغاء ${bookingName} بنجاح`);
        if (typeof loadCustomerBookings === 'function') {
            loadCustomerBookings();
        } else if (bookingCard) {
            bookingCard.remove();
        }
    } catch (err) {
        console.error('Failed to cancel booking', err);
        alert('تعذر إلغاء الحجز. حاول مرة أخرى لاحقًا.');
    }
}

// ===== DYNAMIC SEARCH =====
function initDynamicSearch() {
    const searchSections = document.querySelectorAll('.hero-search, .page-search');
    if (!searchSections.length) return;

    searchSections.forEach(section => {
        const searchInput = section.querySelector('input[type="text"], input[type="search"], input.search-input');
        const searchButton = section.querySelector('button');
        if (!searchInput || !searchButton) return;

        const targetSelector = section.dataset.searchTarget || '.cards-grid';
        const cardsGrid = document.querySelector(targetSelector);
        if (!cardsGrid) return;

        const cards = Array.from(cardsGrid.querySelectorAll('.modern-card'));
        if (!cards.length) return;

        const noResultsCard = document.createElement('div');
        noResultsCard.className = 'modern-card';
        noResultsCard.style.textAlign = 'center';
        noResultsCard.style.padding = '2rem';
        noResultsCard.innerHTML = `
            <i class="fas fa-search-minus" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 1rem;"></i>
            <p style="color: var(--text-secondary);">لم يتم العثور على خدمات تطابق البحث</p>
        `;

        const performSearch = () => {
            const query = searchInput.value.trim().toLowerCase();
            let matchedCount = 0;

            cards.forEach(card => {
                const cardText = card.textContent.toLowerCase();
                const match = query === '' || cardText.includes(query);
                card.style.display = match ? '' : 'none';
                if (match) matchedCount += 1;
            });

            if (matchedCount === 0) {
                if (!cardsGrid.contains(noResultsCard)) {
                    cardsGrid.appendChild(noResultsCard);
                }
            } else {
                if (cardsGrid.contains(noResultsCard)) {
                    noResultsCard.remove();
                }
            }
        };

        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('input', performSearch);

        const parentForm = section.closest('form');
        if (parentForm) {
            parentForm.addEventListener('submit', event => {
                event.preventDefault();
                performSearch();
            });
        }
    });
}

window.addEventListener('DOMContentLoaded', initDynamicSearch);

// ===== PAGE-SPECIFIC INITIALIZERS =====
function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getServiceDisplayTitle(service) {
    const directTitle = service && (service.title || service.service_title || service.name || service.serviceName);
    if (typeof directTitle === 'string' && directTitle.trim()) {
        return directTitle.trim();
    }
    const serviceType = service && (service.service_type || service.type || '');
    if (typeof serviceType === 'string' && serviceType.trim()) {
        return serviceType.trim();
    }
    return 'خدمة';
}

function initHomePage() {
    const servicesGrid = document.getElementById('servicesGrid');
    if (!servicesGrid) return;

    servicesGrid.innerHTML = '<div class="section-subtitle">جاري تحميل الخدمات...</div>';

    ServicesDB.getApproved().then((services) => {
        if (!Array.isArray(services) || services.length === 0) {
            servicesGrid.innerHTML = '<div class="modern-card hover-lift" style="grid-column: 1 / -1; text-align: center;">' +
                '<h3 class="card-title">لا يوجد خدمات حاليا</h3>' +
                '<p class="card-description">ستظهر الخدمات المتاحة هنا بمجرد إضافتها إلى قاعدة البيانات.</p>' +
                '</div>';
            return;
        }

        servicesGrid.innerHTML = '';
        services.forEach((service) => {
            const card = document.createElement('div');
            card.className = 'modern-card hover-lift';
            const serviceStatus = service.status === 'approved' ? 'مُعتمد' : service.status === 'pending' ? 'قيد المراجعة' : 'مرفوض';
            const serviceTitle = getServiceDisplayTitle(service);
            const serviceImage = service.image_url ? escapeHtml(service.image_url) : 'Images/logo.svg';
            card.innerHTML = `
            
                <img src="${serviceImage}" alt="${escapeHtml(serviceTitle)}" class="card-image">
                <h3 class="card-title">${escapeHtml(serviceTitle)}</h3>
                <p class="card-description">${escapeHtml(service.description || 'لا يوجد وصف متاح')}</p>
                <span class="card-badge"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(service.location || 'بدون موقع')}</span>
                <div class="section-subtitle" style="margin: 0.5rem 0;">السعر: ${escapeHtml(service.price || 0)} ر.س</div>
                <a href="service-details.html?id=${encodeURIComponent(service.id)}&type=${encodeURIComponent(service.service_type || '')}" class="card-btn">
                    <i class="fas fa-eye"></i> استعرض الخدمة
                </a>
            `;
            servicesGrid.appendChild(card);
        });
    }).catch((error) => {
        console.error('Failed to load featured services:', error);
        servicesGrid.innerHTML = '<div class="modern-card hover-lift" style="grid-column: 1 / -1; text-align: center;">' +
            '<h3 class="card-title">لا يوجد خدمات حاليا</h3>' +
            '<p class="card-description">تعذر تحميل الخدمات من قاعدة البيانات حالياً.</p>' +
            '</div>';
    });
}

function initHomeOffers() {
    const offersGrid = document.getElementById('offersGrid');
    if (!offersGrid) return;

    offersGrid.innerHTML = '<div class="section-subtitle">جاري تحميل العروض...</div>';

    if (typeof OffersDB === 'undefined') {
        offersGrid.innerHTML = '<div class="section-subtitle">تعذر الاتصال بقاعدة البيانات.</div>';
        return;
    }

    OffersDB.getActive().then((offers) => {
        if (!Array.isArray(offers) || offers.length === 0) {
            offersGrid.innerHTML = '<div class="modern-card hover-lift" style="grid-column: 1 / -1; text-align: center;">' +
                '<h3 class="card-title">لا توجد عروض حاليا</h3>' +
                '<p class="card-description">ستظهر العروض والخصومات المتاحة هنا بمجرد إضافتها من قبل مقدمي الخدمات.</p>' +
                '</div>';
            return;
        }

        offersGrid.innerHTML = '';
        offers.forEach((offer) => {
            const card = document.createElement('div');
            card.className = 'modern-card hover-lift';
            const offerImage = offer.image_url ? escapeHtml(offer.image_url) : 'Images/logo.svg';
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const isLoggedIn = currentUser && (currentUser.role === 'customer' || currentUser.role === 'provider');
            const offerLink = isLoggedIn ? 'customer-services.html' : 'login.html';
            
            card.innerHTML = `
                ${offer.image_url ? `<img src="${offerImage}" alt="${escapeHtml(offer.title || 'عرض')}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;">` : '<img src="Images/logo.svg" alt="'+escapeHtml(offer.title || 'عرض')+'" style="width:100%;height:220px;object-fit:cover;border-radius:12px;">'}
                
                <div style="padding: 0.5rem 0;">
                    <h3 class="card-title" style="margin:0.5rem 0;">${escapeHtml(offer.title || 'عرض خاص')}</h3>
                    <p class="card-description" style="margin:0.25rem 0;">${escapeHtml(offer.description || 'احصل على أفضل الخصومات الآن!')}</p>
                    <div style="font-size:1.5rem; font-weight:bold; color:#10b981; margin:0.5rem 0;">خصم ${escapeHtml(offer.discount_percentage || 0)}%</div>
                    <small style="color:var(--text-secondary);">صالح حتى: ${escapeHtml(new Date(offer.end_date).toLocaleDateString('ar-SA'))}</small>
                </div>

                <div style="padding: 0.5rem 0;">
                    <a href="offer-details.html?id=${encodeURIComponent(offer.id)}" class="card-btn" style="display:block; text-align:center; background:#10b981; color:white; padding:0.75rem 1rem; border-radius:12px; text-decoration:none; font-weight:700; transition:transform 0.2s ease;">
                        <i class="fas fa-ticket-alt"></i> احصل على العرض
                    </a>
                </div>
            `;
            offersGrid.appendChild(card);
        });
    }).catch((error) => {
        console.error('Failed to load active offers:', error);
        offersGrid.innerHTML = '<div class="modern-card hover-lift" style="grid-column: 1 / -1; text-align: center;">' +
            '<h3 class="card-title">لا توجد عروض حاليا</h3>' +
            '<p class="card-description">تعذر تحميل العروض من قاعدة البيانات حالياً.</p>' +
            '</div>';
    });
}

function getServicePage(serviceType) {
    const type = (serviceType || '').toLowerCase();
    if (type.includes('hotel') || type.includes('فندق')) return 'hotelsPage.html';
    if (type.includes('gym') || type.includes('لياقة') || type.includes('رياض')) return 'gymPage.html';
    if (type.includes('salon') || type.includes('صالون') || type.includes('تجميل')) return 'salonPage.html';
    return 'resturantPage.html';
}

function initLoginPage() {
    let supabaseInstance = null;
    try {
        supabaseInstance = getSupabase();
    } catch (error) {
        console.error('Error initializing Supabase:', error);
    }

    const container = document.querySelector('.container');
    const registerBtn = document.querySelector('.register-btn');
    const loginBtn = document.querySelector('.login-btn');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const countryCodeSelect = document.getElementById('countryCode');

    if (registerBtn) registerBtn.addEventListener('click', () => container?.classList.add('active'));
    if (loginBtn) loginBtn.addEventListener('click', () => container?.classList.remove('active'));

    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 10) this.value = this.value.slice(0, 10);
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', function () {
            this.style.borderColor = this.value.length < 8 ? '#ef4444' : '#22c55e';
        });
    }

    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', function () {
            this.style.borderColor = this.value !== passwordInput.value ? '#ef4444' : '#22c55e';
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            let isValid = true;
            let errorMessage = '';

            if (!countryCodeSelect?.value) {
                errorMessage = 'يرجى اختيار رمز الدولة';
                isValid = false;
            }

            if (isValid && phoneNumberInput?.value.length !== 10) {
                errorMessage = 'رقم الهاتف يجب أن يكون 10 أرقام';
                isValid = false;
            }

            if (isValid && passwordInput?.value.length < 8) {
                errorMessage = 'كلمة المرور يجب أن تكون 8 محارف على الأقل';
                isValid = false;
            }

            if (isValid && passwordInput?.value !== confirmPasswordInput?.value) {
                errorMessage = 'كلمة المرور وتأكيد كلمة المرور غير متطابقين';
                isValid = false;
            }

            if (!isValid) {
                alert(errorMessage);
                return;
            }

            if (!supabaseInstance) {
                alert('خطأ: لم يتم تهيئة قاعدة البيانات. يرجى التأكد من تحميل مكتبة Supabase.');
                return;
            }

            if (typeof UsersDB === 'undefined') {
                alert('خطأ: لم يتم العثور على دوال قاعدة البيانات. يرجى التأكد من تحميل ملف supabase-config.js');
                return;
            }

            try {
                const userData = {
                    email: document.getElementById('registerEmail').value,
                    password: passwordInput.value,
                    fullName: document.getElementById('registerName').value,
                    phone: phoneNumberInput.value,
                    countryCode: countryCodeSelect.value,
                    city: '',
                    address: '',
                    role: document.getElementById('role').value
                };

                const user = await UsersDB.register(userData);
                localStorage.setItem('currentUser', JSON.stringify(user));
                alert('تم إنشاء الحساب بنجاح!');
                registerForm.reset();

                if (user.role === 'customer') window.location.href = 'dashboard.html';
                else if (user.role === 'provider') window.location.href = 'provider.html';
            } catch (error) {
                alert('حدث خطأ أثناء إنشاء الحساب: ' + error.message);
                console.error('Registration error:', error);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const user = await UsersDB.login(email, password);
                localStorage.setItem('currentUser', JSON.stringify(user));
                alert('تم تسجيل الدخول بنجاح!');

                if (user.role === 'customer') window.location.href = 'dashboard.html';
                else if (user.role === 'provider') window.location.href = 'provider.html';
                else if (user.role === 'admin') window.location.href = 'adminpage.html';
            } catch (error) {
                alert('خطأ في البريد الإلكتروني أو كلمة المرور');
                console.error('Login error:', error);
            }
        });
    }
}

function initContactPage() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            alert(`تم العملية بنجاح!\n\nتم إرسال الرسالة إلى:\nالاسم: ${name}\nالإيميل: ${email}`);
            contactForm.reset();
        });
    }
}

function initBookingPage() {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const id = params.get('id');
    const item = params.get('item');
    const plan = params.get('plan');
    const title = item ? `${item}` : 'تفاصيل الحجز';
    const price = plan ? `${plan}` : 'حسب الخدمة';

    const titleEl = document.getElementById('title');
    const priceEl = document.getElementById('price');
    if (titleEl) titleEl.textContent = title;
    if (priceEl) priceEl.textContent = price;

    const payment = document.getElementById('payment');
    const cardBox = document.getElementById('cardBox');
    if (payment && cardBox) {
        payment.addEventListener('change', function () {
            cardBox.style.display = this.value === 'card' ? 'block' : 'none';
        });
    }

    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
            const booking = {
                id: Date.now(),
                type,
                idService: id,
                item,
                plan,
                name: document.getElementById('name').value,
                date: document.getElementById('date').value,
                payment: document.getElementById('payment').value,
                status: 'confirmed'
            };
            const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
            bookings.push(booking);
            localStorage.setItem('bookings', JSON.stringify(bookings));
            alert('تم تأكيد الحجز بنجاح ✅');
            location.href = 'dashboard.html';
        });
    }
}

function initDashboardPage() {
    const supabaseInstance = getSupabase();
    document.addEventListener('DOMContentLoaded', async function () {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'home.html';
            return;
        }

        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        if (userNameElement) userNameElement.textContent = currentUser.full_name;
        if (userRoleElement) userRoleElement.textContent = currentUser.role === 'customer' ? 'عميل المنصة' : 'مقدم خدمة';

        // Show customer-only sidebar link when appropriate
        const customerServicesLink = document.getElementById('customerServicesLink');
        if (customerServicesLink) customerServicesLink.style.display = currentUser.role === 'customer' ? 'block' : 'none';

        const nameElement = document.getElementById('name');
        const emailElement = document.getElementById('email');
        const phoneElement = document.getElementById('phone');
        if (nameElement) nameElement.textContent = currentUser.full_name;
        if (emailElement) emailElement.textContent = currentUser.email;
        if (phoneElement) phoneElement.textContent = currentUser.country_code + currentUser.phone;

        try {
            const bookings = await BookingsDB.getByCustomer(currentUser.id);
            loadBookingsFromDB(bookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    });

    function loadBookingsFromDB(bookings) {
        const bookingsContainer = document.querySelector('#bookings .cards-grid');
        if (!bookingsContainer) return;
        if (!Array.isArray(bookings) || bookings.length === 0) {
            bookingsContainer.innerHTML = `
                <div class="modern-card" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">لا توجد حجوزات حالياً</p>
                </div>`;
            return;
        }

        let bookingsHTML = '';
        bookings.forEach((booking) => {
            const statusClass = (booking.status === 'confirmed' || booking.status === 'accepted') ? 'status-confirmed' : booking.status === 'pending' ? 'status-pending' : booking.status === 'rejected' ? 'status-cancelled' : 'status-cancelled';
            const statusText = (booking.status === 'confirmed' || booking.status === 'accepted') ? 'مؤكد' : booking.status === 'pending' ? 'قيد الانتظار' : booking.status === 'rejected' ? 'مرفوض' : 'ملغي';
            bookingsHTML += `
                <div class="modern-card" data-booking-id="${booking.id}">
                    <h3 class="card-title">${booking.booking_name}</h3>
                    <p class="card-description">التاريخ: ${new Date(booking.booking_date).toLocaleDateString('ar-SA')}</p>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <div class="action-btns" style="margin-top: 1rem;">
                        <button class="action-btn btn-view" onclick="viewBooking('${booking.id}')"><i class="fas fa-eye"></i> عرض</button>
                        <button class="action-btn btn-edit" onclick="editBooking('${booking.id}')"><i class="fas fa-edit"></i> تعديل</button>
                        ${booking.status !== 'rejected' && booking.status !== 'cancelled' ? `<button class="action-btn btn-delete" onclick="cancelBooking('${booking.id}')"><i class="fas fa-trash"></i> إلغاء</button>` : ''}
                    </div>
                </div>`;
        });
        bookingsContainer.innerHTML = bookingsHTML;
    }
}

function initAdminPage() {
    let currentAdminUser = null;

    document.addEventListener('DOMContentLoaded', async function () {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!currentUser || currentUser.role !== 'admin') {
            window.location.href = 'home.html';
            return;
        }

        currentAdminUser = currentUser;
        await loadPendingServices();
        await loadAdminNotifications();
    });

    async function loadPendingServices() {
        const container = document.getElementById('pendingServicesList');
        if (!container) return;
        try {
            const services = await ServicesDB.getAll();
            const pendingServices = Array.isArray(services) ? services.filter(service => service.status === 'pending') : [];
            const pendingCount = document.getElementById('pendingServicesCount');
            if (pendingCount) pendingCount.textContent = pendingServices.length;
            const providerNames = {};
            for (const service of pendingServices) {
                if (service.provider_id && !providerNames[service.provider_id]) {
                    try {
                        const provider = await UsersDB.getById(service.provider_id);
                        providerNames[service.provider_id] = provider?.full_name || provider?.email || 'مقدم خدمة';
                    } catch (error) {
                        providerNames[service.provider_id] = 'مقدم خدمة';
                    }
                }
            }

            if (pendingServices.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>لا توجد خدمات بانتظار الموافقة</p></div>';
                return;
            }

            container.innerHTML = pendingServices.map(service => `
                <div class="modern-card admin-service-card">
                    <div class="service-item-header">
                        <h3 class="card-title" style="margin:0;">${service.service_type || 'خدمة'}</h3>
                        <span class="status-badge status-pending">قيد المراجعة</span>
                    </div>
                    <p class="card-description">${service.description || 'لا يوجد وصف'}</p>
                    <div class="service-item-meta">
                        <span><i class="fas fa-user"></i> مقدم الخدمة: ${providerNames[service.provider_id] || 'غير محدد'}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${service.location || 'غير محدد'}</span>
                    </div>
                    <div class="service-item-meta">
                        <span><i class="fas fa-money-bill-wave"></i> ${service.price || 0} ر.س</span>
                        <span><i class="fas fa-clock"></i> ${service.duration || 'غير محدد'}</span>
                    </div>
                    <div class="service-item-meta">
                        <span><i class="fas fa-calendar-alt"></i> أيام العمل: ${service.working_days || 'غير محدد'}</span>
                        <span><i class="fas fa-store"></i> الساعات: ${service.working_hours || 'غير محدد'}</span>
                    </div>
                    <div class="service-item-actions" style="margin-top: 1rem;">
                        <button class="service-action-btn edit" onclick="approveService('${service.id}')"><i class="fas fa-check"></i></button>
                        <button class="service-action-btn delete" onclick="rejectService('${service.id}')"><i class="fas fa-times"></i></button>
                    </div>
                </div>`).join('');
        } catch (error) {
            console.error('Error loading pending services:', error);
            container.innerHTML = '<div class="empty-state">تعذر تحميل الخدمات من قاعدة البيانات.</div>';
        }
    }

    async function loadAdminNotifications() {
        const container = document.getElementById('adminNotificationsList');
        if (!container) return;
        try {
            const adminUser = currentAdminUser;
            if (!adminUser || !adminUser.id) {
                container.innerHTML = '<div class="empty-state">يرجى تسجيل الدخول أولاً.</div>';
                return;
            }
            const notifications = await NotificationsDB.getByUser(adminUser.id);
            const unreadCount = Array.isArray(notifications) ? notifications.filter(item => item.status === 'unread').length : 0;
            const countElement = document.getElementById('adminNotificationsCount');
            if (countElement) countElement.textContent = unreadCount;
            if (!Array.isArray(notifications) || notifications.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>لا توجد إشعارات حالياً</p></div>';
                return;
            }
            container.innerHTML = notifications.slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).map(notification => `
                <div class="modern-card admin-service-card">
                    <div class="service-item-header">
                        <h3 class="card-title" style="margin:0;">${notification.title || 'إشعار'}</h3>
                        <span class="status-badge ${notification.status === 'unread' ? 'status-pending' : 'status-confirmed'}">${notification.status === 'unread' ? 'جديد' : 'مقروء'}</span>
                    </div>
                    <p class="card-description">${notification.message || ''}</p>
                    <div class="service-item-meta">
                        <span><i class="fas fa-clock"></i> ${new Date(notification.created_at || Date.now()).toLocaleString('ar-SA')}</span>
                    </div>
                </div>`).join('');
        } catch (error) {
            console.error('Error loading admin notifications:', error);
            container.innerHTML = '<div class="empty-state">تعذر تحميل الإشعارات.</div>';
        }
    }

    window.approveService = async function (serviceId) {
        if (!serviceId) return;
        if (!confirm('هل تريد قبول هذه الخدمة؟')) return;
        try {
            const updatePayload = { status: 'approved', reviewed_at: new Date().toISOString(), review_note: 'تمت الموافقة من الإدارة' };
            if (currentAdminUser?.id) {
                const { data: adminUserRows } = await getSupabase().from('users').select('id').eq('id', currentAdminUser.id).limit(1);
                if (Array.isArray(adminUserRows) && adminUserRows.length > 0) updatePayload.reviewed_by = currentAdminUser.id;
            }
            const service = await ServicesDB.update(serviceId, updatePayload);
            const provider = await UsersDB.getById(service.provider_id);
            if (provider?.id) {
                await NotificationsDB.add({ user_id: provider.id, type: 'service', title: 'تم قبول الخدمة', message: `تم قبول خدمة "${service.service_type}" بنجاح وسيتم عرضها للمستخدمين.`, status: 'unread' });
            }
            if (currentAdminUser?.id) {
                await NotificationsDB.add({ user_id: currentAdminUser.id, type: 'service', title: 'تم قبول الخدمة', message: `تم قبول خدمة "${service.service_type}" من قبل الإدارة.`, status: 'unread' });
            }
            await loadPendingServices();
            await loadAdminNotifications();
            alert('تم قبول الخدمة بنجاح');
        } catch (error) {
            console.error('Error approving service:', error);
            alert('تعذر قبول الخدمة');
        }
    };

    window.rejectService = async function (serviceId) {
        if (!serviceId) return;
        if (!confirm('هل تريد رفض هذه الخدمة؟')) return;
        try {
            const updatePayload = { status: 'rejected', reviewed_at: new Date().toISOString(), review_note: 'تم الرفض من الإدارة' };
            if (currentAdminUser?.id) {
                const { data: adminUserRows } = await getSupabase().from('users').select('id').eq('id', currentAdminUser.id).limit(1);
                if (Array.isArray(adminUserRows) && adminUserRows.length > 0) updatePayload.reviewed_by = currentAdminUser.id;
            }
            const service = await ServicesDB.update(serviceId, updatePayload);
            const provider = await UsersDB.getById(service.provider_id);
            if (provider?.id) {
                await NotificationsDB.add({ user_id: provider.id, type: 'service', title: 'تم رفض الخدمة', message: `تم رفض خدمة "${service.service_type}" من قبل الإدارة.`, status: 'unread' });
            }
            await loadPendingServices();
            await loadAdminNotifications();
            alert('تم رفض الخدمة بنجاح');
        } catch (error) {
            console.error('Error rejecting service:', error);
            alert('تعذر رفض الخدمة');
        }
    };
}

function initProviderPage() {
    const supabaseInstance = getSupabase();
    document.addEventListener('DOMContentLoaded', async function () {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        window.currentProviderUser = currentUser;

        if (currentUser) {
            const userNameElement = document.getElementById('userName');
            const userRoleElement = document.getElementById('userRole');
            if (userNameElement) userNameElement.textContent = currentUser.full_name;
            if (userRoleElement) userRoleElement.textContent = currentUser.role === 'customer' ? 'عميل المنصة' : 'مقدم خدمة';

            const nameElement = document.getElementById('name');
            const emailElement = document.getElementById('email');
            const phoneElement = document.getElementById('phone');
            if (nameElement) nameElement.textContent = currentUser.full_name;
            if (emailElement) emailElement.textContent = currentUser.email;
            if (phoneElement) phoneElement.textContent = currentUser.country_code + currentUser.phone;

            const serviceForm = document.getElementById('serviceForm');
            if (serviceForm && !serviceForm.__providerFallbackBound) {
                serviceForm.__providerFallbackBound = true;
            }

            try { await refreshProviderServices(); } catch (error) { console.error('Error loading services:', error); }
            try { await loadProviderNotifications(); } catch (error) { console.error('Error loading provider notifications:', error); }
            try { const offers = await OffersDB.getByProvider(currentUser.id); loadOffersFromDB(offers); } catch (error) { console.error('Error loading offers:', error); }
        } else {
            window.location.href = 'login.html';
        }
    });

    window.editingServiceId = null;
    window.editingServiceStatus = 'pending';

    window.openServiceForm = function () {
        const container = document.getElementById('serviceFormContainer');
        const button = document.getElementById('toggleServiceFormBtn');
        if (!container || !button) return;
        container.style.display = 'block';
        button.innerHTML = '<i class="fas fa-minus-circle"></i> إخفاء النموذج';
    };

    window.closeServiceForm = function () {
        const container = document.getElementById('serviceFormContainer');
        const button = document.getElementById('toggleServiceFormBtn');
        if (!container || !button) return;
        container.style.display = 'none';
        button.innerHTML = '<i class="fas fa-plus-circle"></i> إضافة خدمة';
    };

    window.toggleServiceForm = function () {
        const container = document.getElementById('serviceFormContainer');
        if (!container) return;
        if (container.style.display === 'block') window.closeServiceForm();
        else window.openServiceForm();
    };

    window.escapeAttribute = function (value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    window.resetServiceForm = function () {
        const form = document.getElementById('serviceForm');
        const message = document.getElementById('serviceFormMessage');
        window.editingServiceId = null;
        window.editingServiceStatus = 'pending';
        if (form) form.reset();
        if (message) {
            message.style.display = 'none';
            message.className = 'form-message';
        }
        window.closeServiceForm();
    };

    window.startEditService = function (serviceCard) {
        const serviceId = serviceCard?.dataset?.serviceId;
        if (!serviceId) return;
        window.editingServiceId = serviceId;
        window.editingServiceStatus = serviceCard?.dataset?.status || 'pending';
        document.getElementById('serviceTitle').value = serviceCard?.dataset?.serviceType || '';
        document.getElementById('serviceDescription').value = serviceCard?.dataset?.description || '';
        document.getElementById('serviceLocation').value = serviceCard?.dataset?.location || '';
        document.getElementById('servicePrice').value = serviceCard?.dataset?.price || '';
        document.getElementById('serviceDuration').value = serviceCard?.dataset?.duration || '';
        document.getElementById('workingDays').value = serviceCard?.dataset?.workingDays || '';
        document.getElementById('workingTime').value = serviceCard?.dataset?.workingHours || '';
        window.openServiceForm();
    };

    window.deleteService = async function (serviceId) {
        if (!serviceId) return;
        if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
        try {
            await ServicesDB.delete(serviceId);
            showServiceMessage('تم حذف الخدمة بنجاح.', 'success');
            await refreshProviderServices();
        } catch (error) {
            console.error('Error deleting service:', error);
            showServiceMessage('تعذر حذف الخدمة. يرجى المحاولة لاحقًا.', 'error');
        }
    };

    window.showServiceMessage = function (message, type = 'success') {
        const messageBox = document.getElementById('serviceFormMessage');
        if (!messageBox) return;
        messageBox.textContent = message;
        messageBox.className = `form-message ${type}`;
        messageBox.style.display = 'block';
    };

    async function getAdminUserRecord() {
        const { data: adminUsers, error: adminError } = await supabaseInstance.from('users').select('id, full_name, email').eq('role', 'admin').limit(1);
        if (!adminError && Array.isArray(adminUsers) && adminUsers.length > 0) return adminUsers[0];
        return null;
    }

    async function createServiceApprovalNotifications(providerUser, serviceRecord) {
        const adminUser = await getAdminUserRecord();
        const providerName = providerUser?.full_name || providerUser?.email || 'مقدم خدمة';
        const serviceTitle = serviceRecord?.service_type || 'خدمة جديدة';
        const payloads = [];
        if (providerUser?.id) payloads.push({ user_id: providerUser.id, type: 'service', title: 'تم إرسال الخدمة للمراجعة', message: `تم إرسال خدمة "${serviceTitle}" للمراجعة من الإدارة.`, status: 'unread' });
        if (adminUser?.id) payloads.push({ user_id: adminUser.id, type: 'service', title: 'طلب خدمة جديد', message: `مقدم الخدمة ${providerName} قدم خدمة جديدة: ${serviceTitle}. يرجى مراجعتها والرد عليها.`, status: 'unread' });
        for (const payload of payloads) {
            try { await NotificationsDB.add(payload); } catch (notificationError) { console.warn('Notification insert skipped:', notificationError?.message || notificationError); }
        }
    }

    window.toggleUserSelect = function () {
        const sendType = document.getElementById('notificationSendType')?.value;
        const userSelectContainer = document.getElementById('userSelectContainer');
        const userSelect = document.getElementById('userSelect');
        if (!userSelectContainer || !userSelect) return;

        if (sendType === 'specific') {
            userSelectContainer.style.display = 'block';
            userSelect.required = true;
        } else {
            userSelectContainer.style.display = 'none';
            userSelect.required = false;
            userSelect.value = '';
        }
    };

    const sendNotificationForm = document.getElementById('sendNotificationForm');
    if (sendNotificationForm) {
        sendNotificationForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const sendType = document.getElementById('notificationSendType')?.value;
            const userId = document.getElementById('userSelect')?.value;
            const title = document.getElementById('notificationTitle')?.value?.trim();
            const message = document.getElementById('notificationMessage')?.value?.trim();

            if (!title || !message) {
                showAnimatedAlert('يرجى تعبئة عنوان ونص الإشعار', 'error');
                return;
            }

            if (sendType === 'specific' && !userId) {
                showAnimatedAlert('يرجى اختيار المستخدم', 'error');
                return;
            }

            const sentNotifications = JSON.parse(localStorage.getItem('sentNotifications') || '[]');
            sentNotifications.push({
                id: Date.now(),
                sendType,
                userId: sendType === 'specific' ? userId : null,
                userName: sendType === 'specific' ? window.getUserName?.(userId) || 'مستخدم' : 'جميع المستخدمين',
                title,
                message,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
            });
            localStorage.setItem('sentNotifications', JSON.stringify(sentNotifications));
            showAnimatedAlert('تم إرسال الإشعار بنجاح', 'success');
            sendNotificationForm.reset();
            window.toggleUserSelect();
        });
    }

    window.getUserName = function (userId) {
        const users = {
            '1': 'سارة أحمد',
            '2': 'أحمد محمد',
            '3': 'فاطمة علي',
            '4': 'خالد عمر'
        };
        return users[userId] || 'مستخدم غير معروف';
    };

    window.currentProviderNotificationFilter = 'all';

    window.loadProviderNotifications = async function () {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        const provider = window.currentProviderUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!provider || !provider.id) {
            container.innerHTML = '<div class="empty-state">يرجى تسجيل الدخول أولاً.</div>';
            return;
        }
        const notifications = await NotificationsDB.getByUser(provider.id);
        const filtered = window.currentProviderNotificationFilter === 'all' ? notifications : notifications.filter(item => item.status === window.currentProviderNotificationFilter);
        if (!Array.isArray(filtered) || filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>لا توجد إشعارات حالياً</p></div>';
            return;
        }
        container.innerHTML = filtered.map(notification => `
            <div class="notification-card ${notification.status === 'unread' ? 'unread' : ''}" data-notification-id="${notification.id}">
                <div class="notification-header">
                    <div class="notification-icon service"><i class="fas fa-concierge-bell"></i></div>
                    <div class="notification-info">
                        <h4 class="notification-title">${notification.title || 'إشعار'}</h4>
                        <span class="notification-time">${new Date(notification.created_at || Date.now()).toLocaleString('ar-SA')}</span>
                    </div>
                </div>
                <p class="notification-message">${notification.message || ''}</p>
                <div class="notification-actions" style="display:flex; gap:0.5rem; margin-top:0.75rem; justify-content:flex-end; flex-wrap:wrap;">
                    ${notification.status === 'unread' ? `<button type="button" class="notification-btn approve" onclick="markProviderNotificationAsRead('${notification.id}')"><i class="fas fa-check"></i> مقروءة</button>` : ''}
                    <button type="button" class="notification-btn reject" onclick="deleteProviderNotification('${notification.id}')"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>`).join('');
    };

    window.markProviderNotificationAsRead = async function (notificationId) {
        if (!notificationId) return;
        try {
            await NotificationsDB.markAsRead(notificationId);
            showAnimatedAlert('تمت قراءة الإشعار بنجاح', 'success');
            await window.loadProviderNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            showAnimatedAlert('تعذر تحديث حالة الإشعار', 'error');
        }
    };

    window.deleteProviderNotification = async function (notificationId) {
        if (!notificationId) return;
        if (!confirm('هل تريد حذف هذا الإشعار؟')) return;
        try {
            const { error } = await supabaseInstance.from('notifications').delete().eq('id', notificationId);
            if (error) throw error;
            showAnimatedAlert('تم حذف الإشعار بنجاح', 'success');
            await window.loadProviderNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
            showAnimatedAlert('تعذر حذف الإشعار', 'error');
        }
    };

    window.filterNotifications = function (filter = 'all') {
        window.currentProviderNotificationFilter = filter;
        const buttons = document.querySelectorAll('.notification-filter-btn');
        buttons.forEach(btn => {
            const isFilterButton = btn.getAttribute('data-filter');
            btn.classList.toggle('active', isFilterButton === filter);
        });
        window.loadProviderNotifications();
    };

    window.markAllProviderNotificationsAsRead = async function () {
        const provider = window.currentProviderUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!provider || !provider.id) {
            showAnimatedAlert('يرجى تسجيل الدخول أولاً', 'error');
            return;
        }
        try {
            const { data: unreadNotifications, error: fetchError } = await supabaseInstance.from('notifications').select('id').eq('user_id', provider.id).eq('status', 'unread');
            if (fetchError) throw fetchError;
            if (!Array.isArray(unreadNotifications) || unreadNotifications.length === 0) {
                showAnimatedAlert('لا توجد إشعارات غير مقروءة', 'success');
                return;
            }
            const notificationIds = unreadNotifications.map(item => item.id);
            const { error: updateError } = await supabaseInstance.from('notifications').update({ status: 'read' }).in('id', notificationIds);
            if (updateError) throw updateError;
            window.currentProviderNotificationFilter = 'all';
            document.querySelectorAll('.notification-filter-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all'));
            showAnimatedAlert('تم تعيين جميع الإشعارات كمقروءة', 'success');
            await window.loadProviderNotifications();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            showAnimatedAlert('تعذر تحديث جميع الإشعارات', 'error');
        }
    };

    window.refreshProviderServices = async function () {
        const servicesList = document.getElementById('servicesList');
        if (!servicesList) return;
        const provider = window.currentProviderUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!provider || !provider.id) {
            servicesList.innerHTML = '<div class="empty-state">يرجى تسجيل الدخول أولاً.</div>';
            return;
        }
        servicesList.innerHTML = '<div class="empty-state">جاري تحميل خدماتك...</div>';
        try {
            const services = await ServicesDB.getByProvider(provider.id);
            const safeServices = Array.isArray(services) ? services : [];
            const servicesCount = document.getElementById('servicesCount');
            if (servicesCount) servicesCount.textContent = safeServices.length;
            if (safeServices.length === 0) {
                servicesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-concierge-bell"></i>
                        <p>لا توجد خدمات حالياً</p>
                        <span>أضف أول خدمة جديدة من الزر أعلاه.</span>
                    </div>`;
                return;
            }
            servicesList.innerHTML = safeServices.map(service => {
                const statusClass = service.status === 'approved' ? 'status-confirmed' : service.status === 'pending' ? 'status-pending' : 'status-cancelled';
                const statusText = service.status === 'approved' ? 'موافق عليه' : service.status === 'pending' ? 'قيد المراجعة' : 'مرفوض';
                return `
                    <div class="modern-card service-item-card"
                        data-service-id="${service.id}"
                        data-service-type="${window.escapeAttribute(service.service_type || '')}"
                        data-description="${window.escapeAttribute(service.description || '')}"
                        data-location="${window.escapeAttribute(service.location || '')}"
                        data-price="${window.escapeAttribute(service.price || '')}"
                        data-duration="${window.escapeAttribute(service.duration || '')}"
                        data-working-days="${window.escapeAttribute(service.working_days || '')}"
                        data-working-hours="${window.escapeAttribute(service.working_hours || '')}"
                        data-status="${window.escapeAttribute(service.status || 'pending')}">
                        <div class="service-item-header">
                            <h3 class="card-title" style="margin:0;">${service.service_type || 'خدمة'}</h3>
                            <div class="service-item-actions">
                                <button type="button" class="service-action-btn edit" onclick="startEditService(this.closest('.service-item-card'))" title="تعديل الخدمة"><i class="fas fa-edit"></i></button>
                                <button type="button" class="service-action-btn delete" onclick="deleteService('${service.id}')" title="حذف الخدمة"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <p class="card-description">${service.description || 'لا يوجد وصف'}</p>
                        <div class="service-item-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${service.location || 'غير محدد'}</span>
                            <span><i class="fas fa-money-bill-wave"></i> ${service.price || 0} ر.س</span>
                        </div>
                        <div class="service-item-meta">
                            <span><i class="fas fa-clock"></i> ${service.duration || 'غير محدد'}</span>
                            <span><i class="fas fa-calendar-alt"></i> ${service.working_days || 'غير محدد'}</span>
                        </div>
                    </div>`;
            }).join('');
        } catch (error) {
            console.error('Error loading services:', error);
            servicesList.innerHTML = '<div class="empty-state">تعذر تحميل خدماتك من قاعدة البيانات.</div>';
        }
    };

    window.loadOffersFromDB = function (offers) {
        const offersContainer = document.querySelector('#offers .cards-grid');
        if (!offersContainer) return;
        if (!Array.isArray(offers) || offers.length === 0) {
            offersContainer.innerHTML = `
                <div class="modern-card" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-tags" style="font-size: 3rem; color: var(--text-secondary); opacity: 0.5; margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">لا توجد عروض حالياً</p>
                </div>`;
            return;
        }
        let offersHTML = '';
        offers.forEach(offer => {
            const statusClass = offer.status === 'active' ? 'status-confirmed' : 'status-cancelled';
            const statusText = offer.status === 'active' ? 'نشط' : 'منتهي';
            offersHTML += `
                <div class="modern-card" data-offer-id="${offer.id}">
                    <h3 class="card-title">${offer.title}</h3>
                    <p class="card-description">${offer.description}</p>
                    <p class="card-description">الخصم: ${offer.discount_percentage}%</p>
                    <p class="card-description">من: ${new Date(offer.start_date).toLocaleDateString('ar-SA')}</p>
                    <p class="card-description">إلى: ${new Date(offer.end_date).toLocaleDateString('ar-SA')}</p>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>`;
        });
        offersContainer.innerHTML = offersHTML;
    };
}

function initHotelDetailsPage() {
    const hotels = {
      1: {
        name: 'فندق ويندهام جاردن',
        location: 'الدمام - حي العدامة',
        shortDescription: 'فندق فاخر يوفر غرفًا مريحة وأجنحة عائلية.',
        price: '350 ر.س / الليلة',
        description: 'يقدم الفندق تجربة إقامة متكاملة تجمع بين الراحة والفخامة.',
        image: 'Images/Hotels/windham/hotel.webp',
        gallery: ['Images/Hotels/windham/img1.jpg','Images/Hotels/windham/imgbigroom.webp','Images/Hotels/windham/imgroom1.webp','Images/Hotels/windham/imgroom2.jpg'],
        facilities: ['📶 واي فاي مجاني','🏊 مسبح','🍽️ مطعم','🚗 موقف سيارات','🧺 خدمة غسيل','🛎️ خدمة غرف','🏋️ صالة رياضية','❄️ تكييف'],
        rooms: [{id:1,name:'غرفة مفردة',price:'220 ر.س / الليلة',description:'غرفة لشخص واحد مع جميع الخدمات الأساسية.',image:'Images/Hotels/windham/imgroom1.webp',features:['👤 شخص واحد','🛏️ سرير مفرد','📶 واي فاي','❄️ تكييف']},{id:2,name:'غرفة مزدوجة',price:'350 ر.س / الليلة',description:'غرفة مريحة لشخصين.',image:'Images/Hotels/windham/imgroom2.jpg',features:['👥 شخصان','🛏️ سرير مزدوج','🍳 إفطار','📺 تلفاز']},{id:3,name:'جناح عائلي',price:'600 ر.س / الليلة',description:'جناح واسع مناسب للعائلات.',image:'Images/Hotels/windham/imgbigroom.webp',features:['👨‍👩‍👧‍👦 عائلة','🛋️ صالة','🚿 حمام فاخر']}]},
      2: {name:'فندق شيراتون',location:'الدمام - المزروعية',shortDescription:'فندق أنيق قريب من البحر.',price:'420 ر.س / الليلة',description:'فندق حديث بمرافق متكاملة وموقع مميز.',image:'Images/Hotels/sheraton/sheraton.jpg',gallery:['Images/Hotels/sheraton/img1.webp','Images/Hotels/sheraton/img4.webp','Images/Hotels/sheraton/img3.webp','Images/Hotels/sheraton/img2.webp'],facilities:['📶 واي فاي مجاني','🏊 مسبح','🍽️ مطعم','🚗 موقف سيارات','🧺 قاعات أفراح','🛎️ خدمة غرف','🏋️ صالة رياضية','❄️ غرف اجتماعات'],rooms:[{id:1,name:'غرفة لشخص واحد',price:'250 ر.س / الليلة',description:'غرفة بسيطة ومريحة.',image:'Images/Hotels/sheraton/img1.webp',features:['👤 شخص','📶 واي فاي']},{id:2,name:'ديلوكس',price:'430 ر.س / الليلة',description:'غرفة فاخرة.',image:'Images/Hotels/sheraton/imgroom2.jpg',features:['👥 شخصان','🛏️ سرير كبير']},{id:3,name:'جناح',price:'700 ر.س / الليلة',description:'جناح واسع.',image:'Images/Hotels/sheraton/imgbigroom.webp',features:['👨‍👩‍👧‍👦 عائلة','🛋️ صالة']}]}
    };
    const params = new URLSearchParams(window.location.search);
    const hotelId = params.get('id');
    const hotel = hotels[hotelId];
    const serviceNameEl = document.getElementById('serviceName');
    if (!serviceNameEl) return;
    if (!hotel) {
        serviceNameEl.textContent = 'الفندق غير موجود';
        return;
    }
    document.getElementById('serviceName').textContent = hotel.name;
    document.getElementById('serviceLocation').textContent = hotel.location;
    document.getElementById('serviceShortDescription').textContent = hotel.shortDescription;
    document.getElementById('serviceBasePrice').textContent = hotel.price;
    document.getElementById('serviceDescription').textContent = hotel.description;
    document.getElementById('mainserviceImage').src = hotel.image;
    const galleryContainer = document.getElementById('serviceImage');
    galleryContainer.innerHTML = '';
    hotel.gallery.forEach(img => { galleryContainer.innerHTML += `<img src="${img}" alt="صورة للفندق">`; });
    const thumbnails = galleryContainer.querySelectorAll('img');
    thumbnails.forEach(img => { img.addEventListener('click', function () { document.getElementById('mainserviceImage').src = this.src; }); });
    const facilitiesContainer = document.getElementById('hotelsFacilities');
    facilitiesContainer.innerHTML = '';
    hotel.facilities.forEach(item => { facilitiesContainer.innerHTML += `<div class="facility-item">${item}</div>`; });
    const container = document.getElementById('roomsContainer');
    container.innerHTML = '';
    hotel.rooms.forEach(room => { container.innerHTML += `<div class="room-card"><img src="${room.image}"><div class="room-content"><div class="room-header"><h3>${room.name}</h3><span class="room-price">${room.price}</span></div><p>${room.description}</p><div class="room-features">${room.features.map(f => `<span>${f}</span>`).join('')}</div><div class="room-actions"><button class="select-service-btn" onclick="goBooking('hotel', '${hotelId}', '${room.name}', '${room.price}')">احجز</button></div></div></div>`; });
}

function initGymDetailsPage() {
    const gyms = {1:{name:'in2fitness',location:'الدمام  - حي الشاطئ',gymType:'نادي رجالي - 24 ساعة',shortDescription:'نادي رياضي متكامل يوفر أجهزة حديثة، منطقة كارديو، أوزان حرة، حصص جماعية، ومدربين لمتابعة الأعضاء.',price:'ابتداءً من 99 ر.س / الشهر',description:'يوفر نادي GymNation Othaim Mall تجربة رياضية شاملة تناسب مختلف المستويات، مع مساحات تدريب واسعة، أجهزة كارديو وقوة، أوزان حرة، وحصص جماعية متنوعة. النادي مناسب لمن يبحث عن اشتراك مرن وأجواء تدريب حديثة مع إمكانية الاستفادة من العروض المتاحة حسب الباقة.',image:'Images/Gym/in2fetness/img1.webp',gallery:['Images/Gym/in2fetness/img2.webp','Images/Gym/in2fetness/img3.webp','Images/Gym/in2fetness/img5.webp','Images/Gym/in2fetness/img6.webp'],facilities:['أجهزة كارديو حديثة','منطقة أوزان حرة ومقاومة','حصص جماعية متنوعة','مدربون للمساعدة والمتابعة','غرف تبديل وخزائن','مواقف سيارات'],plans:[{name:'اشتراك شهري',price:'99 ر.س / الشهر',description:'اشتراك أساسي مناسب للتدريب اليومي والاستفادة من مرافق النادي.'},{name:'اشتراك 3 أشهر',price:'279 ر.س',description:'خيار اقتصادي أكثر لمن يرغب بالالتزام لفترة أطول.'},{name:'اشتراك سنوي',price:'حسب العرض المتاح',description:'أفضل قيمة عند توفر العروض السنوية أو الموسمية.'}]},2:{name:'Gymention',location:'الدمام - العثيم مول',gymType:'نادي رياضي حديث',shortDescription:'نادي رياضي يقدم مساحات تدريب حديثة، أجهزة كارديو وقوة، مناطق تدريب وظيفي، واستوديوهات للحصص الجماعية.',price:'الاشتراك يختلف حسب الباقة والفرع',description:'يقدم iN2Fitness بيئة تدريب متكاملة تناسب المبتدئين والمحترفين، مع أجهزة حديثة، مناطق تدريب متعددة، ومساحات مريحة للتمرين. تختلف أسعار الاشتراك حسب نوع الباقة ومدتها والفرع، لذلك يُنصح بالتحقق من السعر النهائي عند الحجز أو عبر التطبيق.',image:'Images/Gym/gymnation/img1.webp',gallery:['Images/Gym/gymnation/img2.webp','Images/Gym/gymnation/img3.webp','Images/Gym/gymnation/img4.webp','Images/Gym/gymnation/img6.webp'],facilities:['أجهزة حديثة للقوة والكارديو','مناطق تدريب وظيفي','استوديوهات حصص جماعية','غرف تبديل وخزائن','باقات مرنة حسب المدة','مواقف سيارات'],plans:[{name:'اشتراك شهري',price:'حسب الفرع',description:'يختلف السعر حسب نوع الاشتراك والعروض الحالية.'},{name:'اشتراك ربع سنوي',price:'حسب الفرع',description:'خيار مناسب لمن يريد الاستمرار لفترة متوسطة.'},{name:'اشتراك سنوي',price:'حسب الفرع والعرض',description:'عادةً يكون أوفر من الاشتراكات القصيرة عند توفر عروض.'}]}};
    const params = new URLSearchParams(window.location.search); const gymId = params.get('id'); const gym = gyms[gymId];
    const serviceNameEl = document.getElementById('serviceName');
    if (!serviceNameEl) return;
    if (!gym) { document.getElementById('serviceName').textContent = 'النادي غير موجود'; return; }
    document.getElementById('serviceName').textContent = gym.name;
    document.getElementById('serviceLocation').textContent = gym.location;
    document.getElementById('gymType').textContent = gym.gymType;
    document.getElementById('serviceShortDescription').textContent = gym.shortDescription;
    document.getElementById('serviceBasePrice').textContent = gym.price;
    document.getElementById('serviceDescription').textContent = gym.description;
    document.getElementById('mainserviceImage').src = gym.image;
    const galleryContainer = document.getElementById('serviceImage');
    galleryContainer.innerHTML = '';
    gym.gallery.forEach(img => { galleryContainer.innerHTML += `<img src="${img}" alt="صورة للنادي"> `; });
    const thumbnails = galleryContainer.querySelectorAll('img');
    thumbnails.forEach(img => { img.addEventListener('click', function () { document.getElementById('mainserviceImage').src = this.src; }); });
    const facilitiesContainer = document.getElementById('gymFacilities');
    facilitiesContainer.innerHTML = '';
    gym.facilities.forEach(item => { facilitiesContainer.innerHTML += `<div class="facility-item">${item}</div>`; });
    const plansContainer = document.getElementById('plansContainer');
    plansContainer.innerHTML = '';
    gym.plans.forEach(plan => { plansContainer.innerHTML += `<div class="room-card"><div class="room-info"><h3>${plan.name}</h3><p>${plan.description}</p><div class="room-meta"><span class="price">${plan.price}</span><button class="book-btn" onclick="goBooking('gym', '${gymId}', '${plan.name}', '${plan.price}')">اشترك الآن</button></div></div></div>`; });
}

function initRestaurantDetailsPage() {
    const resturants = {1:{name:'مطعم فتة وصنوبر',location:'الدمام - حي السلام',type:'مطعم لبناني',shortDescription:'مطعم لبناني مميز يقدم الفتة والمشاوي والمقبلات بأجواء أنيقة.',price:'تبدأ الأسعار من 25 ر.س',description:'يوفر مطعم فتة وصنوبر تجربة لبنانية أصيلة مع تشكيلة واسعة من أطباق الفتة والمشاوي والمقبلات، ضمن أجواء هادئة وخدمة مناسبة للعائلات والأفراد.',image:'Images/Resturants/Fatee/mainimage.jpg',gallery:['Images/Resturants/Fatee/f1.webp','Images/Resturants/Fatee/img2.webp','Images/Resturants/Fatee/img3.webp','Images/Resturants/Fatee/img4.webp'],facilities:['📶 واي فاي مجاني','🪑 جلسات داخلية','🌳 جلسات خارجية','👨‍👩‍👧 مناسب للعائلات','🚗 موقف سيارات','🛵 خدمة توصيل','🍽️ قسم أفراد وعائلات','❄️ تكييف'],menu:[{id:1,name:'فتة دجاج',price:'25 ر.س',description:'طبق فتة شهي محضر بخبز محمص وصلصة لبنانية مميزة مع قطع الدجاج.',image:'Images/Resturants/Fatee/f1.webp',features:['🍗 دجاج','🥣 صوص خاص','🔥 يقدم ساخن']},{id:2,name:'مشاوي مشكلة',price:'55 ر.س',description:'تشكيلة من الكباب والشيش طاووق واللحم المشوي مع المقبلات.',image:'Images/Resturants/Fatee/img2.webp',features:['🥩 لحم','🍢 مشاوي','🥗 مقبلات']},{id:3,name:'حمص باللحم',price:'22 ر.س',description:'طبق حمص كريمي مع قطع اللحم والصنوبر وزيت الزيتون.',image:'Images/Resturants/Fatee/img3.webp',features:['🥣 حمص','🥩 لحم','🌰 صنوبر']}]},2:{name:'مطعم شجرة الدر',location:'الدمام - السلام',type:'مطعم شرقي',shortDescription:'مطعم يقدم أطباق شرقية ومشاوي متنوعة في أجواء عائلية.',price:'تبدأ الأسعار من 30 ر.س',description:'يقدم مطعم شجرة الدر تجربة طعام مميزة تشمل الأطباق الشرقية والمشاوي والمقبلات الطازجة، مع جلسات مريحة وخدمة مناسبة للعائلات.',image:'Images/Resturants/ShajaretAldour/mainimage.webp',gallery:['Images/Resturants/ShajaretAldour/img1.webp','Images/Resturants/ShajaretAldour/img2.jpg','Images/Resturants/ShajaretAldour/img3.webp','Images/Resturants/ShajaretAldour/img4.webp'],facilities:['📶 واي فاي مجاني','👨‍👩‍👧 جلسات عائلية','🚗 موقف سيارات','🛵 توصيل','❄️ تكييف'],menu:[{id:1,name:'كباب مشوي',price:'38 ر.س',description:'كباب مشوي على الفحم يقدم مع خبز ومقبلات.',image:'Images/Resturants/ShajaretAldour/img5.webp',features:['🥩 لحم','🔥 مشوي','🥗 مقبلات']},{id:2,name:'شيش طاووق',price:'34 ر.س',description:'قطع دجاج متبلة ومشوية تقدم مع بطاطس وصلصة.',image:'Images/Resturants/ShajaretAldour/img6.webp',features:['🍗 دجاج','🍟 بطاطس','🥫 صوص']},{id:3,name:'بيستاشو',price:'34 ر.س',description:'جبن بيض سكر',image:'Images/Resturants/ShajaretAldour/img8.webp',features:['🍗 دجاج','🍟 بطاطس','🥫 صوص']} ]}};
    const params = new URLSearchParams(window.location.search); const resturantId = params.get('id'); const resturant = resturants[resturantId];
    const serviceNameEl = document.getElementById('serviceName');
    if (!serviceNameEl) return;
    if (!resturant) { document.getElementById('serviceName').textContent = 'المطعم غير موجود'; return; }
    document.getElementById('serviceName').textContent = resturant.name;
    document.getElementById('serviceLocation').textContent = resturant.location;
    document.getElementById('restaurantType').textContent = resturant.type;
    document.getElementById('serviceShortDescription').textContent = resturant.shortDescription;
    document.getElementById('serviceBasePrice').textContent = resturant.price;
    document.getElementById('serviceDescription').textContent = resturant.description;
    document.getElementById('mainserviceImage').src = resturant.image;
    const galleryContainer = document.getElementById('serviceImage');
    galleryContainer.innerHTML = '';
    resturant.gallery.forEach(img => { galleryContainer.innerHTML += `<img src="${img}" alt="صورة للمطعم">`; });
    const thumbnails = galleryContainer.querySelectorAll('img');
    thumbnails.forEach(img => { img.addEventListener('click', function () { document.getElementById('mainserviceImage').src = this.src; }); });
    const facilitiesContainer = document.getElementById('restaurantFacilities');
    facilitiesContainer.innerHTML = '';
    resturant.facilities.forEach(item => { facilitiesContainer.innerHTML += `<div class="facility-item">${item}</div>`; });
    const menuContainer = document.getElementById('menuContainer');
    menuContainer.innerHTML = '';
    resturant.menu.forEach(item => { menuContainer.innerHTML += `<div class="room-card"><img src="${item.image}" alt="${item.name}"><div class="room-content"><div class="room-header"><h3>${item.name}</h3><span class="room-price">${item.price}</span></div><p>${item.description}</p><div class="room-features">${item.features.map(feature => `<span>${feature}</span>`).join('')}</div><div class="room-actions"><button class="select-service-btn" onclick="goBooking('restaurant', '${resturantId}', '${item.name}', '${item.price}')">اطلب الآن</button></div></div></div>`; });
}

window.goBooking = function (type, id, item = '', plan = '') {
    const currentUser = getCurrentUser ? getCurrentUser() : JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        alert('يجب تسجيل الدخول لإتمام الحجز. سيتم توجيهك إلى الصفحة الرئيسية.');
        window.location.href = 'home.html';
        return;
    }

    const url = `booking.html?type=${type}&id=${id}&item=${encodeURIComponent(item)}&plan=${encodeURIComponent(plan)}`;
    window.location.href = url;
};

if (document.getElementById('servicesGrid')) initHomePage();
if (document.getElementById('offersGrid')) initHomeOffers();
if (document.getElementById('registerForm') || document.getElementById('loginForm')) initLoginPage();
if (document.getElementById('contactForm')) initContactPage();
if (document.getElementById('bookingForm') || document.getElementById('confirmBookingBtn')) initBookingPage();
if (document.getElementById('bookings') || document.getElementById('editBookingForm')) initDashboardPage();
if (document.getElementById('pendingServicesList') || document.getElementById('adminNotificationsList')) initAdminPage();
if (document.getElementById('notificationsList')) initNotificationsPage();
if (document.getElementById('serviceForm') || document.getElementById('notificationsContainer')) initProviderPage();
if (document.getElementById('serviceName') && document.getElementById('mainserviceImage')) {
    if (document.getElementById('roomsContainer')) initHotelDetailsPage();
    if (document.getElementById('plansContainer')) initGymDetailsPage();
    if (document.getElementById('menuContainer')) initRestaurantDetailsPage();
}
