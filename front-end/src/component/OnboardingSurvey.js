import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './OnboardingSurvey.css';

const OnboardingSurvey = ({ currentUser, onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    profession: '',
    communicationStyle: 'Professional',
    nickname: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    
    const userProfile = {
      ...formData,
      nickname: formData.nickname.trim() || "Master",
      surveyCompleted: true,
      updatedAt: new Date().toISOString()
    };

    try {
      // Run setDoc asynchronously so UI doesn't hang waiting for server response
      setDoc(doc(db, "users", currentUser.uid), userProfile, { merge: true }).catch((err) => {
        console.error("Background sync error:", err);
      });
      // Immediately transition
      onComplete(userProfile);
    } catch (error) {
      console.error("Error saving survey:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="survey-glass-container">
      <div className="survey-glass-card">
        <div className="survey-glass-header">
          <h2>Initialize Core</h2>
          <p>Personalize your AI companion.</p>
        </div>

        <form className="survey-glass-form" onSubmit={handleSubmit}>
          
          <div className="glass-input-group">
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Actual Name (e.g. Nur)" required />
          </div>

          <div className="glass-input-group">
            <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age (e.g. 25)" required />
          </div>

          <div className="glass-input-group">
            <input type="text" name="profession" value={formData.profession} onChange={handleChange} placeholder="Profession / Interest" required />
          </div>

          <div className="glass-input-group">
            <select name="communicationStyle" value={formData.communicationStyle} onChange={handleChange}>
              <option value="Professional">Professional & Concise</option>
              <option value="Friendly">Friendly & Warm</option>
              <option value="Sci-Fi">Sci-Fi Companion</option>
              <option value="Academic">Academic & Detailed</option>
            </select>
          </div>

          <div className="glass-input-group">
            <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} placeholder="Nickname (AI will call you this)" />
            <span className="glass-hint">Default: "Master"</span>
          </div>

          <button type="submit" className="glass-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Syncing...' : 'INITIALIZE'}
          </button>
        </form>
      </div>

      {/* Decorative Glass Orbs */}
      <div className="glass-orb orb-1"></div>
      <div className="glass-orb orb-2"></div>
    </div>
  );
};

export default OnboardingSurvey;
