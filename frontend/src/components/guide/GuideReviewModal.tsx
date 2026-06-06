import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import apiClient from '@/utils/apiClient';
import toast from 'react-hot-toast';

interface GuideReviewModalProps {
  bookingId: string;
  guideId: string;
  guideName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function GuideReviewModal({ bookingId, guideId, guideName, onClose, onSuccess }: GuideReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/guides/${guideId}/reviews`, {
        bookingId,
        rating,
        reviewText
      });
      toast.success('Review submitted successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-luxury overflow-hidden"
      >
        <div className="p-6 border-b border-sand-100 flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-navy-950">Review Your Experience</h2>
          <button onClick={onClose} className="p-2 hover:bg-sand-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-navy-950/60" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm font-medium text-navy-950/60 mb-2">How was your tour with {guideName}?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      (hoveredRating || rating) >= star
                        ? 'fill-gold-500 text-gold-500'
                        : 'fill-sand-100 text-sand-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">
              Share your experience (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you love about the tour?"
              className="w-full h-32 bg-sand-50 rounded-xl border border-sand-100 p-4 text-sm font-medium text-navy-950 outline-none focus:border-gold-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="rounded-xl bg-navy-950 text-white shadow-md hover:bg-navy-900"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
