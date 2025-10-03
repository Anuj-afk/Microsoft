import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    shortDescription: {
        type: String,
        default: '',
        maxLength: 200
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    // Basic specifications for product cards (short, key features)
    basicSpecs: [{
        key: { type: String, trim: true },
        value: { type: String, trim: true }
    }],
    // Detailed specifications for product pages (comprehensive info)
    detailedSpecs: [{
        category: { type: String, trim: true }, // e.g., "Performance", "Display", "Connectivity"
        specs: [{
            key: { type: String, trim: true },
            value: { type: String, trim: true }
        }]
    }],
    // Keep old specifications for backward compatibility
    specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: () => []
    },
    images: [{
        url: { type: String, required: true },
        alt: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false }
    }],
    stock: {
        quantity: { type: Number, default: 0, min: 0 },
        lowStockThreshold: { type: Number, default: 5, min: 0 },
        trackStock: { type: Boolean, default: true }
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'discontinued'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    metaData: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        keywords: [{ type: String }]
    },
    ratings: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0, min: 0 },
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
    },
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    salesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
deviceSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
deviceSchema.index({ category: 1, status: 1 });
deviceSchema.index({ brand: 1 });
deviceSchema.index({ price: 1 });
deviceSchema.index({ featured: 1, isActive: 1 });
deviceSchema.index({ slug: 1 }, { unique: true });
deviceSchema.index({ sku: 1 }, { unique: true, sparse: true });
deviceSchema.index({ 'ratings.average': -1 });
deviceSchema.index({ salesCount: -1 });
deviceSchema.index({ createdAt: -1 });
deviceSchema.index({ status: 1, featured: 1, category: 1 });
deviceSchema.index({ status: 1, featured: 1 });

// Virtual for discounted price
deviceSchema.virtual('discountedPrice').get(function() {
    if (this.discount > 0 && this.originalPrice) {
        return this.originalPrice - (this.originalPrice * this.discount / 100);
    }
    return this.price;
});

// Virtual for stock status
deviceSchema.virtual('stockStatus').get(function() {
    if (!this.stock.trackStock) return 'not-tracked';
    if (this.stock.quantity === 0) return 'out-of-stock';
    if (this.stock.quantity <= this.stock.lowStockThreshold) return 'low-stock';
    return 'in-stock';
});

// Virtual for primary image
deviceSchema.virtual('primaryImage').get(function() {
    const primaryImg = this.images.find(img => img.isPrimary);
    return primaryImg ? primaryImg.url : (this.images.length > 0 ? this.images[0].url : '');
});

// Pre-save middleware to ensure only one primary image
deviceSchema.pre('save', function(next) {
    if (this.images && this.images.length > 0) {
        const primaryImages = this.images.filter(img => img.isPrimary);
        if (primaryImages.length > 1) {
            // Reset all to false first
            this.images.forEach(img => img.isPrimary = false);
            // Set only the first one as primary
            this.images[0].isPrimary = true;
        } else if (primaryImages.length === 0) {
            // If no primary image is set, make the first one primary
            this.images[0].isPrimary = true;
        }
    }
    next();
});

// Pre-save middleware to calculate discounted price if originalPrice is set
deviceSchema.pre('save', function(next) {
    if (this.originalPrice && this.discount > 0) {
        this.price = this.originalPrice - (this.originalPrice * this.discount / 100);
    }
    next();
});

// Pre-save middleware to migrate old specifications to new format if needed
deviceSchema.pre('save', function(next) {
    // If we have old specifications array but no basic/detailed specs, migrate them
    if (this.specifications && Array.isArray(this.specifications) && this.specifications.length > 0) {
        if (!this.basicSpecs || this.basicSpecs.length === 0) {
            // Take first 4-6 specs as basic specs
            this.basicSpecs = this.specifications
                .filter(spec => spec.key && spec.value)
                .slice(0, 6)
                .map(spec => ({
                    key: spec.key,
                    value: spec.value
                }));
        }
        
        if (!this.detailedSpecs || this.detailedSpecs.length === 0) {
            // Organize remaining specs into categories
            const categories = {
                'Performance': ['Processor', 'CPU', 'Memory', 'RAM', 'Graphics', 'GPU'],
                'Storage': ['Storage', 'SSD', 'HDD', 'Hard Drive'],
                'Display': ['Display', 'Screen', 'Monitor', 'Resolution'],
                'Connectivity': ['WiFi', 'Bluetooth', 'USB', 'Ports', 'Network'],
                'Physical': ['Dimensions', 'Weight', 'Size', 'Color'],
                'Power': ['Battery', 'Power', 'Adapter'],
                'Software': ['Operating System', 'OS', 'Software'],
                'Other': []
            };
            
            const organizedSpecs = {};
            
            this.specifications.forEach(spec => {
                if (!spec.key || !spec.value) return;
                
                let categoryFound = false;
                for (const [category, keywords] of Object.entries(categories)) {
                    if (keywords.some(keyword => 
                        spec.key.toLowerCase().includes(keyword.toLowerCase())
                    )) {
                        if (!organizedSpecs[category]) organizedSpecs[category] = [];
                        organizedSpecs[category].push({
                            key: spec.key,
                            value: spec.value
                        });
                        categoryFound = true;
                        break;
                    }
                }
                
                if (!categoryFound) {
                    if (!organizedSpecs['Other']) organizedSpecs['Other'] = [];
                    organizedSpecs['Other'].push({
                        key: spec.key,
                        value: spec.value
                    });
                }
            });
            
            this.detailedSpecs = Object.entries(organizedSpecs)
                .filter(([category, specs]) => specs.length > 0)
                .map(([category, specs]) => ({
                    category,
                    specs
                }));
        }
    }
    
    next();
});

const Device = mongoose.model('Device', deviceSchema);
export default Device;
