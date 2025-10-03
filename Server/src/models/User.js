import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(email) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
            },
            message: 'Please enter a valid email'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        validate: {
            validator: function(phone) {
                return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
            },
            message: 'Please enter a valid phone number'
        }
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    permissions: {
        type: [String],
        default: function() {
            if (this.role === 'admin') {
                return [
                    'manage_users',
                    'manage_products', 
                    'manage_categories',
                    'manage_orders',
                    'manage_settings',
                    'manage_media',
                    'view_analytics',
                    'manage_pages',
                    'manage_offers',
                    'system_admin',
                    "view_users"
                ];
            }
            return ['view_products', 'place_orders'];
        }
    },
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        marketingEmails: {
            type: Boolean,
            default: true
        }
    },
    metadata: {
        registrationIP: String,
        lastLoginIP: String,
        userAgent: String,
        referrer: String
    }
}, {
    timestamps: true
});

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
        };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Static method to find by credentials
userSchema.statics.findByCredentials = async function(email, password) {
    const user = await this.findOne({ email, isActive: true }).select('+password');
    
    if (!user) {
        throw new Error('Invalid email or password');
    }
    
    if (user.isLocked) {
        await user.incLoginAttempts();
        throw new Error('Account temporarily locked due to too many failed login attempts');
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
        await user.incLoginAttempts();
        throw new Error('Invalid email or password');
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts || user.lockUntil) {
        await user.resetLoginAttempts();
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    return user;
};

// Method to check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission) || this.role === 'admin';
};

// Method to add permission
userSchema.methods.addPermission = function(permission) {
    if (!this.permissions.includes(permission)) {
        this.permissions.push(permission);
    }
};

// Method to remove permission
userSchema.methods.removePermission = function(permission) {
    this.permissions = this.permissions.filter(p => p !== permission);
};

// Method to get public profile
userSchema.methods.toPublicJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpire;
    delete user.loginAttempts;
    delete user.lockUntil;
    return user;
};

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model('User', userSchema);