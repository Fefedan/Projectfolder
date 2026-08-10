/* ملف تسجيل الدخول وإنشاء الحساب يحتوي على
    - تهيئة الاتصال مع Supabase
    - التحقق من صحة المدخلات
    - إنشاء حساب جديد
    - تسجيل الدخول
    - التحويل حسب نوع المستخدم*/
    //////////////////////////////////////////////////////////////////////////////////////////
    // Initialize Supabase تهيئة الاتصال بقاعدة بيانات Supabase
    let supabaseInstance = null;
    try {
      supabaseInstance = getSupabase();
      console.log('Supabase initialized:', supabaseInstance);
    } catch (error) {
      console.error('Error initializing Supabase:', error);
    }
    //////////////////////////////////////////////////////////////////////////////////////////
    // Toggle between login and register forms 
    //التبديل بين تسجيل الدخول وإنشاء الحساب
    const container = document.querySelector('.container');
    const registerBtn = document.querySelector('.register-btn');
    const loginBtn = document.querySelector('.login-btn');

    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        container.classList.add('active');
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        container.classList.remove('active');
      });
    }
    //////////////////////////////////////////////////////////////////////////////////////////
    //Form Validation
    // التحقق من صحة بيانات النماذج
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const countryCodeSelect = document.getElementById('countryCode');

    // Validate phone number - only digits, exactly 10
    /* التحقق من صحة رقم الهاتف
     يسمح بإدخال الأرقام فقط وبحد أقصى 10 أرقام*/
    phoneNumberInput.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (this.value.length > 10) {
        this.value = this.value.slice(0, 10);
      }
    });
    
    // Validate password length
    //التحقق من الحد الأدنى لطول كلمة المرور
    passwordInput.addEventListener('input', function() {
      if (this.value.length < 8) {
        this.style.borderColor = '#ef4444';
      } else {
        this.style.borderColor = '#22c55e';
      }
    });
    
    // Validate confirm password match
    // التحقق من تطابق كلمة المرور مع التأكيد
    confirmPasswordInput.addEventListener('input', function() {
      if (this.value !== passwordInput.value) {
        this.style.borderColor = '#ef4444';
      } else {
        this.style.borderColor = '#22c55e';
      }
    });
    //////////////////////////////////////////////////////////////////////////////////////////
    //Register Form Submission 
    //معالجة عملية إنشاء حساب جديد
    if (registerForm) {
      registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('Register form submitted');
        
        let isValid = true;
        let errorMessage = '';
        
        // Validate country code
        //التحقق من اختيار رمز الدولة
        if (!countryCodeSelect.value) {
          errorMessage = 'يرجى اختيار رمز الدولة';
          isValid = false;
        }

        // Validate phone number
        // التحقق من صحة رقم الهاتف
        if (isValid && phoneNumberInput.value.length !== 10) {
          errorMessage = 'رقم الهاتف يجب أن يكون 10 أرقام';
          isValid = false;
        }
        
        // Validate password length
        // التحقق من طول كلمة المرور 
        if (isValid && passwordInput.value.length < 8) {
          errorMessage = 'كلمة المرور يجب أن تكون 8 محارف على الأقل';
          isValid = false;
        }

        // Validate password match
        // التحقق من تطابق كلمة المرور
        if (isValid && passwordInput.value !== confirmPasswordInput.value) {
          errorMessage = 'كلمة المرور وتأكيد كلمة المرور غير متطابقين';
          isValid = false;
        }

        // إيقاف العملية في حال وجود خطأ
        if (!isValid) {
          alert(errorMessage);
          return;
        }

        // Check if Supabase is initialized
        //التحقق من نجاح تهيئة Supabase 
        if (!supabaseInstance) {
          alert('خطأ: لم يتم تهيئة قاعدة البيانات. يرجى التأكد من تحميل مكتبة Supabase.');
          console.error('Supabase not initialized');
          return;
        }

        // Check if UsersDB is available
        // التحقق من توفر كائن UsersDB 
        if (typeof UsersDB === 'undefined') {
          alert('خطأ: لم يتم العثور على دوال قاعدة البيانات. يرجى التأكد من تحميل ملف supabase-config.js');
          console.error('UsersDB not defined');
          return;
        }

        // Register with Supabase
        // إرسال بيانات المستخدم إلى قاعدة البيانات 
        try {
          console.log('Attempting to register user...');
          
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

          console.log('User data:', userData);

          const user = await UsersDB.register(userData);
          
          console.log('Registration successful:', user);
          
          // Store user in localStorage
          // حفظ بيانات المستخدم محلياً 
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          alert('تم إنشاء الحساب بنجاح!');
          registerForm.reset();
          
          // Redirect based on role
          // تحويل المستخدم حسب نوع الحساب 
          if (user.role === 'customer') {
            window.location.href = 'dashboard.html';
          } else if (user.role === 'provider') {
            window.location.href = 'provider.html';
          } else {
            window.location.href = 'home.html';
          }
        } catch (error) {
        // معالجة أخطاء إنشاء الحساب 
          alert('حدث خطأ أثناء إنشاء الحساب: ' + error.message);
          console.error('Registration error:', error);
        }
      });
    }
    //////////////////////////////////////////////////////////////////////////////////////////
    //Login Form Submission 
    // معالجة عملية تسجيل الدخول
    if (loginForm) {
      loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
        /* التحقق من بيانات تسجيل الدخول */
          const user = await UsersDB.login(email, password);
          
          // Store user in localStorage
          // حفظ بيانات المستخدم محلياً 
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          alert('تم تسجيل الدخول بنجاح!');
          
          // Redirect based on role
          // تحويل المستخدم حسب نوع الحساب 
          if (user.role === 'customer') {
            window.location.href = 'dashboard.html';
          } else if (user.role === 'provider') {
            window.location.href = 'provider.html';
          } else if (user.role === 'admin') {
            window.location.href = 'adminpage.html';
          } else {
            window.location.href = 'home.html';
          }
        } catch (error) {
        // معالجة أخطاء تسجيل الدخول
          alert('خطأ في البريد الإلكتروني أو كلمة المرور');
          console.error('Login error:', error);
        }
      });
    }
