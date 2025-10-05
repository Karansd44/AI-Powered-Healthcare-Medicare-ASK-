import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from './components/UIComponents';

const MedicationScheduler = ({ disease, onClose }) => {
  const [suggestedMeds, setSuggestedMeds] = useState([]);
  const [medications, setMedications] = useState([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const nameRef = useRef();
  const dosageRef = useRef();
  const timeRef = useRef();

  // Generate initial suggested meds using the same pattern as before
  useEffect(() => {
    const handleGeneratePlan = async () => {
      setIsLoadingPlan(true);
      const prompt = `Act as a medical AI. For a patient with a potential diagnosis of "${disease}", suggest a typical, sample medication plan. Include 1-2 common medications, their usual dosage, and a standard time of day to take them. This is for informational purposes only. Return the response as a JSON object with a single key \"medications\" which is an array of objects. Each object should have \"name\", \"dosage\", and \"time\".`;

      try {
        let chatHistory = [];
        chatHistory.push({ role: 'user', parts: [{ text: prompt }] });
        const payload = {
          contents: chatHistory,
          generationConfig: {
            responseMimeType: 'application/json'
          }
        };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY_ALT;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
          const jsonText = result.candidates[0].content.parts[0].text;
          try {
            const parsedJson = JSON.parse(jsonText);
            setSuggestedMeds(parsedJson.medications || []);
            // Pre-fill medications list with suggestions (optional)
            setMedications(parsedJson.medications || []);
          } catch (err) {
            console.warn('Could not parse medication JSON from model:', err);
          }
        }
      } catch (error) {
        console.error('Error generating medication plan:', error);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    handleGeneratePlan();
  }, [disease]);

  // Analyze interactions using AI when 2 or more meds are present
  useEffect(() => {
    if (medications.length >= 2) {
      analyzeInteractions(medications);
    } else {
      setAnalysisResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medications.length]);

  const analyzeInteractions = async (meds) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const medsText = meds.map(m => `${m.name} (${m.dosage || 'dose unknown'})`).join('; ');
    const prompt = `You are a clinical decision support assistant. Given the following list of medications: ${medsText}. Analyze potential drug-drug interactions and combined side effects. Return a JSON object with keys: \n- "safe": boolean (true if no clinically significant interactions),\n- "interactions": array of objects with {"medications": ["A","B"], "interaction": "short description", "severity": "low|moderate|high"},\n- "recommendations": string (what to change or monitoring suggestions).\nOnly return valid JSON.`;

    try {
      let chatHistory = [];
      chatHistory.push({ role: 'user', parts: [{ text: prompt }] });
      const payload = { contents: chatHistory, generationConfig: { responseMimeType: 'application/json' } };
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY_ALT;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const jsonText = result.candidates[0].content.parts[0].text;
        try {
          const parsed = JSON.parse(jsonText);
          setAnalysisResult(parsed);
        } catch (err) {
          console.warn('Could not parse analysis JSON:', err, jsonText);
          setAnalysisResult({ safe: false, interactions: [], recommendations: 'Could not parse AI response. Please review manually.' });
        }
      } else {
        setAnalysisResult({ safe: false, interactions: [], recommendations: 'No response from analysis service.' });
      }
    } catch (error) {
      console.error('Error analyzing interactions:', error);
      setAnalysisResult({ safe: false, interactions: [], recommendations: 'Error analyzing interactions.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addMedication = () => {
    const name = nameRef.current?.value?.trim();
    const dosage = dosageRef.current?.value?.trim();
    const time = timeRef.current?.value?.trim();
    if (!name) return;
    setMedications(prev => [...prev, { name, dosage, time }]);
    if (nameRef.current) nameRef.current.value = '';
    if (dosageRef.current) dosageRef.current.value = '';
    if (timeRef.current) timeRef.current.value = '';
  };

  const removeMedication = (index) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="mt-8 p-6 w-full max-w-2xl mx-auto relative">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-xl mb-4">Medication Scheduler & Interaction Checker</h3>
        {onClose && (
          <button onClick={onClose} aria-label="Close medication scheduler" className="p-2 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isLoadingPlan ? (
        <div className="text-center text-gray-500">Generating suggested plan...</div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Suggested for <strong>{disease}</strong> (editable):</p>
            {suggestedMeds.length > 0 ? (
              <div className="flex flex-col gap-2">
                {suggestedMeds.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-xs text-gray-600">{m.dosage} • {m.time}</div>
                    </div>
                    <div>
                      <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm" onClick={() => setMedications(prev => [...prev, m])}>Add</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No suggestions available.</div>
            )}
          </div>

            {/* Quick add common meds */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Quick add common medications:</p>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setMedications(prev => [...prev, { name: 'Paracetamol', dosage: '500mg', time: '8:00 AM' }])} className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm">Paracetamol 500mg</Button>
                <Button onClick={() => setMedications(prev => [...prev, { name: 'Ibuprofen', dosage: '200mg', time: '8:00 PM' }])} className="bg-red-500 hover:bg-red-600 text-white text-sm">Ibuprofen 200mg</Button>
                <Button onClick={() => setMedications(prev => [...prev, { name: 'Amoxicillin', dosage: '500mg', time: '12:00 PM' }])} className="bg-green-600 hover:bg-green-700 text-white text-sm">Amoxicillin 500mg</Button>
              </div>
            </div>

          <div className="pt-4 border-t" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input ref={nameRef} placeholder="Medication name" className="p-2 border rounded" />
            <input ref={dosageRef} placeholder="Dosage (e.g., 500mg)" className="p-2 border rounded" />
            <input ref={timeRef} placeholder="Time (e.g., 8:00 AM)" className="p-2 border rounded" />
          </div>
          <div className="flex gap-2">
            <Button onClick={addMedication} className="bg-green-500 hover:bg-green-600 text-white">Add Medication</Button>
            <Button onClick={() => analyzeInteractions(medications)} className="bg-indigo-500 hover:bg-indigo-600 text-white" disabled={medications.length < 2 || isAnalyzing}>{isAnalyzing ? 'Analyzing...' : 'Analyze Interactions'}</Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Current Medication List</h4>
            {medications.length === 0 && <div className="text-sm text-gray-500">No medications added yet.</div>}
            {medications.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-sm text-gray-600">{m.dosage} • {m.time}</div>
                </div>
                <div>
                  <Button className="bg-red-400 hover:bg-red-500 text-white" onClick={() => removeMedication(idx)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t" />

          <div>
            <h4 className="font-semibold mb-2">Interaction Analysis</h4>
            {isAnalyzing && <div className="text-sm text-gray-500">Analyzing medication interactions...</div>}
            {!isAnalyzing && !analysisResult && medications.length < 2 && (
              <div className="text-sm text-gray-500">Add two or more medications and the system will automatically analyze potential interactions.</div>
            )}

            {!isAnalyzing && analysisResult && (
              <div className={`p-3 rounded ${analysisResult.safe ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="mb-2">
                  <span className="font-semibold">Status: </span>
                  <span className={`${analysisResult.safe ? 'text-green-700' : 'text-red-700'}`}>{analysisResult.safe ? 'No significant interactions detected' : 'Potential interactions detected'}</span>
                </div>
                {!analysisResult.safe && analysisResult.interactions && analysisResult.interactions.length > 0 && (
                  <div className="mb-2">
                    <div className="font-semibold">Interactions:</div>
                    <ul className="list-disc ml-5 mt-2 text-sm">
                      {analysisResult.interactions.map((it, i) => (
                        <li key={i}>
                          <strong>{it.medications?.join(' + ') || 'Unnamed'}</strong>: {it.interaction} <em className="text-xs text-gray-500">({it.severity})</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="font-semibold">Recommendations</div>
                <div className="text-sm text-gray-700 mt-1">{analysisResult.recommendations}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MedicationScheduler;