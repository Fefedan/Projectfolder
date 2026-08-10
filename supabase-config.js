// ============================================
// Supabase Configuration for Hajzi Platform
// ============================================

const SUPABASE_CONFIG = {
    // Your Supabase Project Details
    projectUrl: 'https://blnzjjdlziykznwepgtn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsbnpqamRseml5a3pud2VwZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDYwMzMsImV4cCI6MjA5ODM4MjAzM30.Sdwp0WVWw2c-KLFIlX0IeYmLzUHVk66M0AVJhvtc47k',
    
    // Table Names
    tables: {
        users: 'users',
        services: 'services',
        bookings: 'bookings',
        notifications: 'notifications',
        sentNotifications: 'sent_notifications',
        offers: 'offers',
        admin: 'admin'
    }
};

// Initialize Supabase Client
// Note: You need to include @supabase/supabase-js in your HTML files
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.projectUrl,
            SUPABASE_CONFIG.anonKey
        );
        console.log('Supabase initialized successfully');
        return supabaseClient;
    } else {
        console.error('Supabase library not loaded. Please include the script tag.');
        return null;
    }
}

// Get Supabase Client
function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// ============================================
// Database Operations
// ============================================

// USERS OPERATIONS
const UsersDB = {
    // Register new user
    async register(userData) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.users)
            .insert([{
                email: userData.email,
                password: userData.password, // Note: In production, hash this!
                full_name: userData.fullName,
                phone: userData.phone,
                country_code: userData.countryCode,
                city: userData.city,
                address: userData.address,
                role: userData.role
            }])
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Login user
    async login(email, password) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.users)
            .select('*')
            .eq('email', email);

        if (error) throw error;

        const user = Array.isArray(data) ? data.find(item => item.password === password) : null;
        if (user) {
            return user;
        }

        const { data: adminData, error: adminError } = await supabase
            .from(SUPABASE_CONFIG.tables.admin)
            .select('*')
            .eq('email', email);

        if (adminError) throw adminError;

        const adminUser = Array.isArray(adminData) ? adminData.find(item => item.password === password) : null;
        if (!adminUser) {
            const loginError = new Error('Invalid email or password');
            loginError.status = 401;
            throw loginError;
        }

        // Try to find matching user in users table to use that ID for notifications
        const { data: usersMatch } = await supabase
            .from(SUPABASE_CONFIG.tables.users)
            .select('*')
            .eq('email', email)
            .eq('role', 'admin');

        if (usersMatch && usersMatch.length > 0) {
            return { ...usersMatch[0], role: 'admin' };
        }

        return { ...adminUser, role: 'admin' };
    },
    
    // Get user by ID
    async getById(userId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.users)
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // Update user
    async update(userId, updates) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.users)
            .update(updates)
            .eq('id', userId)
            .select();
        
        if (error) throw error;
        return data[0];
    }
};

// SERVICES OPERATIONS
const ServicesDB = {
    // Add new service
    async add(serviceData) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.services)
            .insert([serviceData])
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Get services by provider
    async getByProvider(providerId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.services)
            .select('*')
            .eq('provider_id', providerId);
        
        if (error) throw error;
        return data;
    },
    
    // Get all services for public display
    async getAll() {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.services)
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Get approved services
    async getApproved() {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.services)
            .select('*')
            .eq('status', 'approved');
        
        if (error) throw error;
        return data;
    },
    
    // Update service
    async update(serviceId, updates) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.services)
            .update(updates)
            .eq('id', serviceId)
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Delete service
    async delete(serviceId) {
        const supabase = getSupabase();
        const { error } = await supabase
            .from(SUPABASE_CONFIG.tables.services)
            .delete()
            .eq('id', serviceId);
        
        if (error) throw error;
        return true;
    }
};

// BOOKINGS OPERATIONS
const BookingsDB = {
    // Add new booking
    async add(bookingData) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.bookings)
            .insert([bookingData])
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Get bookings by customer
    async getByCustomer(customerId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.bookings)
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    // Update booking
    async update(bookingId, updates) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.bookings)
            .update(updates)
            .eq('id', bookingId)
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Cancel booking
    async cancel(bookingId) {
        return await this.update(bookingId, { status: 'cancelled' });
    }
};

// NOTIFICATIONS OPERATIONS
const NotificationsDB = {
    // Add notification
    async add(notificationData) {
        const supabase = getSupabase();
        // Only include fields that exist in the notifications table schema to avoid PostgREST errors
        const payload = {
            user_id: notificationData.user_id,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            status: notificationData.status || 'unread',
            created_at: notificationData.created_at || new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.notifications)
            .insert([payload])
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Get notifications by user
    async getByUser(userId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.notifications)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    // Mark as read
    async markAsRead(notificationId) {
        const supabase = getSupabase();
        const { error } = await supabase
            .from(SUPABASE_CONFIG.tables.notifications)
            .update({ status: 'read' })
            .eq('id', notificationId);
        
        if (error) throw error;
        return true;
    }
};

// SENT NOTIFICATIONS OPERATIONS
const SentNotificationsDB = {
    // Add sent notification
    async add(notificationData) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.sentNotifications)
            .insert([notificationData])
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Get by provider
    async getByProvider(providerId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.sentNotifications)
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
};

// OFFERS OPERATIONS
const OffersDB = {
    // Add new offer
    async add(offerData) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.offers)
            .insert([offerData])
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Get offers by provider
    async getByProvider(providerId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.offers)
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    // Get offer by ID
    async getById(offerId) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.offers)
            .select('*')
            .eq('id', offerId)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // Get active offers
    async getActive() {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.offers)
            .select('*')
            .eq('status', 'active');
        
        if (error) throw error;
        return data;
    },
    
    // Update offer
    async update(offerId, updates) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.offers)
            .update(updates)
            .eq('id', offerId)
            .select();
        
        if (error) throw error;
        return data[0];
    },
    
    // Delete offer
    async delete(offerId) {
        const supabase = getSupabase();
        const { error } = await supabase
            .from(SUPABASE_CONFIG.tables.offers)
            .delete()
            .eq('id', offerId);
        
        if (error) throw error;
        return true;
    }
};

// ADMIN OPERATIONS
const AdminDB = {
    // Admin login
    async login(email, password) {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.admin)
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();
        
        if (error) throw error;
        return data;
    },
    
    // Get all users
    async getAllUsers() {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tables.users)
            .select('*');
        
        if (error) throw error;
        return data;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_CONFIG,
        initSupabase,
        getSupabase,
        UsersDB,
        ServicesDB,
        BookingsDB,
        NotificationsDB,
        SentNotificationsDB,
        OffersDB,
        AdminDB
    };
}
