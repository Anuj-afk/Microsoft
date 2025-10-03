// Category Card Component
import { Link } from "react-router-dom";

const CategoryCard = ({ title, image, description, slug }) => {
    return (
        <Link to={`/products/${slug}`} className="group">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:-translate-y-2">
                <div className="h-48 overflow-hidden">
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-600">{description}</p>
                    <div className="mt-4 text-purple-600 group-hover:text-purple-800 font-medium flex items-center">
                        Browse {title}
                        <svg
                            className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5l7 7-7 7"
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default CategoryCard;