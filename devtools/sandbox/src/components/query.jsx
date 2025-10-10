import React, { useState } from 'react';
import config from '#config';


export default function QuestionForm() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

	async function askbot(question) {
		setAnswer('asking qwen ' + question);
		const res = await fetch(config.API_URL+'/api/v1/test/ask', {
			method: 'POST',
        headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: question
			})
		});
		if (!res.ok) {
			const err = await res.json();
			setAnswer(err.error);
		} else {
			const text = await res.json();
			setAnswer(text.response);
			console.log(text);
		}
	}
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted question:', question);
	askbot(question);
    setQuestion('');
  };

  return (
	  <div>
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 border rounded-lg shadow-sm">
      <label htmlFor="question" className="block text-lg font-semibold mb-2">
        Your Question
      </label>
      <textarea
        id="question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question here..."
        rows={4}
        className="w-full border rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-300"
      />
      <button
        type="submit"
        className="mt-3 w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
	  <div>Answer below:</div>
	  <div>{answer}</div>
	  </div>
  );
}

