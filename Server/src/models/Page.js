import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
    title: {
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
    content: {
        type: String,
        default: ''
    },
    metaTitle: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    featuredImage: {
        type: String,
        default: ''
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isHomePage: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page',
        default: null
    }
}, { timestamps: true });

// Add text index for search functionality
pageSchema.index({ title: 'text', content: 'text', metaDescription: 'text' });

// Pre-save hook to ensure only one home page exists
pageSchema.pre('save', async function(next) {
    if (this.isHomePage) {
        try {
            // If this is the home page, make sure no other page is marked as home
            await mongoose.model('Page').updateMany(
                { _id: { $ne: this._id }, isHomePage: true },
                { isHomePage: false }
            );
        } catch (error) {
            return next(error);
        }
    }
    next();
});

const Page = mongoose.model('Page', pageSchema);
export default Page;