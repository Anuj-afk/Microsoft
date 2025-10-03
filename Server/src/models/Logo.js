import mongoose from 'mongoose';

const logoSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true,
        },
        key: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Logo = mongoose.model("Logo", logoSchema);
export default Logo;
