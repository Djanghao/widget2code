// Quick test to verify Doubao model works
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testDoubao() {
  const API_URL = 'http://localhost:8010/api/generate-widget-text';

  const formData = new FormData();
  formData.append('system_prompt', 'You are a widget design assistant. Generate a simple JSON widget spec.');
  formData.append('user_prompt', 'Create a simple weather widget showing temperature and conditions.');

  console.log('Testing Doubao model integration...');
  console.log('Sending request to:', API_URL);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const result = await response.json();
    console.log('Success!', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Request failed:', error.message);
    process.exit(1);
  }
}

testDoubao();
