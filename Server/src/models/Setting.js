import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    siteName: {
        type: String,
        default: 'MultiSoft'
    },
    siteDescription: {
        type: String,
        default: ''
    },
    contactEmail: {
        type: String,
        default: ''
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    socialLinks: {
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' }
    },
    banner: {
        slidingImages: [{ type: String, default: '' }],
        staticImage: { type: String, default: '' }
    },
    offer: {
        title: { type: String, default: 'Special Back to School Offer' },
        description: { type: String, default: 'Get up to 25% off on selected laptops and desktops, plus free accessories bundle with any purchase over ₹1,500.' },
        discount: { type: Number, default: 25 },
        minOrderAmount: { type: Number, default: 1500 },
        ctaText: { type: String, default: 'Shop the Sale' },
        ctaLink: { type: String, default: '/offers' },
        backgroundImage: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        startDate: { type: Date },
        endDate: { type: Date },
        backgroundColor: { type: String, default: '#7c3aed' },
        textColor: { type: String, default: '#ffffff' }
    },
    colorScheme: {
        type: String,
        enum: ['default', 'dark', 'light', 'purple', 'blue'],
        default: 'default'
    },
    enableComments: {
        type: Boolean,
        default: true
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;