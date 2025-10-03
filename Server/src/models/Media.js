import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true,
        enum: ['image', 'video', 'document', 'audio']
    },
    mimeType: {
        type: String,
        required: true
    },
    awsUrl: {
        type: String,
        required: true,
        unique: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    alt: {
        type: String,
        trim: true
    },
    caption: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
mediaSchema.index({ title: 'text' });
mediaSchema.index({ fileType: 1 });
mediaSchema.index({ uploadedBy: 1 });

const Media = mongoose.model('Media', mediaSchema);

export default Media;