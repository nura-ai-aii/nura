import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './OnboardingSurvey.css';

const OnboardingSurvey = ({ currentUser, onComplete }) => {
  const [step, setStep] = useState(1);
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

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    
    const userProfile = {
      ...formData,
      nickname: formData.nickname.trim() || "Master", // Default to Master if skipped
      surveyCompleted: true,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "users", currentUser.uid), userProfile, { merge: true });
      onComplete(userProfile);
    } catch (error) {
      console.error("Error saving survey:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="survey-container">
      <div className="survey-card">
        <div className="survey-header">
          <h2>Hexpar AI Configuration</h2>
          <p>Let's personalize your cognitive assistant.</p>
        </div>

        <form className="survey-form" onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="survey-step animation-fade-in">
              <label>What is your actual name?</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Nur Mohammad" required />
              
              <label>How old are you?</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="e.g. 25" required />
            </div>
          )}

          {step === 2 && (
            <div className="survey-step animation-fade-in">
              <label>What is your profession or primary interest?</label>
              <input type="text" name="profession" value={formData.profession} onChange={handleChange} placeholder="e.g. Software Engineer, Designer" required />
            </div>
          )}

          {step === 3 && (
            <div className="survey-step animation-fade-in">
              <label>What kind of responses do you prefer?</label>
              <select name="communicationStyle" value={formData.communicationStyle} onChange={handleChange}>
                <option value="Professional">Professional & Concise</option>
                <option value="Friendly">Friendly & Warm</option>
                <option value="Sci-Fi">Sci-Fi / Futuristic Companion</option>
                <option value="Academic">Academic & Highly Detailed</option>
              </select>
            </div>
          )}

          {step === 4 && (
            <div className="survey-step animation-fade-in">
              <label>What Nickname should Hexpar AI use for you?</label>
              <p className="survey-hint">By default, the AI calls you "Master". If you prefer something else, enter it below.</p>
              <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} placeholder="e.g. Commander, Chief, Boss..." />
            </div>
          )}

          <div className="survey-footer">
            {step > 1 ? (
              <button type="button" className="survey-btn secondary" onClick={handleBack}>Back</button>
            ) : <div></div>}
            
            {step < 4 ? (
              <button type="button" className="survey-btn primary" onClick={handleNext}>Next</button>
            ) : (
              <button type="submit" className="survey-btn primary" disabled={isSubmitting}>
                {isSubmitting ? 'Initializing...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingSurvey;
