import React, { useState } from 'react';
import StarRating from './StarRating';

const DeviceReviews = ({ device }) => {
    const [activeReviewTab, setActiveReviewTab] = useState('reviews');
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewerName, setReviewerName] = useState('');

    // Static sample reviews data
    const sampleReviews = [
        {
            id: 1,
            name: "Rajesh Kumar",
            rating: 5,
            date: "2024-01-15",
            title: "Excellent product!",
            comment: "This device exceeded my expectations. The build quality is outstanding and performance is top-notch. Highly recommended for professionals.",
            helpful: 12,
            verified: true
        },
        {
            id: 2,
            name: "Priya Sharma",
            rating: 4,
            date: "2024-01-10",
            title: "Good value for money",
            comment: "Great features for the price point. The display quality is impressive and battery life is decent. Minor issues with software updates but overall satisfied.",
            helpful: 8,
            verified: true
        },
        {
            id: 3,
            name: "Ahmed Ali",
            rating: 5,
            date: "2024-01-08",
            title: "Perfect for gaming",
            comment: "Runs all my favorite games smoothly. The graphics are crystal clear and no lag whatsoever. Customer service was also very helpful during setup.",
            helpful: 15,
            verified: false
        },
        {
            id: 4,
            name: "Sneha Patel",
            rating: 3,
            date: "2024-01-05",
            title: "Average experience",
            comment: "The product works as described but had some initial setup issues. Once configured properly, it performs well. Could use better documentation.",
            helpful: 3,
            verified: true
        },
        {
            id: 5,
            name: "Vikram Singh",
            rating: 4,
            date: "2024-01-02",
            title: "Solid build quality",
            comment: "Very well constructed device. Love the design and premium feel. Performance is good for most tasks, though it gets a bit warm during heavy usage.",
            helpful: 6,
            verified: true
        }
    ];

    const reviewStats = {
        totalReviews: sampleReviews.length,
        averageRating: 4.2,
        distribution: {
            5: 2,
            4: 2,
            3: 1,
            2: 0,
            1: 0
        }
    };

    const handleSubmitReview = (e) => {
        e.preventDefault();
        console.log('Submitting review:', {
            rating: reviewRating,
            name: reviewerName,
            comment: reviewText
        });
        
        setReviewRating(0);
        setReviewText('');
        setReviewerName('');
        
        alert('Thank you for your review! It will be published after moderation.');
    };

    return (
        <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
            
            {/* Review Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Overall Rating */}
                <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                        {reviewStats.averageRating.toFixed(1)}
                    </div>
                    <StarRating rating={reviewStats.averageRating} size="w-6 h-6" />
                    <p className="text-gray-600 mt-2">
                        Based on {reviewStats.totalReviews} reviews
                    </p>
                </div>

                {/* Rating Distribution */}
                <div className="lg:col-span-2">
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center">
                                <span className="text-sm text-gray-600 w-3">{rating}</span>
                                <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <div className="flex-1 mx-4">
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-yellow-400 h-2 rounded-full"
                                            style={{
                                                width: `${(reviewStats.distribution[rating] / reviewStats.totalReviews) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 w-8">
                                    {reviewStats.distribution[rating]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Review Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveReviewTab('reviews')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeReviewTab === 'reviews'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        All Reviews ({reviewStats.totalReviews})
                    </button>
                    <button
                        onClick={() => setActiveReviewTab('write')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeReviewTab === 'write'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Write a Review
                    </button>
                </nav>
            </div>

            {/* Review Content */}
            {activeReviewTab === 'reviews' && (
                <div className="space-y-6">
                    {sampleReviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 font-medium text-sm">
                                            {review.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-medium text-gray-900">{review.name}</h4>
                                            {review.verified && (
                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                                    Verified Purchase
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <StarRating rating={review.rating} />
                                            <span className="text-gray-500 text-sm">
                                                {new Date(review.date).toLocaleDateString('en-IN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                            <p className="text-gray-700 mb-3">{review.comment}</p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <button className="flex items-center space-x-1 hover:text-purple-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                    </svg>
                                    <span>Helpful ({review.helpful})</span>
                                </button>
                                <button className="hover:text-purple-600">Reply</button>
                                <button className="hover:text-red-600">Report</button>
                            </div>
                        </div>
                    ))}

                    <div className="text-center pt-6">
                        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-300">
                            Load More Reviews
                        </button>
                    </div>
                </div>
            )}

            {/* Write Review Form */}
            {activeReviewTab === 'write' && (
                <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter your name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Rating
                        </label>
                        <div className="flex items-center space-x-2">
                            <StarRating 
                                rating={reviewRating} 
                                interactive={true} 
                                onRatingChange={setReviewRating}
                            />
                            <span className="text-sm text-gray-600 ml-3">
                                {reviewRating > 0 ? `${reviewRating} star${reviewRating > 1 ? 's' : ''}` : 'Click to rate'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Review
                        </label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            required
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Share your experience with this product..."
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => {
                                setReviewRating(0);
                                setReviewText('');
                                setReviewerName('');
                                setActiveReviewTab('reviews');
                            }}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!reviewRating || !reviewText.trim() || !reviewerName.trim()}
                            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300"
                        >
                            Submit Review
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DeviceReviews;