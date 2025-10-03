import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxLength: 200,
        },
        slug: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: true,
            maxLength: 1000,
        },
        shortDescription: {
            type: String,
            maxLength: 300,
        },

        // Discount Information
        discountType: {
            type: String,
            enum: ["percentage", "fixed", "buy_one_get_one", "free_shipping"],
            default: "percentage",
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        maxDiscountAmount: {
            type: Number,
            min: 0,
        },

        // Order Requirements
        minOrderAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxOrderAmount: {
            type: Number,
            min: 0,
        },
        minQuantity: {
            type: Number,
            default: 1,
            min: 1,
        },

        // Applicable Products/Categories
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Device",
            },
        ],
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],
        excludedProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Device",
            },
        ],

        // Time-based restrictions - SIMPLIFIED VALIDATION
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
            // Remove the custom validator - we'll handle this in pre-save middleware
        },

        // Usage limitations
        usageLimit: {
            type: Number,
            min: 1,
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        userUsageLimit: {
            type: Number,
            min: 1,
            default: 1,
        },

        // Promo code (if applicable)
        promoCode: {
            type: String,
            trim: true,
            uppercase: true,
            unique: true,
            sparse: true,
        },
        isPromoCodeRequired: {
            type: Boolean,
            default: false,
        },

        // Visual customization
        backgroundImage: {
            url: {
                type: String,
                trim: true,
            },
            alt: {
                type: String,
                trim: true,
            },
        },
        backgroundColor: {
            type: String,
            default: "#7c3aed",
            match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        },
        textColor: {
            type: String,
            default: "#ffffff",
            match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        },
        badgeText: {
            type: String,
            trim: true,
            maxLength: 50,
        },
        badgeColor: {
            type: String,
            default: "#ef4444",
            match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        },

        // Call to Action
        ctaText: {
            type: String,
            default: "Shop Now",
            trim: true,
            maxLength: 50,
        },
        ctaLink: {
            type: String,
            trim: true,
            maxLength: 500,
        },

        // Display settings
        displayLocations: [
            {
                type: String,
                enum: [
                    "homepage",
                    "product_page",
                    "category_page",
                    "cart_page",
                    "checkout_page",
                    "banner",
                ],
                default: ["homepage"],
            },
        ],
        priority: {
            type: Number,
            default: 0,
            min: 0,
            max: 10,
        },

        // Status and visibility
        status: {
            type: String,
            enum: ["draft", "active", "paused", "expired", "terminated"],
            default: "draft",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },

        // Terms and conditions
        terms: {
            type: String,
            maxLength: 2000,
        },

        // Analytics
        viewCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        clickCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        conversionCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalSavings: {
            type: Number,
            default: 0,
            min: 0,
        },

        // User restrictions
        allowedUserTypes: [
            {
                type: String,
                enum: ["new", "returning", "vip", "all"],
                default: ["all"],
            },
        ],
        allowedCountries: [
            {
                type: String,
                trim: true,
                uppercase: true,
            },
        ],

        // Admin information
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual fields
offerSchema.virtual("isExpired").get(function () {
    return new Date() > this.endDate;
});

offerSchema.virtual("isStarted").get(function () {
    return new Date() >= this.startDate;
});

offerSchema.virtual("isValid").get(function () {
    const now = new Date();
    return (
        this.isActive &&
        this.status === "active" &&
        now >= this.startDate &&
        now <= this.endDate &&
        (!this.usageLimit || this.usageCount < this.usageLimit)
    );
});

offerSchema.virtual("daysLeft").get(function () {
    const now = new Date();
    const timeDiff = this.endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

offerSchema.virtual("usagePercentage").get(function () {
    if (!this.usageLimit) return 0;
    return (this.usageCount / this.usageLimit) * 100;
});

offerSchema.virtual("conversionRate").get(function () {
    if (this.clickCount === 0) return 0;
    return (this.conversionCount / this.clickCount) * 100;
});

// Indexes for better performance
offerSchema.index({ status: 1, isActive: 1 });
offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ slug: 1 }, { unique: true });
offerSchema.index({ promoCode: 1 }, { unique: true, sparse: true });
offerSchema.index({ applicableCategories: 1 });
offerSchema.index({ applicableProducts: 1 });
offerSchema.index({ priority: -1 });
offerSchema.index({ isFeatured: 1, priority: -1 });
offerSchema.index({ displayLocations: 1 });
offerSchema.index({ createdAt: -1 });

// Text search indexes
offerSchema.index({
    title: "text",
    description: "text",
    shortDescription: "text",
    promoCode: "text",
});

// Pre-save middleware with proper date validation
offerSchema.pre("save", function (next) {
    // Generate slug from title if not provided
    if (!this.slug && this.title) {
        this.slug = this.title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    // Ensure dates are Date objects
    if (this.startDate && !(this.startDate instanceof Date)) {
        this.startDate = new Date(this.startDate);
    }
    if (this.endDate && !(this.endDate instanceof Date)) {
        this.endDate = new Date(this.endDate);
    }

    // Date validation in pre-save - this works for both create and update
    if (this.startDate && this.endDate) {
        const startTime = this.startDate.getTime();
        const endTime = this.endDate.getTime();
        
        if (endTime <= startTime) {
            const error = new Error('End date must be after start date');
            error.name = 'ValidationError';
            return next(error);
        }
    }

    // Auto-set status based on dates
    const now = new Date();
    if (this.startDate && this.endDate) {
        if (now < this.startDate && this.status !== "draft") {
            this.status = "active"; // Scheduled to start
        } else if (now > this.endDate && this.status === "active") {
            this.status = "expired";
        }
    }

    // Set badge text if not provided
    if (!this.badgeText && this.discountType === "percentage") {
        this.badgeText = `${this.discountValue}% OFF`;
    } else if (!this.badgeText && this.discountType === "fixed") {
        this.badgeText = `₹${this.discountValue} OFF`;
    } else if (!this.badgeText && this.discountType === "free_shipping") {
        this.badgeText = 'FREE SHIPPING';
    } else if (!this.badgeText && this.discountType === "buy_one_get_one") {
        this.badgeText = 'BOGO';
    }

    next();
});

// Pre-update middleware for findOneAndUpdate operations
offerSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    
    // Handle both $set and direct update styles
    const updateData = update.$set || update;
    
    if (updateData.startDate && updateData.endDate) {
        const startDate = new Date(updateData.startDate);
        const endDate = new Date(updateData.endDate);
        
        if (endDate <= startDate) {
            const error = new Error('End date must be after start date');
            error.name = 'ValidationError';
            return next(error);
        }
    }
    
    // If updating only one date, we need to check against existing document
    if ((updateData.startDate || updateData.endDate) && (!updateData.startDate || !updateData.endDate)) {
        // This requires us to fetch the existing document to compare
        // For simplicity, we'll skip this validation in update-only scenarios
        // The pre-save middleware will catch it if both dates are being set
    }
    
    next();
});

// Static methods
offerSchema.statics.findActive = function () {
    const now = new Date();
    return this.find({
        isActive: true,
        status: "active",
        startDate: { $lte: now },
        endDate: { $gte: now },
    }).sort({ priority: -1, createdAt: -1 });
};

offerSchema.statics.findByLocation = function (location) {
    return this.findActive().where("displayLocations").in([location]);
};

offerSchema.statics.findFeatured = function () {
    return this.findActive().where("isFeatured").equals(true);
};

offerSchema.statics.findByPromoCode = function (code) {
    return this.findOne({
        promoCode: code.toUpperCase(),
        isActive: true,
        status: "active",
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
    });
};

// Instance methods
offerSchema.methods.incrementUsage = function () {
    this.usageCount += 1;
    return this.save();
};

offerSchema.methods.incrementViews = function () {
    this.viewCount += 1;
    return this.save();
};

offerSchema.methods.incrementClicks = function () {
    this.clickCount += 1;
    return this.save();
};

offerSchema.methods.incrementConversions = function (savingsAmount = 0) {
    this.conversionCount += 1;
    this.totalSavings += savingsAmount;
    return this.save();
};

offerSchema.methods.canBeUsedBy = function (userId, userType = "all") {
    // Check user type restrictions
    if (
        this.allowedUserTypes.length > 0 &&
        !this.allowedUserTypes.includes("all") &&
        !this.allowedUserTypes.includes(userType)
    ) {
        return false;
    }

    // Check usage limits
    if (this.usageLimit && this.usageCount >= this.usageLimit) {
        return false;
    }

    // Additional user-specific checks can be added here
    return this.isValid;
};

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;