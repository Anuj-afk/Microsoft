// Feature Card Component
const FeatureCard = ({ icon, title, description }) => {
    return (
        <div className="text-center p-6">
            <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {title}
            </h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
};

export default FeatureCard;