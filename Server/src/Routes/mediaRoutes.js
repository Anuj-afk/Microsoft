import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import mongoose from 'mongoose';
import path from 'path';
import Logo from '../models/Logo.js';
import Media from '../models/Media.js';

const router = express.Router();

// AWS S3 Configuration
const s3Config = {
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
};

const s3Client = new S3Client(s3Config);

// Multer configuration
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Helper: build public S3 URL
const getPublicUrl = (bucket, key, region) => 
    `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

// Get current logo
router.get('/logo', async (req, res) => {
    try {
        const logo = await Logo.findOne().sort({ createdAt: -1 });
        res.json({ logoUrl: logo?.url });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logo' });
    }
});

// Upload new logo
router.post('/logo', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileKey = `logo/${Date.now()}-${nanoid(6)}-logo${path.extname(req.file.originalname)}`;
        
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        await s3Client.send(command);

        // Build public URL instead of signed URL
        const url = getPublicUrl(process.env.AWS_BUCKET_NAME, fileKey, process.env.AWS_REGION);

        // Save to MongoDB
        const logo = new Logo({
            url: url,
            key: fileKey
        });
        await logo.save();

        res.json({
            message: 'Logo uploaded successfully',
            fileUrl: url,
            key: fileKey
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Upload multiple files for media library
router.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadResults = [];

        for (const file of req.files) {
            const fileKey = `uploads/${Date.now()}-${nanoid(6)}-${file.originalname}`;
            
            const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            });

            await s3Client.send(command);

            // Public URL instead of signed URL
            const url = getPublicUrl(process.env.AWS_BUCKET_NAME, fileKey, process.env.AWS_REGION);

            const media = new Media({
                title: path.parse(file.originalname).name,
                fileName: file.originalname,
                fileType: file.mimetype.startsWith('image/') ? 'image' : 'document',
                mimeType: file.mimetype,
                awsUrl: url,
                size: file.size,
                uploadedBy: req.user && req.user._id ? req.user._id : null,
                alt: '',
                caption: ''
            });

            await media.save();

            uploadResults.push({
                originalName: file.originalname,
                url: url,
                key: fileKey,
                _id: media._id
            });
        }

        res.json({
            message: 'Files uploaded successfully',
            files: uploadResults
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const [mediaFiles, logos] = await Promise.all([
            Media.find().sort({ createdAt: -1 }),
            Logo.find().sort({ createdAt: -1 })
        ]);

        const logoFiles = logos.map(logo => ({
            _id: logo._id,
            title: 'Logo',
            fileName: logo.key.split('/').pop(),
            fileType: 'image/logo',
            awsUrl: logo.url,
            key: logo.key,
            createdAt: logo.createdAt,
            updatedAt: logo.updatedAt
        }));

        const allFiles = [...mediaFiles, ...logoFiles].sort((a, b) => 
            b.createdAt - a.createdAt
        );

        res.json(allFiles);
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Failed to fetch media files' });
    }
});

// Delete media file
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ID is valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid media ID' });
        }

        // First, try to find in Media collection
        let mediaFile = await Media.findById(id);
        let isLogo = false;
        let fileKey = null;

        if (mediaFile) {
            // Extract key from awsUrl for regular media files
            const urlParts = mediaFile.awsUrl.split('/');
            fileKey = urlParts.slice(-2).join('/'); // Get the last two parts (folder/filename)
        } else {
            // If not found in Media, check Logo collection
            const logoFile = await Logo.findById(id);
            if (logoFile) {
                mediaFile = logoFile;
                isLogo = true;
                fileKey = logoFile.key;
            }
        }

        if (!mediaFile) {
            return res.status(404).json({ error: 'Media file not found' });
        }

        // Delete from S3
        if (fileKey) {
            try {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: fileKey
                });
                await s3Client.send(deleteCommand);
            } catch (s3Error) {
                console.error('S3 deletion error:', s3Error);
                // Continue with database deletion even if S3 deletion fails
            }
        }

        // Delete from database
        if (isLogo) {
            await Logo.findByIdAndDelete(id);
        } else {
            await Media.findByIdAndDelete(id);
        }

        res.json({
            message: 'Media file deleted successfully',
            deletedFile: {
                id: mediaFile._id,
                title: isLogo ? 'Logo' : mediaFile.title,
                type: isLogo ? 'logo' : 'media'
            }
        });

    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'Failed to delete media file' });
    }
});

export default router;
